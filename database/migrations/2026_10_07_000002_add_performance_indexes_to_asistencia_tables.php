<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices de rendimiento de Asistencia.
 *
 * Las tablas de marcajes y resúmenes no tenían ninguno, así que cada consulta por
 * empleado o por fecha recorría la tabla completa: con ~2,000 empleados la
 * Bitácora de asistencia tardaba 7 s sólo en un conteo; con el índice, 8 ms.
 * Sólo agrega índices: no cambia datos ni columnas, y se puede revertir.
 */
return new class extends Migration
{
    /** @var array<string, array<string, array<int, string>>> tabla => [índice => columnas] */
    private array $indices = [
        'asistencia_marcajes' => [
            'asistencia_marcajes_empleado_fecha_idx' => ['empleado_id', 'fecha_hora'],
        ],
        'asistencia_resumenes_diarios' => [
            'asistencia_resumenes_diarios_empleado_fecha_idx' => ['empleado_id', 'fecha'],
        ],
        'asistencia_resumenes_semanales' => [
            'asistencia_resumenes_semanales_empleado_periodo_idx' => ['empleado_id', 'periodo_inicio'],
        ],
    ];

    public function up(): void
    {
        foreach ($this->indices as $tabla => $porNombre) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }

            foreach ($porNombre as $nombre => $columnas) {
                if (! Schema::hasIndex($tabla, $nombre)) {
                    Schema::table($tabla, fn (Blueprint $t) => $t->index($columnas, $nombre));
                }
            }
        }
    }

    public function down(): void
    {
        foreach ($this->indices as $tabla => $porNombre) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }

            foreach (array_keys($porNombre) as $nombre) {
                if (Schema::hasIndex($tabla, $nombre)) {
                    Schema::table($tabla, fn (Blueprint $t) => $t->dropIndex($nombre));
                }
            }
        }
    }
};
