<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('opciones_comida', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->string('nombre', 80);
            $table->string('tipo', 30)->default('almuerzo'); // desayuno, almuerzo, cena, refrigerio
            $table->string('descripcion', 255)->nullable();
            $table->decimal('costo_empleado', 10, 2)->default(0.00);
            $table->decimal('costo_empresa', 10, 2)->default(0.00);
            $table->time('hora_inicio')->nullable();
            $table->time('hora_fin')->nullable();
            $table->json('dias_disponibles')->nullable();
            $table->string('icono', 50)->default('utensils');
            $table->string('color', 50)->default('amber');
            $table->integer('orden')->default(0);
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empresa_id', 'status']);
            $table->index(['empresa_id', 'tipo', 'status']);
        });

        // Poblado inicial a partir de configuraciones_asistencia o defaults
        try {
            $empresas = \Illuminate\Support\Facades\DB::table('empresas')->get(['id']);
            foreach ($empresas as $empresa) {
                $config = \Illuminate\Support\Facades\DB::table('configuraciones_asistencia')->where('empresa_id', $empresa->id)->first();
                $opcionesJson = $config && !empty($config->opciones_comida) ? json_decode($config->opciones_comida, true) : null;
                $lista = !empty($opcionesJson) ? $opcionesJson : [
                    ['nombre' => 'Desayuno', 'tipo' => 'desayuno', 'costo' => 0, 'icono' => 'coffee', 'color' => 'amber'],
                    ['nombre' => 'Almuerzo / Comida', 'tipo' => 'almuerzo', 'costo' => 0, 'icono' => 'utensils', 'color' => 'emerald'],
                    ['nombre' => 'Cena', 'tipo' => 'cena', 'costo' => 0, 'icono' => 'moon', 'color' => 'blue'],
                    ['nombre' => 'Refrigerio', 'tipo' => 'refrigerio', 'costo' => 0, 'icono' => 'apple', 'color' => 'purple'],
                ];

                $orden = 1;
                foreach ($lista as $item) {
                    if (!empty($item['nombre'])) {
                        $nombreLower = mb_strtolower($item['nombre']);
                        $tipo = $item['tipo'] ?? (
                            str_contains($nombreLower, 'desayuno') ? 'desayuno' :
                            (str_contains($nombreLower, 'cena') ? 'cena' :
                            (str_contains($nombreLower, 'refrigerio') ? 'refrigerio' : 'almuerzo'))
                        );

                        \Illuminate\Support\Facades\DB::table('opciones_comida')->insert([
                            'empresa_id' => $empresa->id,
                            'nombre' => trim($item['nombre']),
                            'tipo' => $tipo,
                            'descripcion' => null,
                            'costo_empleado' => (float) ($item['costo'] ?? 0),
                            'costo_empresa' => (float) ($item['costo'] ?? 0),
                            'icono' => $item['icono'] ?? ($tipo === 'desayuno' ? 'coffee' : ($tipo === 'cena' ? 'moon' : ($tipo === 'refrigerio' ? 'apple' : 'utensils'))),
                            'color' => $item['color'] ?? ($tipo === 'desayuno' ? 'amber' : ($tipo === 'cena' ? 'blue' : ($tipo === 'refrigerio' ? 'purple' : 'emerald'))),
                            'orden' => $orden++,
                            'status' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Ignorar en entornos de test donde la base está vacía
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opciones_comida');
    }
};
