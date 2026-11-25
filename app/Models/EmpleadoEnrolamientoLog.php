<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmpleadoEnrolamientoLog extends Model
{
    protected $table = 'empleado_enrolamiento_logs';

    public const ACCION_AVISO_PRIVACIDAD = 'aviso_privacidad';
    public const ACCION_ENROLAMIENTO = 'enrolamiento';

    protected $fillable = [
        'uuid',
        'cedula_id',
        'empleado_id',
        'empresa_id',
        'user_id',
        'accion',
        'etiqueta',
        'descripcion',
        'origen',
        'ip_address',
        'user_agent',
        'latitud',
        'longitud',
        'metadata',
        'hash_evento',
        'ocurrido_en',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'float',
            'longitud' => 'float',
            'metadata' => 'array',
            'ocurrido_en' => 'datetime',
        ];
    }

    public function cedula(): BelongsTo
    {
        return $this->belongsTo(EmpleadoEnrolamientoCedula::class, 'cedula_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
