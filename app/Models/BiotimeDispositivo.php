<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Espejo local de un reloj checador de BioTime (GET /iclock/api/terminals/).
 * Solo lectura: lo refresca BioTimeSyncService en cada corrida.
 *
 * Un reloj eliminado en Hoshō conserva su fila con `excluido_at`: el sync lo
 * sigue reconociendo y deja de bajar sus marcajes y a los empleados de las
 * áreas que se quedan sin reloj.
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
        'excluido_at',
        'raw',
    ];

    protected function casts(): array
    {
        return [
            'last_activity' => 'datetime',
            'excluido_at' => 'datetime',
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

    public function scopeVigentes(Builder $query): void
    {
        $query->whereNull('excluido_at');
    }

    public function scopeExcluidos(Builder $query): void
    {
        $query->whereNotNull('excluido_at');
    }

    /**
     * Áreas cuyos relojes se eliminaron todos. Un área que conserva al menos
     * un reloj vigente no cuenta.
     *
     * @return array<int,string>
     */
    public static function areasSinReloj(int $empresaId): array
    {
        $relojes = static::query()
            ->where('empresa_id', $empresaId)
            ->whereNotNull('area_name')
            ->get(['area_name', 'excluido_at']);

        $vigentes = $relojes->whereNull('excluido_at')->pluck('area_name');

        return $relojes->whereNotNull('excluido_at')
            ->pluck('area_name')
            ->unique()
            ->diff($vigentes)
            ->values()
            ->all();
    }

    /**
     * ¿Todas las áreas de un empleado se quedaron sin reloj? Quien no tiene
     * área en BioTime no se descarta.
     *
     * @param  array<int,string>|null  $areas
     * @param  array<int,string>  $areasSinReloj
     */
    public static function soloEnAreasSinReloj(?array $areas, array $areasSinReloj): bool
    {
        return $areasSinReloj !== [] && ! empty($areas) && array_diff($areas, $areasSinReloj) === [];
    }
}
