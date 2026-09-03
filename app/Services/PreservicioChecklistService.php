<?php

namespace App\Services;

use App\Models\ReparacionPreservicioItem;

class PreservicioChecklistService
{
    /**
     * Catálogo base del sistema para la sección "fisica" (Inspección física y estética).
     */
    public static function defaultFisica(): array
    {
        return [
            ['nombre' => 'Pantalla / Touch Display',        'icono' => '🖥️', 'tipo_campo' => 'estado_obs', 'orden' => 1],
            ['nombre' => 'Cristal / Tapa Trasera',          'icono' => '🪟', 'tipo_campo' => 'estado_obs', 'orden' => 2],
            ['nombre' => 'Marco / Chasis Lateral',          'icono' => '📱', 'tipo_campo' => 'estado_obs', 'orden' => 3],
            ['nombre' => 'Botones Físicos (Power / Vol)',   'icono' => '⏏️', 'tipo_campo' => 'estado_obs', 'orden' => 4],
            ['nombre' => 'Bandeja SIM / Ranura SD',         'icono' => '📡', 'tipo_campo' => 'estado_obs', 'orden' => 5],
            ['nombre' => 'Cámara Trasera / Lente',          'icono' => '📸', 'tipo_campo' => 'estado_obs', 'orden' => 6],
            ['nombre' => 'Cámara Frontal / Sensores',       'icono' => '🤳', 'tipo_campo' => 'estado_obs', 'orden' => 7],
            ['nombre' => 'Tornillos / Ensamble',            'icono' => '🔩', 'tipo_campo' => 'estado_obs', 'orden' => 8],
            ['nombre' => 'Puerto de Carga / Jack Audio',    'icono' => '🔌', 'tipo_campo' => 'estado_obs', 'orden' => 9],
            ['nombre' => 'Humedad Visible / Sulfatación',   'icono' => '💧', 'tipo_campo' => 'estado_obs', 'orden' => 10],
            ['nombre' => 'Equipo Doblado / Deformado',      'icono' => '📐', 'tipo_campo' => 'estado_obs', 'orden' => 11],
            ['nombre' => 'Batería Inflada / Despegada',     'icono' => '🔋', 'tipo_campo' => 'estado_obs', 'orden' => 12],
        ];
    }

    /**
     * Catálogo base para la sección "funcional" (Pruebas de encendido y funcionamiento inicial).
     */
    public static function defaultFuncional(): array
    {
        return [
            ['nombre' => 'Enciende Correctamente',           'icono' => '⚡', 'tipo_campo' => 'boolean', 'orden' => 1],
            ['nombre' => 'Carga Batería Adecuadamente',      'icono' => '🔋', 'tipo_campo' => 'boolean', 'orden' => 2],
            ['nombre' => 'Acceso al Sistema Operativo',      'icono' => '📱', 'tipo_campo' => 'boolean', 'orden' => 3],
            ['nombre' => 'Táctil / Touch Funcional',         'icono' => '👆', 'tipo_campo' => 'boolean', 'orden' => 4],
            ['nombre' => 'Audio / Altavoz y Micrófono',      'icono' => '🔊', 'tipo_campo' => 'boolean', 'orden' => 5],
            ['nombre' => 'Conectividad Wi-Fi / Red',         'icono' => '📶', 'tipo_campo' => 'boolean', 'orden' => 6],
        ];
    }

    /**
     * Catálogo base para la sección "seguridad" (Seguridad, Bloqueos y Autorizaciones).
     */
    public static function defaultSeguridad(): array
    {
        return [
            ['nombre' => 'Verificación de Bloqueo (Patrón/PIN)', 'icono' => '🔒', 'tipo_campo' => 'boolean', 'orden' => 1],
            ['nombre' => 'Credenciales Entregadas por Cliente',   'icono' => '🔑', 'tipo_campo' => 'boolean', 'orden' => 2],
            ['nombre' => 'Autorización Diagnóstico y Apertura',   'icono' => '✍️', 'tipo_campo' => 'boolean', 'orden' => 3],
        ];
    }

    /**
     * Obtiene los ítems del checklist de preservicio para una empresa/sucursal.
     * Herencia: sucursal_id específico > empresa (sucursal_id NULL).
     */
    public function getChecklistForBranch(int $empresaId, ?int $sucursalId = null): array
    {
        $hasAnyRecord = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId)
            ->exists();

        if (!$hasAnyRecord) {
            $this->seedDefaultsForEmpresa($empresaId, null);
        }

        // Buscar ítems específicos de la sucursal primero, luego de la empresa general
        $query = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
            ->where('empresa_id', $empresaId);

        if ($sucursalId) {
            $hasSucursalItems = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
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
            'fisica'    => $items->where('seccion', 'fisica')->values()->toArray(),
            'funcional' => $items->where('seccion', 'funcional')->values()->toArray(),
            'seguridad' => $items->where('seccion', 'seguridad')->values()->toArray(),
        ];
    }

    /**
     * Siembra los ítems por defecto del sistema para una empresa/sucursal.
     */
    public function seedDefaultsForEmpresa(int $empresaId, ?int $sucursalId = null): void
    {
        $secciones = [
            'fisica'    => self::defaultFisica(),
            'funcional' => self::defaultFuncional(),
            'seguridad' => self::defaultSeguridad(),
        ];

        foreach ($secciones as $seccion => $items) {
            foreach ($items as $item) {
                // Evitar duplicados
                $exists = ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                    ->where('empresa_id', $empresaId)
                    ->where('sucursal_id', $sucursalId)
                    ->where('seccion', $seccion)
                    ->where('nombre', $item['nombre'])
                    ->exists();

                if (!$exists) {
                    ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
                        ->create([
                            'empresa_id'  => $empresaId,
                            'sucursal_id' => $sucursalId,
                            'seccion'     => $seccion,
                            'nombre'      => $item['nombre'],
                            'icono'       => $item['icono'] ?? null,
                            'tipo_campo'  => $item['tipo_campo'] ?? 'estado_obs',
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
        ReparacionPreservicioItem::withoutGlobalScope('multitenancy')
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
