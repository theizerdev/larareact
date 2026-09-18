<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProveedorVehiculo extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'proveedor_vehiculos';

    protected $fillable = [
        'proveedor_id',
        'tipo_vehiculo',
        'categoria_vehiculo',
        'subtipo_carroceria',
        'marca',
        'modelo',
        'year',
        'placa',
        'numero_serie_vin',
        'numero_ejes',
        'tarjeta_circulacion',
        'aseguradora',
        'poliza_seguro',
        'vigencia_seguro',
        'foto_frontal',
        'foto_trasera',
        'tiene_remolque',
        'remolque_fabricante',
        'remolque_serie_fabricante',
        'remolque_vin',
        'remolque_placa',
        'remolque_tipo',
        'remolque_modelo',
        'remolque_year',
        'remolque_peso_bruto_vehicular',
        'remolque_peso_vehicular',
        'remolque_capacidad_carga',
        'remolque_largo',
        'remolque_ancho',
        'remolque_alto',
        'remolque_ejes',
        'remolque_capacidad_ejes',
        'remolque_tipo_suspension',
        'remolque_capacidad_patines',
        'remolque_cantidad_llantas',
        'remolque_medida_llantas',
        'remolque_presion_llantas',
        'remolque_foto_placa',
        'remolque_foto_lateral',
        'empresa_id',
        'sucursal_id',
    ];

    protected $casts = [
        'year' => 'integer',
        'numero_ejes' => 'integer',
        'vigencia_seguro' => 'date',
        'tiene_remolque' => 'boolean',
        'remolque_year' => 'integer',
        'remolque_ejes' => 'integer',
        'remolque_cantidad_llantas' => 'integer',
    ];

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
