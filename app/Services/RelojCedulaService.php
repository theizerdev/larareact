<?php

namespace App\Services;

use App\Models\RelojBiometricoCedula;
use App\Models\RelojBiometricoCedulaItem;
use App\Models\RelojCedulaActividadCatalogo;
use App\Models\RelojEquipoBiometrico;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RelojCedulaService
{
    /**
     * Sincroniza el catálogo maestro de actividades a partir de las filas de la hoja "Cédula de Instalación".
     *
     * @param array $rows Filas extraídas del Excel
     * @return Collection Colección de RelojCedulaActividadCatalogo
     */
    public function syncCatalogoFromRows(array $rows): Collection
    {
        $activities = (isset($rows[0]['etapa_num']) || isset($rows[0]['numero_actividad']))
            ? $rows
            : $this->parseRowsToActivities($rows);

        if (empty($activities)) {
            return RelojCedulaActividadCatalogo::where('activo', true)
                ->orderBy('orden')
                ->get();
        }

        DB::transaction(function () use ($activities) {
            foreach ($activities as $act) {
                RelojCedulaActividadCatalogo::updateOrCreate(
                    [
                        'etapa_num' => $act['etapa_num'],
                        'sub_etapa_letra' => $act['sub_etapa_letra'],
                        'numero_actividad' => $act['numero_actividad'],
                    ],
                    [
                        'etapa_nombre' => $act['etapa_nombre'],
                        'sub_etapa_nombre' => $act['sub_etapa_nombre'],
                        'orden' => $act['orden'],
                        'descripcion' => $act['descripcion'],
                        'tipo' => $act['tipo'],
                        'responsable_default' => $act['responsable_default'],
                        'valida_default' => $act['valida_default'],
                        'fecha_compromiso_default' => $act['fecha_compromiso_default'],
                        'entregable_evidencia' => $act['entregable_evidencia'],
                        'observaciones_default' => $act['observaciones_default'],
                        'activo' => true,
                    ]
                );
            }
        });

        return RelojCedulaActividadCatalogo::where('activo', true)
            ->orderBy('orden')
            ->get();
    }

    /**
     * Parsea las filas de la hoja Cédula de Instalación extrayendo etapas, sub-etapas y actividades.
     */
    public function parseRowsToActivities(array $rows): array
    {
        $activities = [];
        $currentEtapaNum = 1;
        $currentEtapaNombre = '1 - Etapa de Preparación';
        $currentSubEtapaLetra = 'A';
        $currentSubEtapaNombre = 'A - Relacionado a las condiciones de instalacion';
        $orden = 0;

        foreach ($rows as $rNum => $row) {
            $a = trim((string) ($row['A'] ?? ''));
            $b = trim((string) ($row['B'] ?? ''));

            // 1. Detectar Etapa Principal (ej. "1 - Etapa de Preparación", "2 - Etapa de habilitación de Datos", "3 - Nuevas Instalaciones...")
            if (preg_match('/^(\d+)\s*-\s*(.+)$/i', $a, $m)) {
                $currentEtapaNum = (int) $m[1];
                $currentEtapaNombre = $a;
                continue;
            }

            // 2. Detectar Sub-Etapa (ej. "A - Relacionado a las condiciones...", "B - Relacionado a la entrega...")
            if (preg_match('/^([A-Z])\s*-\s*(.+)$/i', $a, $m)) {
                $currentSubEtapaLetra = strtoupper($m[1]);
                $currentSubEtapaNombre = $a;
                continue;
            }

            // 3. Detectar Actividad (A es número secuencial 1, 2, 3... y B es la descripción)
            if (is_numeric($a) && $b !== '') {
                $orden++;
                $numAct = (int) $a;
                $tipoRaw = strtolower(trim((string) ($row['C'] ?? '')));
                $tipo = ($tipoRaw === 'inicial') ? 'Inicial' : 'Nuevo';

                // Convertir fecha de Excel a formato legible si es número de serie (ej. 46329)
                $fechaComp = trim((string) ($row['F'] ?? ''));
                if (is_numeric($fechaComp) && (int) $fechaComp > 30000 && (int) $fechaComp < 60000) {
                    $unix = ((int) $fechaComp - 25569) * 86400;
                    $fechaComp = gmdate('Y-m-d', $unix);
                }

                $activities[] = [
                    'etapa_num' => $currentEtapaNum,
                    'etapa_nombre' => $currentEtapaNombre,
                    'sub_etapa_letra' => $currentSubEtapaLetra,
                    'sub_etapa_nombre' => $currentSubEtapaNombre,
                    'orden' => $orden,
                    'numero_actividad' => $numAct,
                    'descripcion' => $b,
                    'tipo' => $tipo,
                    'responsable_default' => trim((string) ($row['D'] ?? '')) ?: null,
                    'valida_default' => trim((string) ($row['E'] ?? '')) ?: null,
                    'fecha_compromiso_default' => $fechaComp ?: null,
                    'entregable_evidencia' => trim((string) ($row['G'] ?? '')) ?: null,
                    'observaciones_default' => trim((string) ($row['H'] ?? '')) ?: null,
                ];
            }
        }

        return $activities;
    }

    /**
     * Inicializa o sincroniza la Cédula de Instalación para un equipo biométrico.
     * No sobreescribe items que ya tengan estado 'completada' o evidencias registradas.
     */
    public function syncCedulaParaEquipo(RelojEquipoBiometrico $equipo, ?string $grupoInst = null, ?Collection $catalogo = null): RelojBiometricoCedula
    {
        $catalogo = $catalogo ?? RelojCedulaActividadCatalogo::where('activo', true)->orderBy('orden')->get();

        $cedula = RelojBiometricoCedula::firstOrCreate(
            ['reloj_equipo_biometrico_id' => $equipo->id],
            [
                'etapa_actual_num' => 1,
                'sub_etapa_actual_letra' => 'A',
                'porcentaje_avance' => 0.00,
                'total_actividades' => $catalogo->count(),
                'actividades_completadas' => 0,
                'estado' => 'pendiente',
            ]
        );

        $existingItems = $cedula->items()->get()->keyBy('catalogo_actividad_id');

        foreach ($catalogo as $cat) {
            if ($existingItems->has($cat->id)) {
                continue;
            }

            // Asignar responsable por defecto de la actividad o del equipo si coincide
            $resp = $cat->responsable_default;
            if (empty($resp) && ! empty($equipo->actual_responsable)) {
                $resp = $equipo->actual_responsable;
            }

            $obs = $cat->observaciones_default;
            if (! empty($grupoInst) && empty($obs)) {
                $obs = $grupoInst;
            }

            RelojBiometricoCedulaItem::create([
                'reloj_biometrico_cedula_id' => $cedula->id,
                'catalogo_actividad_id' => $cat->id,
                'etapa_num' => $cat->etapa_num,
                'sub_etapa_letra' => $cat->sub_etapa_letra,
                'numero_actividad' => $cat->numero_actividad,
                'estado' => 'pendiente',
                'responsable' => $resp,
                'valida' => $cat->valida_default,
                'fecha_compromiso' => $cat->fecha_compromiso_default,
                'fecha_realizada' => null,
                'evidencia_path' => null,
                'evidencia_tipo' => null,
                'observaciones' => $obs,
            ]);
        }

        $cedula->recalcularProgreso();

        return $cedula;
    }

    /**
     * Obtiene la Cédula completa estructurada con árbol de Etapas, Sub-etapas y estados de bloqueo.
     */
    public function getCedulaTree(RelojEquipoBiometrico $equipo): array
    {
        $cedula = $equipo->cedula;
        if (! $cedula) {
            $cedula = $this->syncCedulaParaEquipo($equipo);
        }

        $items = $cedula->items()
            ->with(['catalogo', 'validadoPor'])
            ->get();

        // Agrupar por Etapa y Sub-Etapa
        $grouped = [];
        foreach ($items as $item) {
            $eNum = $item->etapa_num;
            $sLetra = $item->sub_etapa_letra;

            if (! isset($grouped[$eNum])) {
                $grouped[$eNum] = [
                    'etapa_num' => $eNum,
                    'etapa_nombre' => $item->catalogo->etapa_nombre ?? "Etapa {$eNum}",
                    'total' => 0,
                    'completadas' => 0,
                    'porcentaje' => 0,
                    'is_completed' => false,
                    'is_locked' => false,
                    'sub_etapas' => [],
                ];
            }

            if (! isset($grouped[$eNum]['sub_etapas'][$sLetra])) {
                $grouped[$eNum]['sub_etapas'][$sLetra] = [
                    'sub_etapa_letra' => $sLetra,
                    'sub_etapa_nombre' => $item->catalogo->sub_etapa_nombre ?? "Sub-Etapa {$sLetra}",
                    'total' => 0,
                    'completadas' => 0,
                    'porcentaje' => 0,
                    'is_completed' => false,
                    'is_locked' => false,
                    'actividades' => [],
                ];
            }

            $isDone = in_array($item->estado, ['completada', 'no_aplica'], true);

            $grouped[$eNum]['total']++;
            if ($isDone) {
                $grouped[$eNum]['completadas']++;
            }

            $grouped[$eNum]['sub_etapas'][$sLetra]['total']++;
            if ($isDone) {
                $grouped[$eNum]['sub_etapas'][$sLetra]['completadas']++;
            }

            $grouped[$eNum]['sub_etapas'][$sLetra]['actividades'][] = [
                'id' => $item->id,
                'catalogo_id' => $item->catalogo_actividad_id,
                'numero_actividad' => $item->numero_actividad,
                'descripcion' => $item->catalogo->descripcion ?? '',
                'tipo' => $item->catalogo->tipo ?? 'Nuevo',
                'estado' => $item->estado,
                'responsable' => $item->responsable,
                'valida' => $item->valida,
                'fecha_compromiso' => $item->fecha_compromiso,
                'fecha_realizada' => $item->fecha_realizada,
                'entregable_evidencia' => $item->catalogo->entregable_evidencia ?? '',
                'evidencia_path' => $item->evidencia_path,
                'evidencia_tipo' => $item->evidencia_tipo,
                'observaciones' => $item->observaciones,
                'validado_por' => $item->validadoPor ? [
                    'id' => $item->validadoPor->id,
                    'name' => $item->validadoPor->name,
                ] : null,
                'validado_at' => $item->validado_at?->format('Y-m-d H:i:s'),
            ];
        }

        // Calcular porcentajes y aplicar reglas de bloqueo secuencial
        $prevEtapaCompleted = true;

        foreach ($grouped as $eNum => &$etapa) {
            $etapa['porcentaje'] = $etapa['total'] > 0
                ? round(($etapa['completadas'] / $etapa['total']) * 100, 1)
                : 0;
            $etapa['is_completed'] = ($etapa['completadas'] === $etapa['total'] && $etapa['total'] > 0);

            // Bloquear Etapa si la anterior no está 100% completada
            $etapa['is_locked'] = ! $prevEtapaCompleted;
            $prevEtapaCompleted = $etapa['is_completed'];

            $prevSubEtapaCompleted = ! $etapa['is_locked'];

            foreach ($etapa['sub_etapas'] as $sLetra => &$sub) {
                $sub['porcentaje'] = $sub['total'] > 0
                    ? round(($sub['completadas'] / $sub['total']) * 100, 1)
                    : 0;
                $sub['is_completed'] = ($sub['completadas'] === $sub['total'] && $sub['total'] > 0);

                // Bloquear Sub-Etapa si la etapa está bloqueada o si la sub-etapa anterior no se completó
                $sub['is_locked'] = ! $prevSubEtapaCompleted;
                $prevSubEtapaCompleted = $prevSubEtapaCompleted && $sub['is_completed'];
            }
            unset($sub);
            $etapa['sub_etapas'] = array_values($etapa['sub_etapas']);
        }
        unset($etapa);

        return [
            'cedula_id' => $cedula->id,
            'reloj_equipo_biometrico_id' => $equipo->id,
            'porcentaje_avance' => (float) $cedula->porcentaje_avance,
            'total_actividades' => (int) $cedula->total_actividades,
            'actividades_completadas' => (int) $cedula->actividades_completadas,
            'estado' => $cedula->estado,
            'etapa_actual_num' => (int) $cedula->etapa_actual_num,
            'sub_etapa_actual_letra' => $cedula->sub_etapa_actual_letra,
            'etapas' => array_values($grouped),
        ];
    }

    /**
     * Actualiza una actividad de la Cédula validando dependencias y permisos.
     */
    public function updateItem(RelojBiometricoCedulaItem $item, array $data, ?int $usuarioId = null): RelojBiometricoCedulaItem
    {
        $estadoAnterior = $item->estado;
        $nuevoEstado = $data['estado'] ?? $item->estado;

        // Si se intenta marcar como completada, verificar que las sub-etapas previas estén completas
        if ($nuevoEstado === 'completada' && $estadoAnterior !== 'completada') {
            $this->validateItemCanBeCompleted($item);
            $item->validado_por_usuario_id = $usuarioId;
            $item->validado_at = now();
            if (empty($data['fecha_realizada'])) {
                $item->fecha_realizada = now()->format('Y-m-d');
            }
        } elseif ($nuevoEstado !== 'completada') {
            $item->validado_por_usuario_id = null;
            $item->validado_at = null;
        }

        $fields = [
            'estado',
            'responsable',
            'valida',
            'fecha_compromiso',
            'fecha_realizada',
            'evidencia_path',
            'evidencia_tipo',
            'observaciones',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $item->{$field} = $data[$field];
            }
        }

        $item->save();
        $item->cedula->recalcularProgreso();

        return $item;
    }

    /**
     * Valida que un item no pueda completarse si las etapas o sub-etapas previas están pendientes.
     */
    protected function validateItemCanBeCompleted(RelojBiometricoCedulaItem $item): void
    {
        $cedula = $item->cedula;

        // 1. Validar que no haya etapas previas incompletas
        $incompletasPreviasEtapa = $cedula->items()
            ->where('etapa_num', '<', $item->etapa_num)
            ->whereNotIn('estado', ['completada', 'no_aplica'])
            ->exists();

        if ($incompletasPreviasEtapa) {
            throw new \InvalidArgumentException("No puedes completar actividades de la Etapa {$item->etapa_num} sin haber finalizado las Etapas previas.");
        }

        // 2. Validar que no haya sub-etapas previas de la misma etapa incompletas
        $incompletasPreviasSub = $cedula->items()
            ->where('etapa_num', $item->etapa_num)
            ->where('sub_etapa_letra', '<', $item->sub_etapa_letra)
            ->whereNotIn('estado', ['completada', 'no_aplica'])
            ->exists();

        if ($incompletasPreviasSub) {
            throw new \InvalidArgumentException("No puedes completar actividades de la Sub-Etapa {$item->sub_etapa_letra} sin haber finalizado las Sub-Etapas previas.");
        }
    }
}
