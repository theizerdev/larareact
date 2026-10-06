<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Regla de validación de una entidad dentro de una empresa: identidad (JAAK
 * para INE, DIDIT para pasaporte / extranjero), DIDIT como capa antifraude y
 * firma ZapSign. Sin renglón se usa default(), que reproduce el
 * comportamiento previo a las reglas (KYC sí, antifraude no, firma no).
 */
class ValidacionRegla extends Model
{
    protected $table = 'validacion_reglas';

    /** Entidades configurables y la clase de persona que cae en cada una. */
    public const ENTIDADES = [
        'colaboradores' => [Empleado::class],
        'visitas' => [VisitaTemporal::class],
        'proveedores' => [Proveedor::class, ProveedorEmpleado::class],
        'socios' => [Productor::class, ProductorEmpleado::class],
    ];

    /**
     * Entidades cuyo alta ya entrega la liga de seguimiento a la persona, y por
     * eso pueden usar DIDIT como antifraude y firma ZapSign. El resto llega
     * en la fase 4; mientras, ahí sólo aplica el KYC de siempre.
     */
    public const ENTIDADES_CON_SEGUIMIENTO = ['colaboradores'];

    protected $fillable = [
        'empresa_id',
        'entidad',
        'kyc_activo',
        'didit_antifraude',
        'firma_activa',
        'plantilla_zapsign',
        'nombre_documento',
        'firma_obligatoria',
        'firma_valida_identidad',
    ];

    protected function casts(): array
    {
        return [
            'kyc_activo' => 'boolean',
            'didit_antifraude' => 'boolean',
            'firma_activa' => 'boolean',
            'firma_obligatoria' => 'boolean',
            'firma_valida_identidad' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public static function entidadDe(Model $modelo): ?string
    {
        foreach (self::ENTIDADES as $entidad => $clases) {
            if (in_array(get_class($modelo), $clases, true)) {
                return $entidad;
            }
        }

        return null;
    }

    /**
     * Regla vigente para la empresa y entidad; si no hay renglón, una
     * instancia sin guardar con los valores por defecto.
     */
    public static function para(?int $empresaId, ?string $entidad): self
    {
        $regla = ($empresaId && $entidad)
            ? static::where('empresa_id', $empresaId)->where('entidad', $entidad)->first()
            : null;

        return $regla ?? new self([
            'empresa_id' => $empresaId,
            'entidad' => $entidad,
            'kyc_activo' => true,
            'didit_antifraude' => false,
            'firma_activa' => false,
            'firma_obligatoria' => false,
            'firma_valida_identidad' => false,
        ]);
    }

    public function enviaFirma(): bool
    {
        return $this->firma_activa
            && ! empty($this->plantilla_zapsign)
            && $this->conSeguimiento();
    }

    public function conSeguimiento(): bool
    {
        return in_array($this->entidad, self::ENTIDADES_CON_SEGUIMIENTO, true);
    }
}
