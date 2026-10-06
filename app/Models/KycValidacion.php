<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Resultado de una validación de identidad (KYC) de una persona registrada.
 * El proveedor es JAAK (INE, orquestado por App\Jobs\ProcesarKycValidacion) o
 * DIDIT (pasaporte / documento extranjero / capa antifraude, página hospedada,
 * resultado por App\Services\Validaciones\DiditSincronizador). Este modelo
 * sólo guarda el resultado.
 */
class KycValidacion extends Model
{
    use Multitenantable;

    protected $table = 'kyc_validaciones';

    public const ESTATUS_PENDIENTE = 'pendiente';
    public const ESTATUS_PROCESANDO = 'procesando';
    public const ESTATUS_APROBADO = 'aprobado';
    public const ESTATUS_REVISION = 'revision';
    public const ESTATUS_RECHAZADO = 'rechazado';
    public const ESTATUS_ERROR = 'error';

    public const PROVEEDOR_JAAK = 'jaak';
    public const PROVEEDOR_DIDIT = 'didit';

    public const DOCUMENTO_INE = 'ine';
    public const DOCUMENTO_PASAPORTE = 'pasaporte';

    protected $fillable = [
        'validable_type',
        'validable_id',
        'empresa_id',
        'sucursal_id',
        'operacion_id',
        'proveedor',
        'tipo_documento',
        'pais_documento',
        'didit_session_id',
        'didit_url',
        'didit_estatus',
        'curp_capturada',
        'jaak_environment',
        'jaak_session_id',
        'jaak_short_key',
        'estatus',
        'curp_valida',
        'ine_valida',
        'rostro_coincide',
        'en_listas',
        'score_global',
        'resultado_documento',
        'resultado_ocr',
        'resultado_listas',
        'resultado_biometrico',
        'observaciones',
        'error_detalle',
        'procesado_en',
    ];

    protected $hidden = [
        'didit_url',
    ];

    protected function casts(): array
    {
        return [
            'curp_valida' => 'boolean',
            'ine_valida' => 'boolean',
            'rostro_coincide' => 'boolean',
            'en_listas' => 'boolean',
            'score_global' => 'decimal:2',
            'resultado_documento' => 'array',
            'resultado_ocr' => 'array',
            'resultado_listas' => 'array',
            'resultado_biometrico' => 'array',
            'procesado_en' => 'datetime',
        ];
    }

    public function validable(): MorphTo
    {
        return $this->morphTo();
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function operacion(): BelongsTo
    {
        return $this->belongsTo(OperacionValidacion::class, 'operacion_id');
    }

    /** Severidad para consolidar varias validaciones de una persona (JAAK + DIDIT). */
    private const SEVERIDAD = [
        self::ESTATUS_APROBADO => 1,
        self::ESTATUS_PENDIENTE => 2,
        self::ESTATUS_PROCESANDO => 2,
        self::ESTATUS_ERROR => 3,
        self::ESTATUS_REVISION => 4,
        self::ESTATUS_RECHAZADO => 5,
    ];

    /**
     * Estatus vigente de la persona: el más severo entre la última validación
     * de cada proveedor. Así un aprobado de JAAK no tapa un rechazo de DIDIT.
     */
    public static function estatusConsolidado(Model $persona): ?string
    {
        return static::withoutGlobalScopes()
            ->where('validable_type', $persona->getMorphClass())
            ->where('validable_id', $persona->getKey())
            ->orderBy('id')
            ->get(['id', 'proveedor', 'estatus'])
            ->keyBy(fn (self $v) => $v->proveedor ?: self::PROVEEDOR_JAAK)
            ->pluck('estatus')
            ->sortByDesc(fn ($estatus) => self::SEVERIDAD[$estatus] ?? 0)
            ->first();
    }

    public function esDidit(): bool
    {
        return $this->proveedor === self::PROVEEDOR_DIDIT;
    }

    public function estaFinalizada(): bool
    {
        return in_array($this->estatus, [
            self::ESTATUS_APROBADO,
            self::ESTATUS_REVISION,
            self::ESTATUS_RECHAZADO,
            self::ESTATUS_ERROR,
        ], true);
    }
}
