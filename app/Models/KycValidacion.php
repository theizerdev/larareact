<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Resultado de una validación de identidad (KYC) ejecutada contra JAAK para una
 * persona pre-registrada. La orquestación de las llamadas vive en
 * App\Jobs\ProcesarKycValidacion; este modelo sólo guarda el resultado.
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

    protected $fillable = [
        'validable_type',
        'validable_id',
        'empresa_id',
        'sucursal_id',
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
