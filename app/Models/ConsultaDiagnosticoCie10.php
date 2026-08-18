<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultaDiagnosticoCie10 extends Model
{
    use HasFactory;

    protected $table = 'consulta_diagnosticos_cie10';

    protected $fillable = [
        'consulta_id',
        'codigo',
        'nombre',
        'tipo',
        'observaciones',
    ];

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(ConsultaMedica::class, 'consulta_id');
    }
}
