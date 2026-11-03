<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\RelojEquipoBiometrico;
use App\Models\RelojUbicacion;
use App\Models\Sucursal;
use Illuminate\Support\Facades\DB;
use ZipArchive;

class EquiposUbicacionesImportService
{
    /**
     * Analiza el archivo Excel (.xlsx) y devuelve la vista previa separada
     * para Ubicaciones (Pestaña 3) y Biométricos Setup (Pestaña 2).
     *
     * @param string $filePath Ruta del archivo subido
     * @param string $scope 'ambos' | 'ubicaciones' | 'biometricos'
     * @param int|null $empresaId
     */
    public function parsePreview(string $filePath, string $scope = 'ambos', ?int $empresaId = null): array
    {
        $empresaId = $this->resolveEmpresaId($empresaId);
        $sheets = $this->readWorkbookSheets($filePath);

        if (empty($sheets)) {
            return [
                'success' => false,
                'message' => 'No se pudo leer el archivo Excel o no contiene hojas válidas.',
                'ubicaciones' => ['records' => [], 'stats' => ['total' => 0, 'nuevos' => 0, 'actualizar' => 0]],
                'biometricos' => ['records' => [], 'stats' => ['total' => 0, 'nuevos' => 0, 'actualizar' => 0]],
            ];
        }

        $ubicacionesRecords = [];
        $biometricosRecords = [];
        $sheetNamesFound = [];

        if (in_array($scope, ['ambos', 'ubicaciones'], true)) {
            $ubicacionesSheet = $this->findUbicacionesSheet($sheets);
            if ($ubicacionesSheet !== null) {
                $sheetNamesFound['ubicaciones'] = $ubicacionesSheet['title'];
                $ubicacionesRecords = $this->extractUbicacionesFromRows($ubicacionesSheet['rows'], $empresaId);
            }
        }

        if (in_array($scope, ['ambos', 'biometricos'], true)) {
            $biometricosSheet = $this->findBiometricosSetupSheet($sheets);
            if ($biometricosSheet !== null) {
                $sheetNamesFound['biometricos'] = $biometricosSheet['title'];
                $biometricosRecords = $this->extractBiometricosFromRows($biometricosSheet['rows'], $empresaId);
            }
        }

        if (empty($ubicacionesRecords) && empty($biometricosRecords)) {
            return [
                'success' => false,
                'message' => 'No se encontraron datos compatibles con "Biométricos setup" ni "Ubicaciones (2)" en el archivo.',
                'ubicaciones' => ['records' => [], 'stats' => ['total' => 0, 'nuevos' => 0, 'actualizar' => 0]],
                'biometricos' => ['records' => [], 'stats' => ['total' => 0, 'nuevos' => 0, 'actualizar' => 0]],
            ];
        }

        $ubicacionesStats = [
            'total' => count($ubicacionesRecords),
            'nuevos' => count(array_filter($ubicacionesRecords, fn ($r) => $r['action'] === 'create')),
            'actualizar' => count(array_filter($ubicacionesRecords, fn ($r) => $r['action'] === 'update')),
        ];

        $biometricosStats = [
            'total' => count($biometricosRecords),
            'nuevos' => count(array_filter($biometricosRecords, fn ($r) => $r['action'] === 'create')),
            'actualizar' => count(array_filter($biometricosRecords, fn ($r) => $r['action'] === 'update')),
        ];

        return [
            'success' => true,
            'sheets_detected' => $sheetNamesFound,
            'ubicaciones' => [
                'records' => $ubicacionesRecords,
                'stats' => $ubicacionesStats,
            ],
            'biometricos' => [
                'records' => $biometricosRecords,
                'stats' => $biometricosStats,
            ],
        ];
    }

    /**
     * Ejecuta la importación directa desde un archivo Excel o desde los registros preprocesados,
     * separando los datos hacia `reloj_ubicaciones` y `reloj_equipos_biometricos` y vinculándolos.
     */
    public function importFromFile(string $filePath, string $scope = 'ambos', ?int $empresaId = null): array
    {
        $preview = $this->parsePreview($filePath, $scope, $empresaId);

        if (! ($preview['success'] ?? false)) {
            return $preview;
        }

        return $this->executeImport(
            $preview['ubicaciones']['records'] ?? [],
            $preview['biometricos']['records'] ?? [],
            $empresaId
        );
    }

    /**
     * Guarda en base de datos ambos conjuntos de datos ya separados y los enlaza por localidad.
     */
    public function executeImport(array $ubicacionesData, array $biometricosData, ?int $empresaId = null): array
    {
        $empresaId = $this->resolveEmpresaId($empresaId);

        $result = [
            'ubicaciones_creadas' => 0,
            'ubicaciones_actualizadas' => 0,
            'biometricos_creados' => 0,
            'biometricos_actualizados' => 0,
        ];

        DB::transaction(function () use ($ubicacionesData, $biometricosData, $empresaId, &$result) {
            // Mapa de sucursales para intentar vincular automáticamente si coincide nombre/ciudad
            $sucursales = Sucursal::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->get();

            // 1. Procesar Ubicaciones (Pestaña 3: Ubicaciones (2))
            foreach ($ubicacionesData as $uRow) {
                $planta = $this->cleanText($uRow['planta'] ?? '');
                if ($planta === '') {
                    continue;
                }

                $numLocalidad = isset($uRow['numero_localidad']) && $uRow['numero_localidad'] !== '' && $uRow['numero_localidad'] !== null
                    ? (int) $uRow['numero_localidad']
                    : null;

                $existing = $this->findExistingUbicacion($empresaId, $numLocalidad, $planta);

                $sucursalId = $existing?->sucursal_id ?? $this->matchSucursalId($sucursales, $planta, $uRow['ciudad'] ?? null);

                $payload = [
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursalId,
                    'numero_localidad' => $numLocalidad,
                    'planta' => $planta,
                    'direccion' => $this->cleanText($uRow['direccion'] ?? '') ?: null,
                    'estado' => $this->cleanText($uRow['estado'] ?? '') ?: null,
                    'ciudad' => $this->cleanText($uRow['ciudad'] ?? '') ?: null,
                    'legacy' => $this->normalizeLegacy($uRow['legacy'] ?? null),
                    'activo' => true,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $result['ubicaciones_actualizadas']++;
                } else {
                    RelojUbicacion::withoutGlobalScopes()->create($payload);
                    $result['ubicaciones_creadas']++;
                }
            }

            // Recargar todas las ubicaciones de la empresa para enlazar los equipos biométricos
            $todasUbicaciones = RelojUbicacion::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->get();

            // Cargar equipos existentes para hacer upsert exacto sin duplicar slots "???"
            $equiposExistentes = RelojEquipoBiometrico::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->orderBy('id')
                ->get();

            $usedEquipoIds = [];

            // 2. Procesar Biométricos Setup (Pestaña 2: Biométricos setup)
            foreach ($biometricosData as $bRow) {
                $localidadNombre = $this->cleanText($bRow['localidad_nombre'] ?? '');
                if ($localidadNombre === '') {
                    continue;
                }

                $numLocalidad = isset($bRow['numero_localidad']) && $bRow['numero_localidad'] !== '' && $bRow['numero_localidad'] !== null
                    ? (int) $bRow['numero_localidad']
                    : null;

                $sucursalId = $bRow['sucursal_id'] ?? $this->matchSucursalId($sucursales, $localidadNombre, $bRow['ciudad'] ?? null);

                $ubicacionMatched = $this->matchRelojUbicacion($todasUbicaciones, $numLocalidad, $localidadNombre);

                // Si no existe la ubicación aún en reloj_ubicaciones, crearla asociada a la sucursal
                if (! $ubicacionMatched) {
                    $ubicacionMatched = RelojUbicacion::withoutGlobalScopes()->create([
                        'empresa_id' => $empresaId,
                        'sucursal_id' => $sucursalId,
                        'numero_localidad' => $numLocalidad,
                        'planta' => $localidadNombre,
                        'direccion' => null,
                        'estado' => $this->cleanText($bRow['estado'] ?? '') ?: null,
                        'ciudad' => $this->cleanText($bRow['ciudad'] ?? '') ?: null,
                        'legacy' => $this->normalizeLegacy($bRow['legacy'] ?? null),
                        'activo' => true,
                    ]);
                    $todasUbicaciones->push($ubicacionMatched);
                    $result['ubicaciones_creadas']++;
                } elseif (! $ubicacionMatched->sucursal_id && $sucursalId) {
                    $ubicacionMatched->update(['sucursal_id' => $sucursalId]);
                }

                $existingEquipo = $this->findMatchingExistingEquipo(
                    $equiposExistentes,
                    $usedEquipoIds,
                    $numLocalidad,
                    $localidadNombre,
                    $bRow
                );

                $payload = [
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursalId,
                    'reloj_ubicacion_id' => $ubicacionMatched?->id,
                    'legacy' => $this->normalizeLegacy($bRow['legacy'] ?? null) ?? $ubicacionMatched?->legacy,
                    'localidad_nombre' => $localidadNombre,
                    'numero_localidad' => $numLocalidad ?? $ubicacionMatched?->numero_localidad,
                    'ubicacion_fisica' => $this->cleanText($bRow['ubicacion_fisica'] ?? '') ?: null,
                    'actual_no_serie' => $this->cleanText($bRow['actual_no_serie'] ?? '') ?: null,
                    'actual_ip' => $this->cleanText($bRow['actual_ip'] ?? '') ?: null,
                    'actual_mascara' => $this->cleanText($bRow['actual_mascara'] ?? '') ?: null,
                    'actual_gateway' => $this->cleanText($bRow['actual_gateway'] ?? '') ?: null,
                    'actual_instalado' => $this->parseBoolean($bRow['actual_instalado'] ?? false),
                    'actual_comentario' => $this->cleanText($bRow['actual_comentario'] ?? '') ?: null,
                    'nuevo_marca' => $this->cleanText($bRow['nuevo_marca'] ?? '') ?: ($existingEquipo?->nuevo_marca ?? null),
                    'nuevo_modelo' => $this->cleanText($bRow['nuevo_modelo'] ?? '') ?: ($existingEquipo?->nuevo_modelo ?? null),
                    'nuevo_no_serie' => $this->cleanText($bRow['nuevo_no_serie'] ?? '') ?: null,
                    'nuevo_ip' => $this->cleanText($bRow['nuevo_ip'] ?? '') ?: null,
                    'nuevo_mascara' => $this->cleanText($bRow['nuevo_mascara'] ?? '') ?: null,
                    'nuevo_gateway' => $this->cleanText($bRow['nuevo_gateway'] ?? '') ?: null,
                    'nuevo_instalado' => $this->parseBoolean($bRow['nuevo_instalado'] ?? false),
                    'nuevo_comentario' => $this->cleanText($bRow['nuevo_comentario'] ?? '') ?: null,
                    'nuevo_mac_address' => $this->cleanText($bRow['nuevo_mac_address'] ?? '') ?: null,
                    'activo' => true,
                ];

                if ($existingEquipo) {
                    $usedEquipoIds[$existingEquipo->id] = true;
                    $existingEquipo->update($payload);
                    $result['biometricos_actualizados']++;
                } else {
                    $created = RelojEquipoBiometrico::withoutGlobalScopes()->create($payload);
                    $usedEquipoIds[$created->id] = true;
                    $result['biometricos_creados']++;
                }
            }
        });

        return [
            'success' => true,
            'result' => $result,
        ];
    }

    /**
     * Extrae y valida las filas de la pestaña Ubicaciones (2).
     */
    protected function extractUbicacionesFromRows(array $rows, int $empresaId): array
    {
        $existingUbicaciones = RelojUbicacion::withoutGlobalScopes()
            ->where('empresa_id', $empresaId)
            ->get();

        // Buscar fila de encabezado (donde aparece Planta y Dirección / Núm.)
        $headerRowIdx = 1;
        $colMap = [
            'numero_localidad' => 'A',
            'planta' => 'B',
            'direccion' => 'C',
            'estado' => 'D',
            'ciudad' => 'E',
            'legacy' => 'F',
        ];

        foreach ($rows as $rIdx => $cells) {
            $norm = array_map(fn ($v) => $this->normalizeKey((string) $v), $cells);
            if (in_array('planta', $norm, true) && (in_array('direccion', $norm, true) || in_array('ciudad', $norm, true))) {
                $headerRowIdx = $rIdx;
                foreach ($norm as $colLetter => $val) {
                    if (in_array($val, ['num', 'numero', 'nolocalidad', 'numlocalidad'], true)) {
                        $colMap['numero_localidad'] = $colLetter;
                    } elseif ($val === 'planta' || $val === 'localidad') {
                        $colMap['planta'] = $colLetter;
                    } elseif (str_contains($val, 'direccion')) {
                        $colMap['direccion'] = $colLetter;
                    } elseif ($val === 'estado') {
                        $colMap['estado'] = $colLetter;
                    } elseif ($val === 'ciudad' || $val === 'municipio') {
                        $colMap['ciudad'] = $colLetter;
                    } elseif ($val === 'legacy') {
                        $colMap['legacy'] = $colLetter;
                    }
                }
                break;
            }
        }

        $records = [];
        foreach ($rows as $rIdx => $cells) {
            if ($rIdx <= $headerRowIdx) {
                continue;
            }

            $planta = $this->cleanText($cells[$colMap['planta']] ?? '');
            $direccion = $this->cleanText($cells[$colMap['direccion']] ?? '');
            $numRaw = $this->cleanText($cells[$colMap['numero_localidad']] ?? '');

            if ($planta === '' && $direccion === '') {
                continue;
            }

            $numLocalidad = is_numeric($numRaw) ? (int) $numRaw : null;
            $estado = $this->cleanText($cells[$colMap['estado']] ?? '');
            $ciudad = $this->cleanText($cells[$colMap['ciudad']] ?? '');
            $legacy = $this->normalizeLegacy($cells[$colMap['legacy']] ?? null);

            $matched = $existingUbicaciones->first(function ($u) use ($numLocalidad, $planta) {
                return $u->numero_localidad === $numLocalidad
                    && $this->normalizeKey($u->planta) === $this->normalizeKey($planta);
            });

            $records[] = [
                'row_number' => $rIdx,
                'numero_localidad' => $numLocalidad,
                'planta' => $planta,
                'direccion' => $direccion ?: null,
                'estado' => $estado ?: null,
                'ciudad' => $ciudad ?: null,
                'legacy' => $legacy,
                'action' => $matched ? 'update' : 'create',
            ];
        }

        return $records;
    }

    /**
     * Extrae y valida las filas de la pestaña Biométricos setup / Biométricos setup (2).
     */
    protected function extractBiometricosFromRows(array $rows, int $empresaId): array
    {
        $equiposExistentes = RelojEquipoBiometrico::withoutGlobalScopes()
            ->where('empresa_id', $empresaId)
            ->orderBy('id')
            ->get();

        $sucursales = Sucursal::withoutGlobalScopes()
            ->where('empresa_id', $empresaId)
            ->get();

        // En Biométricos setup / Biométricos setup (2), buscar la fila de encabezados
        $headerRowIdx = 2;
        foreach ($rows as $rIdx => $cells) {
            $norm = array_map(fn ($v) => $this->normalizeKey((string) $v), $cells);
            if (in_array('localidad', $norm, true) && (in_array('ubicacion', $norm, true) || in_array('gateway', $norm, true))) {
                $headerRowIdx = $rIdx;
                break;
            }
        }

        // Mapear columnas dinámicamente según los nombres de encabezados
        $headerCells = $rows[$headerRowIdx] ?? [];
        $colMap = [];
        foreach ($headerCells as $colLetter => $rawHeader) {
            $normH = $this->normalizeKey((string) $rawHeader);
            if ($normH === '') {
                continue;
            }

            if (str_contains($normH, 'legacy') && !isset($colMap['legacy'])) {
                $colMap['legacy'] = $colLetter;
            } elseif ((str_contains($normH, 'localidad') || str_contains($normH, 'planta')) && !isset($colMap['localidad'])) {
                $colMap['localidad'] = $colLetter;
            } elseif ((str_contains($normH, 'dir') || str_contains($normH, 'num')) && !isset($colMap['numero_localidad'])) {
                $colMap['numero_localidad'] = $colLetter;
            } elseif (str_contains($normH, 'ciudad') && !isset($colMap['ciudad'])) {
                $colMap['ciudad'] = $colLetter;
            } elseif (str_contains($normH, 'estado') && !isset($colMap['estado'])) {
                $colMap['estado'] = $colLetter;
            } elseif (str_contains($normH, 'ubicacion') && !isset($colMap['ubicacion'])) {
                $colMap['ubicacion'] = $colLetter;
            } elseif (str_contains($normH, 'serie') || str_contains($normH, 'serial')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_no_serie'] = $colLetter;
                } elseif (!isset($colMap['actual_no_serie'])) {
                    $colMap['actual_no_serie'] = $colLetter;
                } else {
                    $colMap['nuevo_no_serie'] = $colLetter;
                }
            } elseif (str_contains($normH, 'ip')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_ip'] = $colLetter;
                } elseif (!isset($colMap['actual_ip'])) {
                    $colMap['actual_ip'] = $colLetter;
                } else {
                    $colMap['nuevo_ip'] = $colLetter;
                }
            } elseif (str_contains($normH, 'mask') || str_contains($normH, 'subnet') || str_contains($normH, 'mascara')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_mascara'] = $colLetter;
                } elseif (!isset($colMap['actual_mascara'])) {
                    $colMap['actual_mascara'] = $colLetter;
                } else {
                    $colMap['nuevo_mascara'] = $colLetter;
                }
            } elseif (str_contains($normH, 'gateway')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_gateway'] = $colLetter;
                } elseif (!isset($colMap['actual_gateway'])) {
                    $colMap['actual_gateway'] = $colLetter;
                } else {
                    $colMap['nuevo_gateway'] = $colLetter;
                }
            } elseif (str_contains($normH, 'instalado')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_instalado'] = $colLetter;
                } elseif (!isset($colMap['actual_instalado'])) {
                    $colMap['actual_instalado'] = $colLetter;
                } else {
                    $colMap['nuevo_instalado'] = $colLetter;
                }
            } elseif (str_contains($normH, 'comentario')) {
                if (str_contains($normH, '2') || str_contains($normH, 'nuevo')) {
                    $colMap['nuevo_comentario'] = $colLetter;
                } elseif (!isset($colMap['actual_comentario'])) {
                    $colMap['actual_comentario'] = $colLetter;
                } else {
                    $colMap['nuevo_comentario'] = $colLetter;
                }
            } elseif (str_contains($normH, 'mac')) {
                $colMap['nuevo_mac_address'] = $colLetter;
            }
        }

        $hasCiudadEstado = isset($colMap['ciudad']) || isset($colMap['estado']);
        $getVal = function(array $cells, string $key, string $fallbackNoOffset, string $fallbackWithOffset) use ($colMap, $hasCiudadEstado) {
            if (isset($colMap[$key])) {
                return $this->cleanText($cells[$colMap[$key]] ?? '');
            }
            $targetLetter = $hasCiudadEstado ? $fallbackWithOffset : $fallbackNoOffset;
            return $this->cleanText($cells[$targetLetter] ?? '');
        };

        $usedIds = [];
        $records = [];

        foreach ($rows as $rIdx => $cells) {
            if ($rIdx <= $headerRowIdx) {
                continue;
            }

            $legacyRaw = $getVal($cells, 'legacy', 'A', 'A');
            $localidadNombre = $getVal($cells, 'localidad', 'B', 'B');
            $numRaw = $getVal($cells, 'numero_localidad', 'C', 'C');
            $ciudad = $getVal($cells, 'ciudad', '', 'D');
            $estado = $getVal($cells, 'estado', '', 'E');
            $ubicacionFisica = $getVal($cells, 'ubicacion', 'D', 'F');

            if ($localidadNombre === '' && $ubicacionFisica === '') {
                continue;
            }

            $numLocalidad = is_numeric($numRaw) ? (int) $numRaw : null;
            $sucursalMatchedId = $this->matchSucursalId($sucursales, $localidadNombre, $ciudad);

            $rowRecord = [
                'row_number' => $rIdx,
                'sucursal_id' => $sucursalMatchedId,
                'legacy' => $this->normalizeLegacy($legacyRaw),
                'localidad_nombre' => $localidadNombre,
                'numero_localidad' => $numLocalidad,
                'ciudad' => $ciudad ?: null,
                'estado' => $estado ?: null,
                'ubicacion_fisica' => $ubicacionFisica ?: null,
                'actual_no_serie' => $getVal($cells, 'actual_no_serie', 'E', 'G') ?: null,
                'actual_ip' => $getVal($cells, 'actual_ip', 'F', 'H') ?: null,
                'actual_mascara' => $getVal($cells, 'actual_mascara', 'G', 'I') ?: null,
                'actual_gateway' => $getVal($cells, 'actual_gateway', 'H', 'J') ?: null,
                'actual_instalado' => $this->parseBoolean($getVal($cells, 'actual_instalado', 'I', 'K')),
                'actual_comentario' => $getVal($cells, 'actual_comentario', 'J', 'L') ?: null,
                'nuevo_no_serie' => $getVal($cells, 'nuevo_no_serie', 'K', 'M') ?: null,
                'nuevo_ip' => $getVal($cells, 'nuevo_ip', 'L', 'N') ?: null,
                'nuevo_mascara' => $getVal($cells, 'nuevo_mascara', 'M', 'O') ?: null,
                'nuevo_gateway' => $getVal($cells, 'nuevo_gateway', 'N', 'P') ?: null,
                'nuevo_instalado' => $this->parseBoolean($getVal($cells, 'nuevo_instalado', 'O', 'Q')),
                'nuevo_comentario' => $getVal($cells, 'nuevo_comentario', 'P', 'S') ?: null,
                'nuevo_mac_address' => $getVal($cells, 'nuevo_mac_address', 'Q', 'R') ?: null,
            ];

            $matched = $this->findMatchingExistingEquipo(
                $equiposExistentes,
                $usedIds,
                $numLocalidad,
                $localidadNombre,
                $rowRecord
            );

            if ($matched) {
                $usedIds[$matched->id] = true;
            }

            $rowRecord['action'] = $matched ? 'update' : 'create';
            $records[] = $rowRecord;
        }

        return $records;
    }

    /**
     * Encuentra la hoja "Ubicaciones (2)" en el libro Excel.
     */
    protected function findUbicacionesSheet(array $sheets): ?array
    {
        // 1. Priorizar coincidencia por título "Ubicaciones (2)"
        foreach ($sheets as $sheet) {
            $normTitle = $this->normalizeKey($sheet['title']);
            if ($normTitle === 'ubicaciones2' || str_contains($normTitle, 'ubicaciones2')) {
                return $sheet;
            }
        }

        // 2. Buscar por estructura de columnas (Núm., Planta, Dirección, Estado, Ciudad, Legacy)
        foreach ($sheets as $sheet) {
            foreach (array_slice($sheet['rows'], 0, 5, true) as $row) {
                $norm = array_map(fn ($v) => $this->normalizeKey((string) $v), $row);
                if (in_array('planta', $norm, true) && in_array('ciudad', $norm, true) && in_array('legacy', $norm, true)) {
                    return $sheet;
                }
            }
        }

        return null;
    }

    /**
     * Encuentra la hoja "Biométricos setup (2)" o "Biométricos setup" en el libro Excel.
     */
    protected function findBiometricosSetupSheet(array $sheets): ?array
    {
        // 1. Prioridad máxima: "Biométricos setup (2)" (exacta o variantes de setup 2)
        foreach ($sheets as $sheet) {
            $normTitle = $this->normalizeKey($sheet['title']);
            if (
                $normTitle === 'biometricossetup2' ||
                str_contains($normTitle, 'biometricossetup2') ||
                (str_contains($normTitle, 'setup') && str_contains($normTitle, '2'))
            ) {
                return $sheet;
            }
        }

        // 2. Coincidencia para "Biométricos setup" estándar (excluyendo 'actuales', 'checklist', 'foto')
        foreach ($sheets as $sheet) {
            $normTitle = $this->normalizeKey($sheet['title']);
            if (str_contains($normTitle, 'actual') || str_contains($normTitle, 'checklist') || str_contains($normTitle, 'foto')) {
                continue;
            }
            if (str_contains($normTitle, 'biometricossetup') || (str_contains($normTitle, 'biometrico') && str_contains($normTitle, 'setup'))) {
                return $sheet;
            }
        }

        // 3. Buscar por estructura de columnas (Localidad, Ubicación, Mask/Subnet, Gateway)
        // excluyendo expresamente hojas de checklist, fotos o auditorías de 'actuales'
        foreach ($sheets as $sheet) {
            $normTitle = $this->normalizeKey($sheet['title']);
            if (str_contains($normTitle, 'actual') || str_contains($normTitle, 'checklist') || str_contains($normTitle, 'foto')) {
                continue;
            }
            foreach (array_slice($sheet['rows'], 0, 5, true) as $row) {
                $norm = array_map(fn ($v) => $this->normalizeKey((string) $v), $row);
                if (in_array('localidad', $norm, true) && (in_array('ubicacion', $norm, true) || in_array('gateway', $norm, true))) {
                    return $sheet;
                }
            }
        }

        return null;
    }

    /**
     * Lee todas las hojas de un archivo .xlsx usando ZipArchive o el lector ZIP puro en PHP
     * (para funcionar incluso cuando ext-zip no está habilitado en php.ini).
     */
    public function readWorkbookSheets(string $filePath): array
    {
        if (! file_exists($filePath)) {
            return [];
        }

        $entries = $this->extractZipEntries($filePath);
        if (empty($entries) || ! isset($entries['xl/workbook.xml'])) {
            return [];
        }

        // 1. Leer sharedStrings.xml
        $sharedStrings = [];
        if (isset($entries['xl/sharedStrings.xml'])) {
            $ssXml = @simplexml_load_string($entries['xl/sharedStrings.xml']);
            if ($ssXml) {
                foreach ($ssXml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string) $si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $run) {
                            $text .= (string) $run->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Leer relaciones xl/_rels/workbook.xml.rels
        $relsMap = [];
        if (isset($entries['xl/_rels/workbook.xml.rels'])) {
            $relsXml = @simplexml_load_string($entries['xl/_rels/workbook.xml.rels']);
            if ($relsXml) {
                foreach ($relsXml->Relationship as $rel) {
                    $id = (string) $rel['Id'];
                    $target = ltrim((string) $rel['Target'], '/');
                    if (! str_starts_with($target, 'xl/')) {
                        $target = 'xl/' . $target;
                    }
                    $relsMap[$id] = $target;
                }
            }
        }

        // 3. Leer hojas declaradas en xl/workbook.xml
        $wbXml = @simplexml_load_string($entries['xl/workbook.xml']);
        if (! $wbXml || ! isset($wbXml->sheets->sheet)) {
            return [];
        }

        $sheets = [];
        $sheetIdx = 0;
        foreach ($wbXml->sheets->sheet as $sheetNode) {
            $sheetIdx++;
            $title = (string) $sheetNode['name'];
            $rAttrs = $sheetNode->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $rId = isset($rAttrs['id']) ? (string) $rAttrs['id'] : null;

            $targetPath = ($rId && isset($relsMap[$rId]))
                ? $relsMap[$rId]
                : "xl/worksheets/sheet{$sheetIdx}.xml";

            if (! isset($entries[$targetPath])) {
                continue;
            }

            $rows = $this->parseWorksheetXml($entries[$targetPath], $sharedStrings);
            $sheets[] = [
                'title' => $title,
                'rows' => $rows,
            ];
        }

        return $sheets;
    }

    /**
     * Parsea el XML de una hoja de cálculo y devuelve [rowNumber => ['A' => val, 'B' => val, ...]].
     */
    protected function parseWorksheetXml(string $xmlContent, array $sharedStrings): array
    {
        $xml = @simplexml_load_string($xmlContent);
        if (! $xml || ! isset($xml->sheetData->row)) {
            return [];
        }

        $rows = [];
        foreach ($xml->sheetData->row as $rowNode) {
            $rNum = (int) $rowNode['r'];
            $cells = [];
            foreach ($rowNode->c as $c) {
                $ref = (string) $c['r'];
                $colLetter = preg_replace('/[0-9]+/', '', $ref);
                $type = (string) $c['t'];
                $val = '';

                if ($type === 's') {
                    $idx = (int) $c->v;
                    $val = $sharedStrings[$idx] ?? '';
                } elseif ($type === 'inlineStr') {
                    $val = isset($c->is->t) ? (string) $c->is->t : '';
                } else {
                    $val = isset($c->v) ? (string) $c->v : '';
                }

                if ($colLetter !== '') {
                    $cells[$colLetter] = $val;
                }
            }

            if (! empty($cells)) {
                $rows[$rNum] = $cells;
            }
        }

        return $rows;
    }

    /**
     * Extrae todos los archivos internos de un archivo .xlsx (ZIP) usando ZipArchive
     * o descompresión nativa con gzinflate si ZipArchive no está disponible.
     */
    protected function extractZipEntries(string $filePath): array
    {
        if (class_exists(ZipArchive::class)) {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $entries = [];
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    $entries[$name] = $zip->getFromIndex($i);
                }
                $zip->close();
                return $entries;
            }
        }

        $data = @file_get_contents($filePath);
        if ($data === false) {
            return [];
        }

        $pos = strrpos($data, "PK\x05\x06");
        if ($pos === false) {
            return [];
        }

        $cd = unpack('vdisk/vcd_disk/vcd_entries_disk/vcd_entries/Vcd_size/Vcd_offset', substr($data, $pos + 4, 16));
        $offset = $cd['cd_offset'];
        $entries = [];

        for ($i = 0; $i < $cd['cd_entries']; $i++) {
            $hdr = unpack(
                'Vsig/vver/vver_need/vflag/vmethod/vtime/vdate/Vcrc/Vcomp_size/Vuncomp_size/vname_len/vextra_len/vcomment_len/vdisk_start/vint_attr/Vext_attr/Vlocal_offset',
                substr($data, $offset, 46)
            );
            $name = substr($data, $offset + 46, $hdr['name_len']);
            $offset += 46 + $hdr['name_len'] + $hdr['extra_len'] + $hdr['comment_len'];

            $lhdr = unpack('vname_len/vextra_len', substr($data, $hdr['local_offset'] + 26, 4));
            $dataStart = $hdr['local_offset'] + 30 + $lhdr['name_len'] + $lhdr['extra_len'];
            $compData = substr($data, $dataStart, $hdr['comp_size']);

            if ($hdr['method'] === 8) {
                $inflated = @gzinflate($compData);
                if ($inflated !== false) {
                    $entries[$name] = $inflated;
                }
            } elseif ($hdr['method'] === 0) {
                $entries[$name] = $compData;
            }
        }

        return $entries;
    }

    protected function findExistingUbicacion(int $empresaId, ?int $numLocalidad, string $planta): ?RelojUbicacion
    {
        $normPlanta = $this->normalizeKey($planta);

        $candidates = RelojUbicacion::withoutGlobalScopes()
            ->where('empresa_id', $empresaId)
            ->when($numLocalidad !== null, fn ($q) => $q->where('numero_localidad', $numLocalidad))
            ->get();

        foreach ($candidates as $cand) {
            if ($this->normalizeKey($cand->planta) === $normPlanta) {
                return $cand;
            }
        }

        return null;
    }

    protected function matchRelojUbicacion($todasUbicaciones, ?int $numLocalidad, string $localidadNombre): ?RelojUbicacion
    {
        $normLocalidad = $this->cleanPlantComparisonKey($localidadNombre);

        if ($numLocalidad !== null) {
            $byNum = $todasUbicaciones->where('numero_localidad', $numLocalidad);
            if ($byNum->count() === 1) {
                return $byNum->first();
            }
            if ($byNum->count() > 1) {
                // Buscar cuál de las plantas con el mismo Núm. coincide mejor con el nombre
                foreach ($byNum as $cand) {
                    $normCand = $this->cleanPlantComparisonKey($cand->planta);
                    if ($normCand === $normLocalidad || str_contains($normLocalidad, $normCand) || str_contains($normCand, $normLocalidad)) {
                        return $cand;
                    }
                }
                return $byNum->first();
            }
        }

        // Búsqueda por nombre de planta si no tenía Núm.
        foreach ($todasUbicaciones as $cand) {
            $normCand = $this->cleanPlantComparisonKey($cand->planta);
            if ($normCand !== '' && ($normCand === $normLocalidad || str_contains($normLocalidad, $normCand) || str_contains($normCand, $normLocalidad))) {
                return $cand;
            }
        }

        return null;
    }

    protected function findMatchingExistingEquipo(
        $equiposExistentes,
        array $usedIds,
        ?int $numLocalidad,
        string $localidadNombre,
        array $rowRecord
    ): ?RelojEquipoBiometrico {
        $actualSerie = $this->cleanText($rowRecord['actual_no_serie'] ?? '');
        $actualIp = $this->cleanText($rowRecord['actual_ip'] ?? '');
        $nuevoSerie = $this->cleanText($rowRecord['nuevo_no_serie'] ?? '');
        $ubicacionFisica = $this->cleanText($rowRecord['ubicacion_fisica'] ?? '');
        $normLoc = $this->normalizeKey($localidadNombre);
        $normUbi = $this->normalizeKey($ubicacionFisica);

        // 1. Coincidencia fuerte por No. Serie actual o nuevo (cuando no está vacío)
        if ($actualSerie !== '') {
            foreach ($equiposExistentes as $eq) {
                if (isset($usedIds[$eq->id])) {
                    continue;
                }
                if (
                    $this->normalizeKey((string) $eq->actual_no_serie) === $this->normalizeKey($actualSerie)
                    && $this->normalizeKey($eq->localidad_nombre) === $normLoc
                    && $this->normalizeKey((string) $eq->ubicacion_fisica) === $normUbi
                ) {
                    return $eq;
                }
            }
        }

        if ($nuevoSerie !== '') {
            foreach ($equiposExistentes as $eq) {
                if (isset($usedIds[$eq->id])) {
                    continue;
                }
                if ($this->normalizeKey((string) $eq->nuevo_no_serie) === $this->normalizeKey($nuevoSerie)) {
                    return $eq;
                }
            }
        }

        // 2. Coincidencia por Localidad + Núm. + Ubicación Física + IP actual
        foreach ($equiposExistentes as $eq) {
            if (isset($usedIds[$eq->id])) {
                continue;
            }
            if (
                $eq->numero_localidad === $numLocalidad
                && $this->normalizeKey($eq->localidad_nombre) === $normLoc
                && $this->normalizeKey((string) $eq->ubicacion_fisica) === $normUbi
                && $this->normalizeKey((string) $eq->actual_ip) === $this->normalizeKey($actualIp)
            ) {
                return $eq;
            }
        }

        return null;
    }

    protected function matchSucursalId($sucursales, string $planta, ?string $ciudad): ?int
    {
        $targetNorm = $this->normalizeKey($planta);
        $targetClean = $this->cleanPlantComparisonKey($planta);

        // 1. Coincidencia exacta completa por nombre normalizado
        foreach ($sucursales as $suc) {
            if ($this->normalizeKey($suc->nombre) === $targetNorm) {
                return $suc->id;
            }
        }

        // 2. Coincidencia exacta sin sufijo entre paréntesis como (LSKM), (LSKNA), etc.
        foreach ($sucursales as $suc) {
            if ($this->cleanPlantComparisonKey($suc->nombre) === $targetClean) {
                return $suc->id;
            }
        }

        // 3. Coincidencia por subcadena fuerte de nombre de planta
        foreach ($sucursales as $suc) {
            $normSuc = $this->cleanPlantComparisonKey($suc->nombre);
            if ($normSuc !== '' && (str_contains($targetClean, $normSuc) || str_contains($normSuc, $targetClean))) {
                return $suc->id;
            }
        }

        return null;
    }

    public function normalizeLegacy(?string $legacy): ?string
    {
        $clean = $this->cleanText((string) $legacy);
        if ($clean === '') {
            return null;
        }

        $key = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $clean));

        return match ($key) {
            'fskm', 'fskmx', 'lskm' => 'fSK MX',
            'fwrgg', 'lwrk' => 'fWR GG',
            'fskna', 'lskna' => 'fSK NA',
            'fsknaps' => 'fSK NA (PS)',
            'bib' => 'BIB',
            default => $clean,
        };
    }

    protected function parseBoolean(mixed $val): bool
    {
        if (is_bool($val)) {
            return $val;
        }
        $norm = strtolower($this->cleanText((string) $val));

        return in_array($norm, ['yes', 'si', 'sí', '1', 'true', 'instalado', 'activo'], true);
    }

    protected function cleanText(?string $value): string
    {
        if ($value === null) {
            return '';
        }
        // Reemplazar espacios de no separación (\u00A0) y saltos de línea múltiples
        $val = str_replace(["\xc2\xa0", "\u{00a0}", "\r\n", "\r", "\n"], ' ', $value);
        $val = preg_replace('/\s+/u', ' ', $val) ?? $val;

        return trim($val);
    }

    protected function normalizeKey(string $value): string
    {
        $clean = $this->cleanText($value);
        $clean = strtr(
            mb_strtolower($clean, 'UTF-8'),
            ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']
        );

        return preg_replace('/[^a-z0-9]/', '', $clean) ?? '';
    }

    protected function cleanPlantComparisonKey(string $value): string
    {
        // Quitar sufijos entre paréntesis como (LSKM), (LSKNA), (LWRK) para comparar nombres de plantas
        $withoutParens = preg_replace('/\([^)]*\)/', '', $value) ?? $value;
        $withoutPlantaPrefix = preg_replace('/^planta\s+/i', '', trim($withoutParens)) ?? $withoutParens;

        return $this->normalizeKey($withoutPlantaPrefix);
    }

    protected function resolveEmpresaId(?int $empresaId = null): int
    {
        if ($empresaId) {
            return $empresaId;
        }
        $user = auth()->user();
        if ($user && $user->empresa_id) {
            return (int) $user->empresa_id;
        }

        return (int) (Empresa::withoutGlobalScopes()->value('id') ?? 1);
    }
}
