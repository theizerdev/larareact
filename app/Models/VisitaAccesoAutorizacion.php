<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class VisitaAccesoAutorizacion extends Model
{
    use HasFactory;

    protected $table = 'visita_acceso_autorizaciones';

    protected $fillable = [
        'token',
        'responsable_id',
        'empleado_id',
        'solicitante_id',
        'tipo_acceso',
        'datos_solicitud',
        'motivo_autorizacion',
        'status',
        'autorizado_at',
        'empresa_id',
        'sucursal_id',
    ];

    protected $casts = [
        'datos_solicitud' => 'array',
        'autorizado_at' => 'datetime',
    ];

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class, 'responsable_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public static function generarToken(): string
    {
        return Str::random(40);
    }
}
