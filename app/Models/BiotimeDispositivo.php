<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Espejo local de un reloj checador de BioTime (GET /iclock/api/terminals/).
 * Solo lectura: lo refresca BioTimeSyncService en cada corrida.
 */
class BiotimeDispositivo extends Model
{
    protected $table = 'biotime_dispositivos';

    protected $fillable = [
        'empresa_id',
        'biotime_id',
        'sn',
        'alias',
        'ip_address',
        'area_name',
        'state',
        'last_activity',
        'fw_ver',
        'user_count',
        'fp_count',
        'face_count',
        'palm_count',
        'transaction_count',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
            'raw' => 'array',
        ];
    }

    /**
     * ¿El terminal reportó estar en línea en la última sincronización?
     */
    public function getEnLineaAttribute(): bool
    {
        return (int) $this->state === 1;
    }
}
