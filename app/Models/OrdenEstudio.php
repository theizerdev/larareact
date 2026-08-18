<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrdenEstudio extends Model
{
    use HasFactory;

    protected $table = 'ordenes_estudios';

    protected $fillable = [
        'consulta_id',
        'paciente_id',
        'medico_id',
        'indicaciones_generales',
        'status',
    ];

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'consulta_id');
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class, 'medico_id');
    }

    public function estudios(): HasMany
    {
        return $this->hasMany(OrdenEstudioItem::class, 'orden_estudio_id');
    }
}
