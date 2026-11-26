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
            $codigoAnterior = $this->getCellValueByMap($rowCells, $colIndexMap['codigo_anterior']);
            $legacy = $this->getCellValueByMap($rowCells, $colIndexMap['legacy']);
            $curp = $this->getCellValueByMap($rowCells, $colIndexMap['curp']);
            $nombre = $this->getCellValueByMap($rowCells, $colIndexMap['nombres']);
            $apellidosCol = $this->getCellValueByMap($rowCells, $colIndexMap['apellidos']);
            $paterno = $this->getCellValueByMap($rowCells, $colIndexMap['apellido_paterno']);
            $materno = $this->getCellValueByMap($rowCells, $colIndexMap['apellido_materno']);

            // Skip completely empty rows
            if (empty($doc) && empty($nombre) && empty($paterno) && empty($apellidosCol)) {
                continue;
            }

            // Build full surnames (prefer explicit Apellido(s) column if paterno/materno are empty)
            $apellidos = trim("{$paterno} {$materno}");
            if ($apellidos === '' && trim((string) $apellidosCol) !== '') {
                $apellidos = trim((string) $apellidosCol);
            }

            // Clean Document / Employee Number
            $docClean = trim((string)$doc);
            if (empty($docClean)) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => 'Falta el Código / Número de Empleado.'
                ];
                continue;
            }

            $correo = $this->cleanEmail($this->getCellValueByMap($rowCells, $colIndexMap['correo']));
            $telefono = $this->getCellValueByMap($rowCells, $colIndexMap['telefono']);
            $departamento = $this->getCellValueByMap($rowCells, $colIndexMap['departamento']);
            $area = $this->getCellValueByMap($rowCells, $colIndexMap['area']);
            if (trim((string) $departamento) === '' && trim((string) $area) !== '') {
                $departamento = $area;
            }
            $cargo = $this->getCellValueByMap($rowCells, $colIndexMap['cargo']);
            $empresa = $this->getCellValueByMap($rowCells, $colIndexMap['empresa']);
            $codigoAcceso = $this->getCellValueByMap($rowCells, $colIndexMap['codigo_acceso']);
            $genero = $this->normalizeGenero($this->getCellValueByMap($rowCells, $colIndexMap['genero']));
            $fechaIngreso = $this->parseDateValue($this->getCellValueByMap($rowCells, $colIndexMap['fecha_ingreso']));
            $fechaNacimiento = $this->parseDateValue($this->getCellValueByMap($rowCells, $colIndexMap['fecha_nacimiento']));

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
                    'codigo_nuevo' => $docClean,
                    'codigo_anterior' => trim((string)$codigoAnterior) ?: null,
                    'legacy' => trim((string)$legacy) ?: null,
                    'codigo_acceso' => trim((string)$codigoAcceso),
                    'curp' => trim((string)$curp),
                    'nombres' => trim((string)$nombre),
                    'apellidos' => $apellidos,
                    'correo' => $correo,
                    'telefono' => $this->cleanPhoneNumber($telefono),
                    'departamento' => trim((string)$departamento),
                    'cargo' => trim((string)$cargo) ?: null,
                    'empresa' => trim((string)$empresa),
                    'genero' => $genero,
                    'fecha_ingreso' => $fechaIngreso,
                    'fecha_nacimiento' => $fechaNacimiento,
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
                    $groupedEmployees[$docClean]['correo'] = $correo;
                }
                if (empty($groupedEmployees[$docClean]['telefono']) && !empty($telefono)) {
                    $groupedEmployees[$docClean]['telefono'] = $this->cleanPhoneNumber($telefono);
                }
                if (empty($groupedEmployees[$docClean]['departamento']) && !empty($departamento)) {
                    $groupedEmployees[$docClean]['departamento'] = trim((string)$departamento);
                }
                if (empty($groupedEmployees[$docClean]['codigo_anterior']) && trim((string)$codigoAnterior) !== '') {
                    $groupedEmployees[$docClean]['codigo_anterior'] = trim((string)$codigoAnterior);
                }
                if (empty($groupedEmployees[$docClean]['legacy']) && trim((string)$legacy) !== '') {
                    $groupedEmployees[$docClean]['legacy'] = trim((string)$legacy);
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

        // Query existing employees to mark duplicates (match by documento_identidad or codigo_nuevo)
        $docsList = array_keys($groupedEmployees);
        $existingEmployees = Empleado::where(function ($q) use ($docsList) {
            $q->whereIn('documento_identidad', $docsList)
                ->orWhereIn('codigo_nuevo', $docsList);
        })->get(['id', 'documento_identidad', 'codigo_nuevo']);

        $existingDocs = [];
        foreach ($existingEmployees as $ex) {
            if ($ex->documento_identidad) {
                $existingDocs[$ex->documento_identidad] = $ex->id;
            }
            if ($ex->codigo_nuevo) {
                $existingDocs[$ex->codigo_nuevo] = $ex->id;
            }
        }

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
                'razon_social' => "Smurfit Westrock",
                'nombre_comercial' => "Smurfit Westrock",
                'status' => true,
            ]);
        }
        $empresaId = $empresa->id;

        $sucursal = ($userSucursalId ? Sucursal::find($userSucursalId) : null) ?: Sucursal::where('empresa_id', $empresaId)->first();
        if (!$sucursal) {
            $sucursal = Sucursal::create([
                'nombre' => 'Sucursal Uno',
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

                $existing = Empleado::where(function ($q) use ($doc) {
                    $q->where('documento_identidad', $doc)
                        ->orWhere('codigo_nuevo', $doc);
                })->first();

                if ($existing && $duplicateStrategy === 'skip') {
                    $skippedCount++;
                    continue;
                }

                // Resolve or create/update Departamento under fixed empresa_id and sucursal_id
                $rawDepName = !empty($rec['departamento']) ? trim($rec['departamento']) : 'General';
                $cleanDepName = trim(preg_replace('/\s+/', ' ', $rawDepName));
                if (empty($cleanDepName)) {
                    $cleanDepName = 'General';
                }

                $formattedDepName = mb_convert_case($cleanDepName, MB_CASE_TITLE, 'UTF-8');

                $dep = Departamento::where('empresa_id', $empresaId)
                    ->where(function ($q) use ($cleanDepName) {
                        $q->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower($cleanDepName)])
                          ->orWhere('nombre', 'like', $cleanDepName);
                    })->first();

                if (!$dep) {
                    $dep = Departamento::create([
                        'nombre' => $formattedDepName,
                        'descripcion' => "Departamento de {$cleanDepName}",
                        'empresa_id' => $empresaId,
                        'sucursal_id' => $sucursalId,
                        'user_id' => auth()->id() ?: 1,
                        'status' => 1,
                    ]);
                } else {
                    // Si el departamento ya existe en la base de datos, se actualiza/edita su información
                    $dep->update([
                        'nombre' => $formattedDepName,
                        'status' => 1,
                    ]);
                }
                $departamentoId = $dep->id;

                $tarjeta1 = $this->cleanTarjetaValue($rec['tarjeta_acceso_1'] ?? null);
                $tarjeta2 = $this->cleanTarjetaValue($rec['tarjeta_acceso_2'] ?? null);
                $tarjeta3 = $this->cleanTarjetaValue($rec['tarjeta_acceso_3'] ?? null);

                $codigoAccesoExcel = !empty($rec['codigo_acceso']) ? trim($rec['codigo_acceso']) : null;

                $cargoId = null;
                if (!empty($rec['cargo'])) {
                    $cleanCargoName = trim(preg_replace('/\s+/', ' ', (string) $rec['cargo']));
                    if ($cleanCargoName !== '') {
                        $formattedCargo = mb_convert_case($cleanCargoName, MB_CASE_TITLE, 'UTF-8');
                        $cargoModel = Cargo::where('empresa_id', $empresaId)
                            ->whereRaw('LOWER(TRIM(nombre)) = ?', [mb_strtolower($cleanCargoName)])
                            ->first();
                        if (! $cargoModel) {
                            $cargoModel = Cargo::create([
                                'nombre' => $formattedCargo,
                                'empresa_id' => $empresaId,
                                'sucursal_id' => $sucursalId,
                                'departamento_id' => $departamentoId,
                                'user_id' => auth()->id() ?: 1,
                                'status' => 1,
                            ]);
                        }
                        $cargoId = $cargoModel->id;
                    }
                }

                $codigoNuevo = trim((string) ($rec['codigo_nuevo'] ?? $doc));
                $codigoAnterior = !empty($rec['codigo_anterior']) ? trim((string) $rec['codigo_anterior']) : null;
                $legacy = !empty($rec['legacy']) ? trim((string) $rec['legacy']) : null;
                $correoClean = $this->cleanEmail($rec['correo'] ?? null);

                $dataToSave = [
                    'nombres' => !empty($rec['nombres']) ? $rec['nombres'] : 'N/A',
                    'apellidos' => !empty($rec['apellidos']) ? $rec['apellidos'] : 'N/A',
                    'documento_identidad' => $codigoNuevo ?: $doc,
                    'codigo_nuevo' => $codigoNuevo ?: $doc,
                    'codigo_anterior' => $codigoAnterior,
                    'legacy' => $legacy,
                    'curp' => !empty($rec['curp']) ? trim($rec['curp']) : null,
                    'tarjeta_acceso_1' => $tarjeta1,
                    'tarjeta_acceso_2' => $tarjeta2,
                    'tarjeta_acceso_3' => $tarjeta3,
                    'pais_telefono_id' => $paisId,
                    'telefono' => $rec['telefono'] ?? null,
                    'correo' => $correoClean,
                    'genero' => !empty($rec['genero']) ? $this->normalizeGenero((string) $rec['genero']) : null,
                    'fecha_ingreso' => !empty($rec['fecha_ingreso']) ? $this->parseDateValue((string) $rec['fecha_ingreso']) : null,
                    'fecha_nacimiento' => !empty($rec['fecha_nacimiento']) ? $this->parseDateValue((string) $rec['fecha_nacimiento']) : null,
                    'departamento_id' => $departamentoId,
                    'cargo_id' => $cargoId,
                    'turno_laboral_id' => $defaultTurno->id,
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursalId,
                    'status' => true,
                ];

                if (!empty($codigoAccesoExcel) && mb_strlen((string) $codigoAccesoExcel) <= 20) {
                    $occupied = Empleado::withoutTenant()
                        ->where('codigo_acceso', $codigoAccesoExcel)
                        ->when($existing, fn($q) => $q->where('id', '!=', $existing->id))
                        ->exists();

                    if (!$occupied) {
                        $dataToSave['codigo_acceso'] = $codigoAccesoExcel;
                    }
                }

                // Si viene codigo_acceso válido en el Excel, usarlo. Si no, conservar el existente o alinear con el número de empleado.
                // Generation happens inside createWithRetry's closure (not before it) so a
                // collision retry actually recomputes a fresh code instead of reusing the
                // one that just failed - see AccessCodeService::createWithRetry.
                if ($existing) {
                    $needsCode = empty($dataToSave['codigo_acceso']) && empty($existing->codigo_acceso);
                    if (empty($dataToSave['codigo_acceso']) && !empty($existing->codigo_acceso)) {
                        $dataToSave['codigo_acceso'] = $existing->codigo_acceso;
                    }
                    $docParaCodigo = (string) ($dataToSave['documento_identidad'] ?? $existing->documento_identidad ?? '');
                    \App\Services\AccessCodeService::createWithRetry(function () use ($existing, &$dataToSave, $needsCode, $docParaCodigo, $sucursalId) {
                        if ($needsCode) {
                            $dataToSave['codigo_acceso'] = $this->resolveDefaultAccessCode($docParaCodigo, $sucursalId, $existing->id);
                        }
                        $existing->update($dataToSave);
                    });
                    $empleado = $existing;
                    $updatedCount++;
                } else {
                    $docParaCodigo = (string) ($dataToSave['documento_identidad'] ?? '');
                    $empleado = \App\Services\AccessCodeService::createWithRetry(function () use ($dataToSave, $docParaCodigo, $sucursalId) {
                        if (empty($dataToSave['codigo_acceso'])) {
                            $dataToSave['codigo_acceso'] = $this->resolveDefaultAccessCode($docParaCodigo, $sucursalId);
                        }
                        return Empleado::create($dataToSave);
                    });
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
     * Prefers using the employee ID/document code directly so there is a single unified
     * code; falls back to generating an internal code only if empty, too long, or taken.
     */
    private function resolveDefaultAccessCode(string $doc, ?int $sucursalId, ?int $excludeEmpleadoId = null): string
    {
        $doc = trim($doc);
        if ($doc !== '' && mb_strlen($doc) <= 20) {
            $occupied = Empleado::withoutTenant()
                ->where('codigo_acceso', $doc)
                ->when($excludeEmpleadoId, fn ($q) => $q->where('id', '!=', $excludeEmpleadoId))
                ->exists();

            if (! $occupied) {
                return $doc;
            }
        }

        return \App\Services\AccessCodeService::generate('empleado', $sucursalId);
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
     * Helper to read .xlsx/.xls/.csv rows via PhpSpreadsheet (handles formatted dates & strings accurately).
     */
    private function readXlsxRows(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return [];
        }

        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($filePath);
            $sheet = $spreadsheet->getActiveSheet();
            $rawRows = $sheet->toArray(null, true, true, true);

            $rowsData = [];
            foreach ($rawRows as $rowNumber => $cols) {
                $cells = [];
                foreach ($cols as $colLetter => $val) {
                    if ($val !== null && trim((string) $val) !== '') {
                        $cells[$colLetter . $rowNumber] = trim((string) $val);
                    }
                }
                if (!empty($cells)) {
                    $rowsData[] = [
                        'row_number' => (int) $rowNumber,
                        'cells' => $cells,
                    ];
                }
            }

            if (!empty($rowsData)) {
                return $rowsData;
            }
        } catch (\Throwable $e) {
            Log::warning('PhpSpreadsheet fallback a ZipArchive en EmpleadoImportService: ' . $e->getMessage());
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
            'codigo_anterior' => null,
            'legacy' => null,
            'codigo_acceso' => null,
            'curp' => null,
            'nombres' => null,
            'apellidos' => null,
            'apellido_paterno' => null,
            'apellido_materno' => null,
            'correo' => null,
            'telefono' => null,
            'departamento' => null,
            'area' => null,
            'cargo' => null,
            'empresa' => null,
            'genero' => null,
            'fecha_ingreso' => null,
            'fecha_nacimiento' => null,
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

            // 1. Tarjetas de acceso (evitar sobrescribir si ya está asignada)
            if ($map['tarjeta_acceso_1'] === null && (preg_match('/(tarjeta|tajeta|card).*?1/i', $h) || $h === 'tarjeta acceso 1' || $h === 'tarjeta 1')) {
                $map['tarjeta_acceso_1'] = $colLetter;
                continue;
            }
            if ($map['tarjeta_acceso_2'] === null && (preg_match('/(tarjeta|tajeta|card).*?2/i', $h) || $h === 'tarjeta acceso 2' || $h === 'tarjeta 2')) {
                $map['tarjeta_acceso_2'] = $colLetter;
                continue;
            }
            if ($map['tarjeta_acceso_3'] === null && (preg_match('/(tarjeta|tajeta|card).*?3/i', $h) || $h === 'tarjeta acceso 3' || $h === 'tarjeta 3')) {
                $map['tarjeta_acceso_3'] = $colLetter;
                continue;
            }

            // 2. Código Legacy
            if ($map['legacy'] === null && str_contains($h, 'legacy')) {
                $map['legacy'] = $colLetter;
                continue;
            }

            // 3. Código Anterior / ID Empleado Anterior / N° de Tarjeta
            if (
                $map['codigo_anterior'] === null
                && ! str_contains($h, 'vehiculo')
                && (str_contains($h, 'anterior') || str_contains($h, 'antiguo') || str_contains($h, 'tarjeta') || $h === 'card no' || $h === 'cardno')
            ) {
                $map['codigo_anterior'] = $colLetter;
                continue;
            }

            // 4. Código de Acceso / Gafete / QR Nuevo / IVMS
            if ($map['codigo_acceso'] === null && (str_contains($h, 'gafete') || str_contains($h, 'gafette') || str_contains($h, 'qr nuevo') || str_contains($h, 'codigo acceso') || str_contains($h, 'codigo de acceso') || str_contains($h, 'ivms'))) {
                $map['codigo_acceso'] = $colLetter;
                continue;
            }

            // 5. CURP
            if ($map['curp'] === null && str_contains($h, 'curp')) {
                $map['curp'] = $colLetter;
                continue;
            }

            // 6. Cargo / Puesto (excluir 'id del cargo')
            if ($map['cargo'] === null && !str_starts_with($h, 'id ') && (str_contains($h, 'cargo') || str_contains($h, 'puesto'))) {
                $map['cargo'] = $colLetter;
                continue;
            }

            // 7. Departamento / Área (Excluir 'id de departamento', 'id de area', 'responsable', 'jefe', 'gerente')
            if (
                !str_starts_with($h, 'id ') &&
                !str_contains($h, 'responsable') && !str_contains($h, 'jefe') && !str_contains($h, 'gerente')
            ) {
                if ($map['departamento'] === null && (str_contains($h, 'departamento') || str_contains($h, 'depto') || str_contains($h, 'seccion') || str_contains($h, 'modulo') || $h === 'dep')) {
                    $map['departamento'] = $colLetter;
                    continue;
                }
                if ($map['area'] === null && str_contains($h, 'area')) {
                    $map['area'] = $colLetter;
                    continue;
                }
            }

            // 8. Documento de Identidad / ID del empleado Nuevo / No. Empleado
            if (
                !str_contains($h, 'vehiculo') && !str_contains($h, 'auto') && !str_contains($h, 'placa') && !str_contains($h, 'qr') && !str_contains($h, 'gafete') && !str_contains($h, 'gafette') && !str_contains($h, 'ivms') && !str_contains($h, 'anterior') && !str_contains($h, 'antiguo') &&
                (str_contains($h, 'empleado') || str_contains($h, 'documento') || str_contains($h, 'cedula') || str_contains($h, 'dni') || $h === 'id' || $h === 'no' || $h === 'num')
            ) {
                if ($map['documento_identidad'] === null || str_contains($h, 'nuevo') || str_contains($h, 'empleado')) {
                    $map['documento_identidad'] = $colLetter;
                }
                continue;
            }

            // 9. Apellidos y Nombres
            if ($map['apellido_paterno'] === null && str_contains($h, 'paterno')) {
                $map['apellido_paterno'] = $colLetter;
                continue;
            }
            if ($map['apellido_materno'] === null && str_contains($h, 'materno')) {
                $map['apellido_materno'] = $colLetter;
                continue;
            }
            if ($map['apellidos'] === null && str_contains($h, 'apellido')) {
                $map['apellidos'] = $colLetter;
                continue;
            }
            if ($map['nombres'] === null && str_contains($h, 'nombre') && !str_contains($h, 'apellido') && !str_contains($h, 'comercial') && !str_contains($h, 'cargo') && !str_contains($h, 'empresa') && !str_contains($h, 'planta')) {
                $map['nombres'] = $colLetter;
                continue;
            }

            // 10. Género y Fechas
            if ($map['genero'] === null && (str_contains($h, 'genero') || str_contains($h, 'sexo'))) {
                $map['genero'] = $colLetter;
                continue;
            }
            if ($map['fecha_ingreso'] === null && (str_contains($h, 'contratacion') || str_contains($h, 'fecha ingreso') || str_contains($h, 'fecha de ingreso'))) {
                $map['fecha_ingreso'] = $colLetter;
                continue;
            }
            if ($map['fecha_nacimiento'] === null && (str_contains($h, 'cumplean') || str_contains($h, 'nacimiento'))) {
                $map['fecha_nacimiento'] = $colLetter;
                continue;
            }

            // 11. Contacto
            if ($map['correo'] === null && (str_contains($h, 'correo') || str_contains($h, 'email'))) {
                $map['correo'] = $colLetter;
                continue;
            }
            if ($map['telefono'] === null && (str_contains($h, 'telefono') || str_contains($h, 'celular') || str_contains($h, 'movil'))) {
                $map['telefono'] = $colLetter;
                continue;
            }

            // 12. Empresa
            if ($map['empresa'] === null && str_contains($h, 'empresa') && !str_contains($h, 'vehiculo') && !str_contains($h, 'correo') && !str_contains($h, 'telefono') && !str_contains($h, 'movil')) {
                $map['empresa'] = $colLetter;
                continue;
            }

            // 13. Vehículos
            if ($map['tipo_vehiculo'] === null && str_contains($h, 'tipo vehiculo')) {
                $map['tipo_vehiculo'] = $colLetter;
                continue;
            }
            if ($map['marca_vehiculo'] === null && str_contains($h, 'marca')) {
                $map['marca_vehiculo'] = $colLetter;
                continue;
            }
            if ($map['color_vehiculo'] === null && str_contains($h, 'color')) {
                $map['color_vehiculo'] = $colLetter;
                continue;
            }
            if ($map['placa_vehiculo'] === null && str_contains($h, 'placa')) {
                $map['placa_vehiculo'] = $colLetter;
                continue;
            }
            if ($map['comentarios_vehiculo'] === null && str_contains($h, 'comentarios')) {
                $map['comentarios_vehiculo'] = $colLetter;
                continue;
            }
        }

        return $map;
    }

    private function cleanEmail(?string $value): ?string
    {
        $val = trim((string) $value);
        if ($val === '' || $val === '0' || $val === '-' || strtoupper($val) === 'N/A') {
            return null;
        }

        return filter_var($val, FILTER_VALIDATE_EMAIL) ? mb_strtolower($val, 'UTF-8') : null;
    }

    private function normalizeGenero(?string $value): ?string
    {
        $v = mb_strtoupper(trim((string) $value), 'UTF-8');
        if ($v === '') {
            return null;
        }
        if (in_array($v, ['M', 'MASCULINO', 'HOMBRE', 'MALE'], true)) {
            return 'M';
        }
        if (in_array($v, ['F', 'FEMENINO', 'MUJER', 'FEMALE'], true)) {
            return 'F';
        }

        return null;
    }

    private function parseDateValue(?string $value): ?string
    {
        $val = trim((string) $value);
        if ($val === '' || $val === '0' || $val === '-') {
            return null;
        }

        if (is_numeric($val) && (float) $val > 1000) {
            try {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject((float) $val)->format('Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        foreach (['Y-m-d', 'm/d/Y', 'n/j/Y', 'd/m/Y', 'j/n/Y', 'd-m-Y', 'm-d-Y'] as $fmt) {
            try {
                $dt = \Carbon\Carbon::createFromFormat($fmt, $val);
                if ($dt && $dt->year >= 1900 && $dt->year <= 2100) {
                    return $dt->format('Y-m-d');
                }
            } catch (\Throwable) {
            }
        }

        try {
            return \Carbon\Carbon::parse($val)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
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
