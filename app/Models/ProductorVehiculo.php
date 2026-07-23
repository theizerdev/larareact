<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductorVehiculo extends Model
{
    use HasFactory;

    protected $table = 'productor_vehiculos';

    protected $fillable = [
        'productor_id',
        'tipo_vehiculo',
        'marca',
        'modelo',
        'year',
        'placa',
        'foto_frontal',
        'foto_trasera',
        'empresa_id',
        'sucursal_id',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
        ];
    }

    public function productor(): BelongsTo
    {
        return $this->belongsTo(Productor::class, 'productor_id');
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
