<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductorEmpleado extends Model
{
    use HasFactory;

    protected $table = 'productor_empleados';

    protected $fillable = [
        'productor_id',
        'nombres',
        'apellidos',
        'documento_identidad',
        'genero',
        'fecha_nacimiento',
        'edad',
        'correo',
        'cargo',
        'foto_carnet',
        'documento_frontal',
        'documento_reverso',
        'empresa_id',
        'sucursal_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
            'edad' => 'integer',
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
