<?php

namespace App\Services;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\EmpleadoVehiculo;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class EmpleadoImportService
{
    /**
     * Parse an uploaded Excel file and return a preview array.
     */
    public function parsePreview(string $filePath): array
    {
        $rowsData = $this->readXlsxRows($filePath);

        if (empty($rowsData)) {
            return [
                'success' => false,
                'message' => 'No se encontraron datos en el archivo Excel.',
                'records' => [],
                'stats' => ['total' => 0, 'nuevos' => 0, 'actualizar' => 0, 'errores' => 0]
            ];
        }

        // Identify Header Row
        $headerRowIndex = null;
        $headersMap = [];

        foreach ($rowsData as $idx => $row) {
            $normalizedVals = array_map(fn($v) => $this->normalizeHeader((string)$v), array_values($row['cells']));
            
            $rowHasHeader = false;
            foreach ($normalizedVals as $val) {
                if (
                    str_contains($val, 'empleado') ||
                    str_contains($val, 'nombre') ||
                    str_contains($val, 'paterno') ||
                    str_contains($val, 'curp') ||
                    $val === 'id' ||
                    $val === 'no'
                ) {
                    $rowHasHeader = true;
                    break;
                }
            }

            if ($rowHasHeader) {
                $headerRowIndex = $idx;
                foreach ($row['cells'] as $colRef => $val) {
                    $colLetter = preg_replace('/[0-9]/', '', $colRef);
                    $headersMap[$colLetter] = (string)$val;
                }
                break;
            }
        }

        if ($headerRowIndex === null) {
            // Default first row as header if no explicit header match
            $firstRow = $rowsData[0];
            foreach ($firstRow['cells'] as $colRef => $val) {
                $colLetter = preg_replace('/[0-9]/', '', $colRef);
                $headersMap[$colLetter] = (string)$val;
            }
            $headerRowIndex = 0;
        }

        // Map column names to standard keys
        $colIndexMap = $this->resolveColumnMap($headersMap);

        // Group rows by Employee Document / Employee Number to merge multi-row entries (e.g. multiple vehicles)
        $groupedEmployees = [];
        $invalidRows = [];

        for ($i = $headerRowIndex + 1; $i < count($rowsData); $i++) {
            $rowCells = $rowsData[$i]['cells'];
            $rowNum = $rowsData[$i]['row_number'];

            $doc = $this->getCellValueByMap($rowCells, $colIndexMap['documento_identidad']);
            $curp = $this->getCellValueByMap($rowCells, $colIndexMap['curp']);
            $nombre = $this->getCellValueByMap($rowCells, $colIndexMap['nombres']);
            $paterno = $this->getCellValueByMap($rowCells, $colIndexMap['apellido_paterno']);
            $materno = $this->getCellValueByMap($rowCells, $colIndexMap['apellido_materno']);

            // Skip completely empty rows
            if (empty($doc) && empty($nombre) && empty($paterno)) {
                continue;
            }

            // Build full name and surnames
            $apellidos = trim("{$paterno} {$materno}");

            // Clean Document / Employee Number
            $docClean = trim((string)$doc);
            if (empty($docClean)) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => 'Falta el Código / Número de Empleado.'
                ];
                continue;
            }

            $correo = $this->getCellValueByMap($rowCells, $colIndexMap['correo']);
            $telefono = $this->getCellValueByMap($rowCells, $colIndexMap['telefono']);
            $departamento = $this->getCellValueByMap($rowCells, $colIndexMap['departamento']);
            $empresa = $this->getCellValueByMap($rowCells, $colIndexMap['empresa']);

            // Tarjetas de acceso
            $tarjeta1 = $this->cleanTarjetaValue($this->getCellValueByMap($rowCells, $colIndexMap['tarjeta_acceso_1']));
            $tarjeta2 = $this->cleanTarjetaValue($this->getCellValueByMap($rowCells, $colIndexMap['tarjeta_acceso_2']));
            $tarjeta3 = $this->cleanTarjetaValue($this->getCellValueByMap($rowCells, $colIndexMap['tarjeta_acceso_3']));

            // Vehicle fields
            $tipoVehiculo = $this->getCellValueByMap($rowCells, $colIndexMap['tipo_vehiculo']);
            $marcaVehiculo = $this->getCellValueByMap($rowCells, $colIndexMap['marca_vehiculo']);
            $colorVehiculo = $this->getCellValueByMap($rowCells, $colIndexMap['color_vehiculo']);
            $placaVehiculo = $this->getCellValueByMap($rowCells, $colIndexMap['placa_vehiculo']);
            $comentariosVehiculo = $this->getCellValueByMap($rowCells, $colIndexMap['comentarios_vehiculo']);

            $vehiculo = null;
            if (!empty($placaVehiculo) || !empty($tipoVehiculo) || !empty($marcaVehiculo)) {
                $vehiculo = [
                    'tipo_vehiculo' => $tipoVehiculo ?: 'Automovil',
                    'marca' => $marcaVehiculo ?: '',
                    'modelo' => $comentariosVehiculo ?: '',
                    'color' => $colorVehiculo ?: '',
                    'placa' => strtoupper(trim((string)$placaVehiculo)),
                ];
            }

            if (!isset($groupedEmployees[$docClean])) {
                $groupedEmployees[$docClean] = [
                    'documento_identidad' => $docClean,
                    'curp' => trim((string)$curp),
                    'nombres' => trim((string)$nombre),
                    'apellidos' => $apellidos,
                    'correo' => trim((string)$correo),
                    'telefono' => $this->cleanPhoneNumber($telefono),
                    'departamento' => trim((string)$departamento),
                    'empresa' => trim((string)$empresa),
                    'tarjeta_acceso_1' => $tarjeta1,
                    'tarjeta_acceso_2' => $tarjeta2,
                    'tarjeta_acceso_3' => $tarjeta3,
                    'vehiculos' => $vehiculo ? [$vehiculo] : [],
                    'rows' => [$rowNum],
                ];
            } else {
                // Append vehicle if not empty
                if ($vehiculo) {
                    $groupedEmployees[$docClean]['vehiculos'][] = $vehiculo;
                }
                $groupedEmployees[$docClean]['rows'][] = $rowNum;
                // Fill in missing fields if second row has more data
                if (empty($groupedEmployees[$docClean]['correo']) && !empty($correo)) {
                    $groupedEmployees[$docClean]['correo'] = trim((string)$correo);
                }
                if (empty($groupedEmployees[$docClean]['telefono']) && !empty($telefono)) {
                    $groupedEmployees[$docClean]['telefono'] = $this->cleanPhoneNumber($telefono);
                }
                if (($groupedEmployees[$docClean]['tarjeta_acceso_1'] === '0') && $tarjeta1 !== '0') {
                    $groupedEmployees[$docClean]['tarjeta_acceso_1'] = $tarjeta1;
                }
                if (($groupedEmployees[$docClean]['tarjeta_acceso_2'] === '0') && $tarjeta2 !== '0') {
                    $groupedEmployees[$docClean]['tarjeta_acceso_2'] = $tarjeta2;
                }
                if (($groupedEmployees[$docClean]['tarjeta_acceso_3'] === '0') && $tarjeta3 !== '0') {
                    $groupedEmployees[$docClean]['tarjeta_acceso_3'] = $tarjeta3;
                }
            }
        }

        // Query existing employees to mark duplicates
        $docsList = array_keys($groupedEmployees);
        $existingDocs = Empleado::whereIn('documento_identidad', $docsList)
            ->pluck('id', 'documento_identidad')
            ->toArray();

        $records = [];
        $nuevosCount = 0;
        $actualizarCount = 0;

        foreach ($groupedEmployees as $doc => $emp) {
            $isDuplicate = isset($existingDocs[$doc]);
            if ($isDuplicate) {
                $actualizarCount++;
            } else {
                $nuevosCount++;
            }

            $records[] = array_merge($emp, [
                'is_duplicate' => $isDuplicate,
                'existing_id' => $existingDocs[$doc] ?? null,
                'status_label' => $isDuplicate ? 'Actualizar' : 'Nuevo',
            ]);
        }

        return [
            'success' => true,
            'records' => array_values($records),
            'stats' => [
                'total' => count($records),
                'nuevos' => $nuevosCount,
                'actualizar' => $actualizarCount,
                'errores' => count($invalidRows),
            ],
            'invalid_rows' => $invalidRows
        ];
    }

    /**
     * Process actual import of array of records.
     */
    public function executeImport(array $records, ?int $userEmpresaId = null, ?int $userSucursalId = null, string $duplicateStrategy = 'update'): array
    {
        $empresa = ($userEmpresaId ? Empresa::find($userEmpresaId) : null) ?: Empresa::first();
        if (!$empresa) {
            $empresa = Empresa::create([
                'razon_social' => "Driscoll's, Inc.",
                'nombre_comercial' => "Driscoll's, Inc.",
                'status' => true,
            ]);
        }
        $empresaId = $empresa->id;

        $sucursal = ($userSucursalId ? Sucursal::find($userSucursalId) : null) ?: Sucursal::where('empresa_id', $empresaId)->first();
        if (!$sucursal) {
            $sucursal = Sucursal::create([
                'nombre' => 'Cooler Purépero',
                'empresa_id' => $empresaId,
                'status' => true,
            ]);
        }
        $sucursalId = $sucursal->id;

        $paisMx = Pais::where('codigo_iso2', 'MX')
            ->orWhere('codigo_telefonico', '+52')
            ->orWhere('codigo_telefonico', '52')
            ->first();

        $paisId = $paisMx ? $paisMx->id : null;

        // Obtener o crear el Turno Laboral por defecto: Lunes a Viernes de 8:00 AM a 5:00 PM (8h ordinarias + 1h comida)
        $defaultTurno = TurnoLaboral::where('empresa_id', $empresaId)
            ->where('hora_entrada', '08:00:00')
            ->where('hora_salida', '17:00:00')
            ->first();

        if (!$defaultTurno) {
            $defaultTurno = TurnoLaboral::firstOrCreate([
                'empresa_id' => $empresaId,
                'nombre' => 'Turno Regular (L-V 08:00 AM - 05:00 PM)',
            ], [
                'sucursal_id' => $sucursalId,
                'tipo_jornada' => 'diurna',
                'hora_entrada' => '08:00:00',
                'hora_salida' => '17:00:00',
                'horas_diarias_ley' => 8.00,
                'minutos_descanso' => 60,
                'descanso_pagado' => false,
                'dias_laborables' => [1, 2, 3, 4, 5],
                'status' => true,
            ]);
        }

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($records as $index => $rec) {
                $doc = trim((string)($rec['documento_identidad'] ?? ''));
                if (empty($doc)) {
                    $skippedCount++;
                    continue;
                }

                $existing = Empleado::where('documento_identidad', $doc)->first();

                if ($existing && $duplicateStrategy === 'skip') {
                    $skippedCount++;
                    continue;
                }

                // Resolve or create Departamento under fixed empresa_id and sucursal_id
                $rawDepName = !empty($rec['departamento']) ? trim($rec['departamento']) : 'General';
                $cleanDepName = preg_replace('/\s+/', ' ', $rawDepName);

                $dep = Departamento::where('empresa_id', $empresaId)
                    ->where(function ($q) use ($cleanDepName) {
                        $q->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower($cleanDepName)])
                          ->orWhere('nombre', 'like', $cleanDepName);
                    })->first();

                if (!$dep) {
                    $dep = Departamento::create([
                        'nombre' => ucfirst($cleanDepName),
                        'descripcion' => "Departamento de {$cleanDepName}",
                        'empresa_id' => $empresaId,
                        'sucursal_id' => $sucursalId,
                        'user_id' => auth()->id() ?: 1,
                        'status' => 1,
                    ]);
                }
                $departamentoId = $dep->id;

                $tarjeta1 = $this->cleanTarjetaValue($rec['tarjeta_acceso_1'] ?? null);
                $tarjeta2 = $this->cleanTarjetaValue($rec['tarjeta_acceso_2'] ?? null);
                $tarjeta3 = $this->cleanTarjetaValue($rec['tarjeta_acceso_3'] ?? null);

                $dataToSave = [
                    'nombres' => !empty($rec['nombres']) ? $rec['nombres'] : 'N/A',
                    'apellidos' => !empty($rec['apellidos']) ? $rec['apellidos'] : 'N/A',
                    'documento_identidad' => $doc,
                    'curp' => !empty($rec['curp']) ? trim($rec['curp']) : null,
                    'tarjeta_acceso_1' => $tarjeta1,
                    'tarjeta_acceso_2' => $tarjeta2,
                    'tarjeta_acceso_3' => $tarjeta3,
                    'pais_telefono_id' => $paisId,
                    'telefono' => $rec['telefono'] ?? null,
                    'correo' => !empty($rec['correo']) ? $rec['correo'] : null,
                    'departamento_id' => $departamentoId,
                    'turno_laboral_id' => $defaultTurno->id,
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursalId,
                    'status' => true,
                ];

                // Si el empleado existente no tiene codigo_acceso o si es un registro nuevo, generar el codigo de acceso de 8 digitos (Rol 1)
                if ($existing) {
                    if (empty($existing->codigo_acceso)) {
                        $dataToSave['codigo_acceso'] = \App\Services\AccessCodeService::generate('empleado', $sucursalId);
                    }
                    $existing->update($dataToSave);
                    $empleado = $existing;
                    $updatedCount++;
                } else {
                    $dataToSave['codigo_acceso'] = \App\Services\AccessCodeService::generate('empleado', $sucursalId);
                    $empleado = Empleado::create($dataToSave);
                    $createdCount++;
                }

                // Process Vehicles
                if (!empty($rec['vehiculos']) && is_array($rec['vehiculos'])) {
                    foreach ($rec['vehiculos'] as $v) {
                        if (empty($v['placa']) && empty($v['marca']) && empty($v['tipo_vehiculo'])) {
                            continue;
                        }
                        // Avoid exact duplicate vehicles for this employee
                        $placa = strtoupper(trim((string)($v['placa'] ?? '')));
                        $vehQuery = $empleado->vehiculos();
                        if (!empty($placa)) {
                            $vehQuery->where('placa', $placa);
                        } else {
                            $vehQuery->where('tipo_vehiculo', $v['tipo_vehiculo'] ?? 'Automovil')->where('marca', $v['marca'] ?? '');
                        }

                        if (!$vehQuery->exists()) {
                            $empleado->vehiculos()->create([
                                'tipo_vehiculo' => !empty($v['tipo_vehiculo']) ? $v['tipo_vehiculo'] : 'Automovil',
                                'marca' => !empty($v['marca']) ? $v['marca'] : 'N/A',
                                'modelo' => !empty($v['modelo']) ? $v['modelo'] : (!empty($v['color']) ? $v['color'] : 'N/A'),
                                'year' => 2026,
                                'placa' => !empty($placa) ? $placa : 'N/A',
                                'empresa_id' => $empresaId,
                                'sucursal_id' => $sucursalId,
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return [
                'success' => true,
                'created' => $createdCount,
                'updated' => $updatedCount,
                'skipped' => $skippedCount,
                'total_processed' => $createdCount + $updatedCount + $skippedCount,
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importando empleados desde Excel: ' . $e->getMessage(), [
                'exception' => $e
            ]);

            return [
                'success' => false,
                'message' => 'Ocurrió un error al procesar la importación: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Clean phone numbers and format.
     */
    private function cleanPhoneNumber(?string $phone): ?string
    {
        if (empty($phone)) {
            return null;
        }

        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (empty($digits)) {
            return null;
        }

        // Return cleaned 10-digit phone
        return $digits;
    }

    /**
     * Helper to read .xlsx file structure via ZipArchive & SimpleXML.
     */
    private function readXlsxRows(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [];
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return [];
        }

        // 1. Read sharedStrings
        $sharedStrings = [];
        if (($ssIndex = $zip->locateName('xl/sharedStrings.xml')) !== false) {
            $ssXml = $zip->getFromIndex($ssIndex);
            $xml = @simplexml_load_string($ssXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $val) {
                    if (isset($val->t)) {
                        $sharedStrings[] = (string)$val->t;
                    } elseif (isset($val->r)) {
                        $text = '';
                        foreach ($val->r as $r) {
                            $text .= (string)$r->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // 2. Read first worksheet sheet1.xml
        $rowsData = [];
        if (($sIndex = $zip->locateName('xl/worksheets/sheet1.xml')) !== false) {
            $sXml = $zip->getFromIndex($sIndex);
            $xml = @simplexml_load_string($sXml);
            if ($xml && isset($xml->sheetData->row)) {
                foreach ($xml->sheetData->row as $row) {
                    $rowCells = [];
                    foreach ($row->c as $cell) {
                        $colRef = (string)$cell['r'];
                        $type = (string)$cell['t'];
                        $val = (string)$cell->v;

                        if ($type === 's') {
                            $idx = intval($val);
                            $cellValue = isset($sharedStrings[$idx]) ? $sharedStrings[$idx] : $val;
                        } else {
                            $cellValue = $val;
                        }

                        $rowCells[$colRef] = $cellValue;
                    }
                    $rowsData[] = [
                        'row_number' => (string)$row['r'],
                        'cells' => $rowCells,
                    ];
                }
            }
        }

        $zip->close();
        return $rowsData;
    }

    /**
     * Clean and normalize tarjeta de acceso values. If empty, null, or matching "pendiente", return "0".
     */
    private function cleanTarjetaValue(?string $val): string
    {
        if ($val === null || $val === '') {
            return '0';
        }
        $v = trim((string)$val);
        $vLower = mb_strtolower($v);
        if (
            $v === '' ||
            $vLower === 'pendiente' ||
            $vLower === 'pendientes' ||
            $vLower === 'vacio' ||
            $vLower === 'vacios' ||
            $vLower === 'null' ||
            $vLower === 'n/a'
        ) {
            return '0';
        }
        return $v;
    }

    /**
     * Map Excel column names to target keys.
     */
    private function resolveColumnMap(array $headersMap): array
    {
        $map = [
            'documento_identidad' => null,
            'curp' => null,
            'nombres' => null,
            'apellido_paterno' => null,
            'apellido_materno' => null,
            'correo' => null,
            'telefono' => null,
            'departamento' => null,
            'empresa' => null,
            'tarjeta_acceso_1' => null,
            'tarjeta_acceso_2' => null,
            'tarjeta_acceso_3' => null,
            'tipo_vehiculo' => null,
            'marca_vehiculo' => null,
            'color_vehiculo' => null,
            'placa_vehiculo' => null,
            'comentarios_vehiculo' => null,
        ];

        foreach ($headersMap as $colLetter => $headerName) {
            $h = $this->normalizeHeader($headerName);

            if (
                preg_match('/(tarjeta|tajeta|card).*?1/i', $h) ||
                $h === 'tarjeta acceso 1' ||
                $h === 'tajeta acceso 1' ||
                $h === 'tarjeta_acceso_1' ||
                $h === 'tarjeta 1'
            ) {
                $map['tarjeta_acceso_1'] = $colLetter;
            } elseif (
                preg_match('/(tarjeta|tajeta|card).*?2/i', $h) ||
                $h === 'tarjeta acceso 2' ||
                $h === 'tajeta acceso 2' ||
                $h === 'tarjeta_acceso_2' ||
                $h === 'tarjeta 2'
            ) {
                $map['tarjeta_acceso_2'] = $colLetter;
            } elseif (
                preg_match('/(tarjeta|tajeta|card).*?3/i', $h) ||
                $h === 'tarjeta acceso 3' ||
                $h === 'tajeta acceso 3' ||
                $h === 'tarjeta_acceso_3' ||
                $h === 'tarjeta 3'
            ) {
                $map['tarjeta_acceso_3'] = $colLetter;
            } elseif (str_contains($h, 'curp')) {
                $map['curp'] = $colLetter;
            } elseif (
                str_contains($h, 'empleado') ||
                str_contains($h, 'documento') ||
                str_contains($h, 'cedula') ||
                str_contains($h, 'dni') ||
                $h === 'id' ||
                $h === 'no' ||
                $h === 'num' ||
                (preg_match('/\b(no|num|n|cod|codigo|id)\b/i', $h) && preg_match('/\b(emp|empleado|colaborador|trabajador)\b/i', $h))
            ) {
                if (!str_contains($h, 'vehiculo') && !str_contains($h, 'auto') && !str_contains($h, 'placa')) {
                    $map['documento_identidad'] = $colLetter;
                }
            } elseif (str_contains($h, 'nombre') && !str_contains($h, 'apellido') && !str_contains($h, 'comercial')) {
                $map['nombres'] = $colLetter;
            } elseif (str_contains($h, 'paterno')) {
                $map['apellido_paterno'] = $colLetter;
            } elseif (str_contains($h, 'materno')) {
                $map['apellido_materno'] = $colLetter;
            } elseif (str_contains($h, 'correo') || str_contains($h, 'email')) {
                $map['correo'] = $colLetter;
            } elseif (str_contains($h, 'telefono') || str_contains($h, 'celular')) {
                $map['telefono'] = $colLetter;
            } elseif (str_contains($h, 'area') || str_contains($h, 'departamento')) {
                $map['departamento'] = $colLetter;
            } elseif (str_contains($h, 'empresa') && !str_contains($h, 'vehiculo')) {
                $map['empresa'] = $colLetter;
            } elseif (str_contains($h, 'tipo vehiculo')) {
                $map['tipo_vehiculo'] = $colLetter;
            } elseif (str_contains($h, 'marca')) {
                $map['marca_vehiculo'] = $colLetter;
            } elseif (str_contains($h, 'color')) {
                $map['color_vehiculo'] = $colLetter;
            } elseif (str_contains($h, 'placa')) {
                $map['placa_vehiculo'] = $colLetter;
            } elseif (str_contains($h, 'comentarios')) {
                $map['comentarios_vehiculo'] = $colLetter;
            }
        }

        return $map;
    }

    /**
     * Helper to normalize header string stripping accents, symbols, extra spaces and converting to lowercase.
     */
    private function normalizeHeader(string $str): string
    {
        $str = strtr($str, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
            'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u', 'Ü' => 'u', 'Ñ' => 'n'
        ]);
        $str = mb_strtolower(trim($str), 'UTF-8');
        $str = preg_replace('/[^\w\s]/u', ' ', $str);
        $str = preg_replace('/\s+/', ' ', $str);
        return trim($str);
    }

    /**
     * Get cell value by mapped column letter.
     */
    private function getCellValueByMap(array $cells, ?string $colLetter): string
    {
        if (!$colLetter) {
            return '';
        }

        foreach ($cells as $colRef => $val) {
            $letter = preg_replace('/[0-9]/', '', $colRef);
            if ($letter === $colLetter) {
                return (string)$val;
            }
        }

        return '';
    }
}
