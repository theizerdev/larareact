<?php

namespace App\Services;

use App\Models\ReparacionChecklistItem;

class PostServicioChecklistService
{
    /**
     * Catálogo base del sistema para la sección "validacion" (24 puntos oficiales de taller).
     */
    public static function defaultValidacion(): array
    {
        return [
            ['nombre' => 'Pantalla / Touch Display',                  'icono' => '🖥️', 'orden' => 1],
            ['nombre' => 'Prueba de Llamadas & Micrófono Audio',      'icono' => '📞', 'orden' => 2],
            ['nombre' => 'Altavoz Principal / Bocina Speaker',        'icono' => '🔊', 'orden' => 3],
            ['nombre' => 'Micrófono Inferior de Voz',                 'icono' => '🎙️', 'orden' => 4],
            ['nombre' => 'Conectividad Wi-Fi (Carga/Descarga)',       'icono' => '📶', 'orden' => 5],
            ['nombre' => 'Conectividad Bluetooth',                    'icono' => '🔵', 'orden' => 6],
            ['nombre' => 'Cámara Frontal & Grabación',                'icono' => '🤳', 'orden' => 7],
            ['nombre' => 'Cámara Trasera Principal & Zoom',           'icono' => '📸', 'orden' => 8],
            ['nombre' => 'Botón Físico Power / Bloqueo',              'icono' => '⏏️', 'orden' => 9],
            ['nombre' => 'Botón Físico Volumen +',                    'icono' => '🔈', 'orden' => 10],
            ['nombre' => 'Botón Físico Volumen -',                    'icono' => '🔇', 'orden' => 11],
            ['nombre' => 'Lector de Huella Dactilar Fingerprint',     'icono' => '👆', 'orden' => 12],
            ['nombre' => 'Sensor de Reconocimiento Facial Face ID',   'icono' => '😊', 'orden' => 13],
            ['nombre' => 'Puerto de Carga / USB Data Transfer',       'icono' => '🔌', 'orden' => 14],
            ['nombre' => 'Vibrador Interno Haptic Engine',            'icono' => '📳', 'orden' => 15],
            ['nombre' => 'Flash LED / Linterna',                      'icono' => '🔦', 'orden' => 16],
            ['nombre' => 'Sensor de Proximidad Llamadas',             'icono' => '📏', 'orden' => 17],
            ['nombre' => 'Lector de Tarjeta SIM',                     'icono' => '📡', 'orden' => 18],
            ['nombre' => 'Lector de Tarjeta MicroSD',                 'icono' => '💾', 'orden' => 19],
            ['nombre' => 'Módulo de Posicionamiento GPS',             'icono' => '🗺️', 'orden' => 20],
            ['nombre' => 'Sensor Giroscopio & Acelerómetro',          'icono' => '🔄', 'orden' => 21],
            ['nombre' => 'Botón Físico Home / Inicio',                'icono' => '🖲️', 'orden' => 22],
            ['nombre' => 'Puerto / Jack de Audio 3.5mm',              'icono' => '🎧', 'orden' => 23],
            ['nombre' => 'Carga Inalámbrica Qi',                      'icono' => '⚡', 'orden' => 24],
        ];
    }

    /**
     * Catálogo base para la sección "limpieza" (5 puntos).
     */
    public static function defaultLimpieza(): array
    {
        return [
            ['nombre' => 'Pantalla limpia',        'icono' => '✨', 'orden' => 1],
            ['nombre' => 'Carcasa limpia',          'icono' => '🧹', 'orden' => 2],
            ['nombre' => 'Tornillos completos',     'icono' => '🔩', 'orden' => 3],
            ['nombre' => 'Sin piezas sobrantes',    'icono' => '✅', 'orden' => 4],
            ['nombre' => 'Sellos colocados',        'icono' => '🔒', 'orden' => 5],
        ];
    }

    /**
     * Catálogo base para la sección "qc" (6 puntos de Control de Calidad).
     */
    public static function defaultQc(): array
    {
        return [
            ['nombre' => 'Reparación completada',    'icono' => '✔️',  'orden' => 1],
            ['nombre' => 'Equipo probado',            'icono' => '🧪', 'orden' => 2],
            ['nombre' => 'Equipo limpio',             'icono' => '🧽', 'orden' => 3],
            ['nombre' => 'Garantía registrada',       'icono' => '📋', 'orden' => 4],
            ['nombre' => 'Cliente notificado',        'icono' => '📞', 'orden' => 5],
            ['nombre' => 'Equipo listo para entrega', 'icono' => '📦', 'orden' => 6],
        ];
    }

    /**
     * Obtiene los ítems del checklist para una empresa/sucursal.
     * Herencia: sucursal_id específico > empresa (sucursal_id NULL).
     */
    public function getChecklistForBranch(int $empresaId, ?int $sucursalId = null): array
    {
        $hasAnyRecord = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->exists();

        if (!$hasAnyRecord) {
            $this->seedDefaultsForEmpresa($empresaId, null);
        }

        // Buscar ítems específicos de la sucursal primero, luego de la empresa general
        $query = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId);

        if ($sucursalId) {
            $hasSucursalItems = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                ->where('empresa_id', $empresaId)
                ->where('sucursal_id', $sucursalId)
                ->exists();

            if ($hasSucursalItems) {
                $query->where('sucursal_id', $sucursalId);
            } else {
                $query->whereNull('sucursal_id');
            }
        } else {
            $query->whereNull('sucursal_id');
        }

        $items = $query->orderBy('orden')->get();

        return [
            'validacion' => $items->where('seccion', 'validacion')->values()->toArray(),
            'limpieza'   => $items->where('seccion', 'limpieza')->values()->toArray(),
            'qc'         => $items->where('seccion', 'qc')->values()->toArray(),
        ];
    }

    /**
     * Siembra los ítems por defecto del sistema para una empresa/sucursal.
     */
    public function seedDefaultsForEmpresa(int $empresaId, ?int $sucursalId = null): void
    {
        $secciones = [
            'validacion' => self::defaultValidacion(),
            'limpieza'   => self::defaultLimpieza(),
            'qc'         => self::defaultQc(),
        ];

        foreach ($secciones as $seccion => $items) {
            foreach ($items as $item) {
                // Evitar duplicados
                $exists = ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                    ->where('empresa_id', $empresaId)
                    ->where('sucursal_id', $sucursalId)
                    ->where('seccion', $seccion)
                    ->where('nombre', $item['nombre'])
                    ->exists();

                if (!$exists) {
                    ReparacionChecklistItem::withoutGlobalScope('multitenancy')
                        ->create([
                            'empresa_id'  => $empresaId,
                            'sucursal_id' => $sucursalId,
                            'seccion'     => $seccion,
                            'nombre'      => $item['nombre'],
                            'icono'       => $item['icono'] ?? null,
                            'orden'       => $item['orden'],
                            'activo'      => true,
                            'is_default'  => true,
                        ]);
                }
            }
        }
    }

    /**
     * Restaura los ítems por defecto para una empresa/sucursal, eliminando los personalizados.
     */
    public function resetToDefaults(int $empresaId, ?int $sucursalId = null): void
    {
        // Eliminar todos los ítems actuales de esta empresa/sucursal
        ReparacionChecklistItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->where(function ($q) use ($sucursalId) {
                if ($sucursalId) {
                    $q->where('sucursal_id', $sucursalId);
                } else {
                    $q->whereNull('sucursal_id');
                }
            })
            ->delete();

        // Sembrar de nuevo los por defecto
        $this->seedDefaultsForEmpresa($empresaId, $sucursalId);
    }
}
