<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;

/**
 * Folio de operación: agrupa bajo un identificador único el alta o
 * pre-registro de una entidad, su validación de identidad (JAAK) y sus
 * documentos a firma (ZapSign). El estatus del folio se calcula a partir
 * de sus partes con recalcularEstatus().
 */
class OperacionValidacion extends Model
{
    use Multitenantable;

    protected $table = 'operaciones_validacion';

    public const TIPO_ALTA = 'alta';
    public const TIPO_PRERREGISTRO = 'prerregistro';
    public const TIPO_REVALIDACION = 'revalidacion';

    public const ORIGEN_PANEL = 'panel';
    public const ORIGEN_PRERREGISTRO = 'prerregistro';
    public const ORIGEN_TELEFONO = 'telefono';

    public const ESTATUS_EN_CURSO = 'en_curso';
    public const ESTATUS_COMPLETO = 'completo';
    public const ESTATUS_CON_OBSERVACIONES = 'con_observaciones';
    public const ESTATUS_RECHAZADO = 'rechazado';

    /** Prefijo del folio según la entidad titular. */
    public const PREFIJOS = [
        Sucursal::class => 'SUC',
        Departamento::class => 'DEP',
        Cargo::class => 'CAR',
        Responsable::class => 'RES',
        Empleado::class => 'COL',
        Proveedor::class => 'PRV',
        ProveedorEmpleado::class => 'PRV',
        Productor::class => 'SOC',
        ProductorEmpleado::class => 'SOC',
        VisitaTemporal::class => 'VIS',
    ];

    protected $fillable = [
        'folio',
        'tipo_operacion',
        'entidad_type',
        'entidad_id',
        'empresa_id',
        'sucursal_id',
        'origen',
        'iniciado_por',
        'estatus',
        'token_seguimiento',
        'token_expira_en',
    ];

    protected $hidden = [
        'token_seguimiento',
    ];

    protected function casts(): array
    {
        return [
            'token_expira_en' => 'datetime',
        ];
    }

    /** Horas de vigencia de la liga pública de seguimiento. */
    public const HORAS_SEGUIMIENTO = 72;

    public function entidad(): MorphTo
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

    public function iniciador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'iniciado_por');
    }

    public function kycValidaciones(): HasMany
    {
        return $this->hasMany(KycValidacion::class, 'operacion_id');
    }

    public function firmaDocumentos(): HasMany
    {
        return $this->hasMany(FirmaDocumento::class, 'operacion_id');
    }

    /**
     * Abre un folio nuevo para la entidad titular. El consecutivo es por
     * empresa, prefijo y día; si dos altas chocan en el mismo número se
     * reintenta con el siguiente.
     */
    public static function abrir(Model $entidad, string $tipo, string $origen, ?int $userId = null): self
    {
        $prefijo = self::PREFIJOS[get_class($entidad)] ?? 'OPE';
        $base = $prefijo.'-'.now()->format('Ymd').'-';
        $empresaId = $entidad->empresa_id ?? null;

        for ($intento = 0; ; $intento++) {
            $ultimo = static::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->where('folio', 'like', $base.'%')
                ->max('folio');

            $siguiente = $ultimo ? ((int) substr($ultimo, strlen($base))) + 1 : 1;

            try {
                return static::create([
                    'folio' => $base.str_pad((string) $siguiente, 4, '0', STR_PAD_LEFT),
                    'tipo_operacion' => $tipo,
                    'entidad_type' => $entidad->getMorphClass(),
                    'entidad_id' => $entidad->getKey(),
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $entidad->sucursal_id ?? null,
                    'origen' => $origen,
                    'iniciado_por' => $userId,
                    'estatus' => self::ESTATUS_EN_CURSO,
                ]);
            } catch (UniqueConstraintViolationException $e) {
                if ($intento >= 4) {
                    throw $e;
                }
            }
        }
    }

    /**
     * Liga pública donde la persona termina los pasos pendientes (DIDIT y
     * firma). Se genera la primera vez que hace falta y se renueva su vigencia.
     */
    public function urlSeguimiento(): string
    {
        if (empty($this->token_seguimiento)) {
            $this->token_seguimiento = Str::random(48);
        }

        $this->token_expira_en = now()->addHours(self::HORAS_SEGUIMIENTO);
        $this->saveQuietly();

        return route('validacion.seguimiento', $this->token_seguimiento);
    }

    /**
     * QR (SVG) de la liga de seguimiento, generado en el servidor: la liga
     * lleva un token, así que no se manda a un servicio externo de QR.
     */
    public static function qrSvg(string $url): string
    {
        $writer = new \BaconQrCode\Writer(new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(220, 1),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd(),
        ));

        return $writer->writeString($url);
    }

    public static function porTokenSeguimiento(string $token): ?self
    {
        if (strlen($token) < 32) {
            return null;
        }

        return static::withoutGlobalScopes()
            ->where('token_seguimiento', $token)
            ->where('token_expira_en', '>', now())
            ->first();
    }

    /**
     * Estatus del folio a partir de la última validación KYC de cada persona
     * y proveedor (JAAK y DIDIT cuentan por separado) y de cada documento a firma:
     *  - rechazado: alguna identidad o documento rechazado
     *  - en_curso: falta alguna identidad o firma
     *  - con_observaciones: identidad en revisión / con error, o firma cancelada / con error
     *  - completo: identidades aprobadas y documentos firmados
     */
    public function recalcularEstatus(): string
    {
        $kycs = $this->kycValidaciones()
            ->withoutGlobalScopes()
            ->orderBy('id')
            ->get()
            ->keyBy(fn (KycValidacion $v) => $v->validable_type.'#'.$v->validable_id.'#'.($v->proveedor ?: KycValidacion::PROVEEDOR_JAAK))
            ->pluck('estatus');

        $firmas = $this->firmaDocumentos()->withoutGlobalScopes()->pluck('estatus');

        $estatus = match (true) {
            $kycs->contains(KycValidacion::ESTATUS_RECHAZADO),
            $firmas->contains(FirmaDocumento::ESTATUS_RECHAZADO) => self::ESTATUS_RECHAZADO,

            $kycs->contains(KycValidacion::ESTATUS_PENDIENTE),
            $kycs->contains(KycValidacion::ESTATUS_PROCESANDO),
            $firmas->contains(FirmaDocumento::ESTATUS_PENDIENTE) => self::ESTATUS_EN_CURSO,

            $kycs->contains(KycValidacion::ESTATUS_REVISION),
            $kycs->contains(KycValidacion::ESTATUS_ERROR),
            $firmas->contains(FirmaDocumento::ESTATUS_CANCELADO),
            $firmas->contains(FirmaDocumento::ESTATUS_ERROR) => self::ESTATUS_CON_OBSERVACIONES,

            $kycs->isEmpty() && $firmas->isEmpty() => self::ESTATUS_EN_CURSO,

            default => self::ESTATUS_COMPLETO,
        };

        if ($estatus !== $this->estatus) {
            $this->forceFill(['estatus' => $estatus])->saveQuietly();
        }

        return $estatus;
    }
}
