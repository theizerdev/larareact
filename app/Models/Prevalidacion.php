<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;

/**
 * Validación rápida hecha desde el formulario de alta, antes de que exista el
 * registro: RFC de la empresa (TRUORA) o nombre + CURP de la persona (DIDIT,
 * RENAPO). Al guardar el registro se convierte en una fila de kyc_validaciones
 * (kyc_validacion_id) para que quede en su folio y en Resultados de validaciones.
 */
class Prevalidacion extends Model
{
    use Multitenantable;

    protected $table = 'prevalidaciones';

    public const TIPO_RFC = 'rfc';
    public const TIPO_CURP = 'curp';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'tipo',
        'entidad',
        'proveedor',
        'dato',
        'nombre',
        'estatus',
        'referencia',
        'score',
        'resultado',
        'observaciones',
        'error_detalle',
        'kyc_validacion_id',
        'procesado_en',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'resultado' => 'array',
            'procesado_en' => 'datetime',
        ];
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function estaFinalizada(): bool
    {
        return ! in_array($this->estatus, [KycValidacion::ESTATUS_PENDIENTE, KycValidacion::ESTATUS_PROCESANDO], true);
    }
}
