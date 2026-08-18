<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiagnosticoCie10 extends Model
{
    use HasFactory;

    protected $table = 'diagnosticos_cie10';

    protected $fillable = [
        'empresa_id',
        'especialidad_id',
        'codigo',
        'nombre',
        'descripcion',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function especialidad(): BelongsTo
    {
        return $this->belongsTo(Especialidad::class, 'especialidad_id');
    }
}
