<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultaReposo extends Model
{
    use HasFactory;

    protected $table = 'consulta_reposos';

    protected $fillable = [
        'consulta_id',
        'empresa_id',
        'paciente_id',
        'medico_id',
        'tiene_reposo',
        'tipo_reposo',
        'dias_reposo',
        'fecha_inicio',
        'fecha_fin',
        'motivo_reposo',
        'observaciones',
    ];

    protected $casts = [
        'tiene_reposo' => 'boolean',
        'dias_reposo' => 'integer',
        'fecha_inicio' => 'date:Y-m-d',
        'fecha_fin' => 'date:Y-m-d',
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

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }
}
