<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RelojBiometricoCedula extends Model
{
    use HasFactory;

    protected $table = 'reloj_biometrico_cedulas';

    protected $fillable = [
        'reloj_equipo_biometrico_id',
        'etapa_actual_num',
        'sub_etapa_actual_letra',
        'porcentaje_avance',
        'total_actividades',
        'actividades_completadas',
        'estado',
        'fecha_inicio',
        'fecha_completada',
        'notas_generales',
    ];

    protected $casts = [
        'etapa_actual_num' => 'integer',
        'porcentaje_avance' => 'decimal:2',
        'total_actividades' => 'integer',
        'actividades_completadas' => 'integer',
        'fecha_inicio' => 'datetime',
        'fecha_completada' => 'datetime',
    ];

    public function equipoBiometrico()
    {
        return $this->belongsTo(RelojEquipoBiometrico::class, 'reloj_equipo_biometrico_id');
    }

    public function items()
    {
        return $this->hasMany(RelojBiometricoCedulaItem::class, 'reloj_biometrico_cedula_id')
            ->orderBy('etapa_num')
            ->orderBy('sub_etapa_letra')
            ->orderBy('numero_actividad');
    }

    /**
     * Recalcula el progreso, etapa/sub-etapa actual y estado general de la cédula.
     */
    public function recalcularProgreso(): self
    {
        $items = $this->items()->get();
        $total = $items->count();

        if ($total === 0) {
            $this->update([
                'total_actividades' => 0,
                'actividades_completadas' => 0,
                'porcentaje_avance' => 0.00,
                'estado' => 'pendiente',
            ]);
            return $this;
        }

        $completadas = $items->filter(fn ($it) => in_array($it->estado, ['completada', 'no_aplica'], true))->count();
        $porcentaje = round(($completadas / $total) * 100, 2);

        // Encontrar la primera actividad incompleta para determinar etapa y sub-etapa actual
        $primeraIncompleta = $items->first(fn ($it) => ! in_array($it->estado, ['completada', 'no_aplica'], true));

        $etapaActual = $primeraIncompleta ? $primeraIncompleta->etapa_num : 3;
        $subEtapaActual = $primeraIncompleta ? $primeraIncompleta->sub_etapa_letra : 'C';

        $estado = 'pendiente';
        if ($completadas === $total) {
            $estado = 'completada';
        } elseif ($completadas > 0 || $items->contains(fn ($it) => $it->estado === 'en_proceso')) {
            $estado = 'en_proceso';
        }

        $fechaInicio = $this->fecha_inicio ?? ($completadas > 0 ? now() : null);
        $fechaCompletada = ($estado === 'completada') ? ($this->fecha_completada ?? now()) : null;

        $this->update([
            'total_actividades' => $total,
            'actividades_completadas' => $completadas,
            'porcentaje_avance' => $porcentaje,
            'etapa_actual_num' => $etapaActual,
            'sub_etapa_actual_letra' => $subEtapaActual,
            'estado' => $estado,
            'fecha_inicio' => $fechaInicio,
            'fecha_completada' => $fechaCompletada,
        ]);

        return $this;
    }
}

