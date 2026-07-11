<?php

namespace App\Console\Commands;

use App\Exports\DynamicDatabaseExport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ExportDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'database:export
                            {table : Nombre de la tabla a exportar}
                            {--format=excel : Formato de exportación (excel, csv, pdf)}
                            {--conditions=* : Condiciones de filtrado (ejemplo: "columna=valor")}
                            {--columns=* : Columnas específicas a exportar}
                            {--output= : Nombre del archivo de salida}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Exportar datos de una tabla de la base de datos con filtros opcionales';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $table = $this->argument('table');
        $format = $this->option('format');
        $conditions = $this->option('conditions');
        $columns = $this->option('columns');
        $output = $this->option('output');

        // Validar formato
        if (!in_array($format, ['excel', 'csv', 'pdf'])) {
            $this->error('Formato no válido. Use: excel, csv o pdf');
            return 1;
        }

        // Obtener empresa_id del usuario autenticado (si existe)
        $empresaId = auth()->check() ? auth()->user()->empresa_id : null;
        $sucursalId = auth()->check() ? auth()->user()->sucursal_id : null;

        // Procesar condiciones
        $processedConditions = [];
        foreach ($conditions as $condition) {
            if (str_contains($condition, '=')) {
                [$column, $value] = explode('=', $condition, 2);
                $processedConditions[] = [
                    'column' => $column,
                    'operator' => '=',
                    'value' => $value
                ];
            }
        }

        // Procesar columnas
        $selectedColumns = !empty($columns) ? $columns : ['*'];

        // Crear nombre de archivo si no se proporciona
        if (!$output) {
            $output = "{$table}_export_" . now()->format('Y-m-d_H-i-s');
        }

        try {
            $this->info("Iniciando exportación de la tabla '{$table}'...");

            // Crear la exportación
            $exportData = [
                'table' => $table,
                'columns' => $selectedColumns,
                'conditions' => $processedConditions,
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
            ];

            $export = new DynamicDatabaseExport($exportData);

            // Determinar la extensión del archivo
            $extension = match($format) {
                'excel' => 'xlsx',
                'csv' => 'csv',
                'pdf' => 'pdf',
                default => 'xlsx'
            };

            $filename = "{$output}.{$extension}";
            $path = "exports/{$filename}";

            // Realizar la exportación
            if ($format === 'csv') {
                Excel::store($export, $path, 'public', \Maatwebsite\Excel\Excel::CSV);
            } else {
                Excel::store($export, $path, 'public');
            }

            $this->info("✅ Exportación completada exitosamente!");
            $this->info("📁 Archivo guardado: storage/app/public/{$path}");

            // Mostrar estadísticas
            $this->info("📊 Tabla: {$table}");
            $this->info("📝 Columnas: " . (in_array('*', $selectedColumns) ? 'Todas' : implode(', ', $selectedColumns)));
            $this->info("🔍 Condiciones: " . (empty($processedConditions) ? 'Ninguna' : count($processedConditions)));
            $this->info("💾 Formato: " . strtoupper($format));

            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Error durante la exportación: ' . $e->getMessage());
            return 1;
        }
    }
}
