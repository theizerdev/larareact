<?php

namespace App\Console\Commands;

use App\Models\Cita;
use App\Models\CitaRecordatorio;
use App\Models\Empresa;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Sucursal;
use Illuminate\Console\Command;

class TestRecordatoriosCitas extends Command
{
    protected $signature = 'citas:test-recordatorios {--cantidad=5 : Número de citas de prueba a crear}';

    protected $description = 'Crear citas de prueba con recordatorios para probar el sistema';

    public function handle()
    {
        $this->info('🧪 Creando citas de prueba con recordatorios...');

        $cantidad = $this->option('cantidad');
        $empresa = Empresa::first();
        $sucursal = Sucursal::first();
        $especialidad = Especialidad::first();
        $medico = Medico::first();
        $paciente = Paciente::first();

        if (! $empresa || ! $sucursal || ! $especialidad || ! $medico || ! $paciente) {
            $this->error('❌ No hay datos suficientes para crear citas de prueba.');
            $this->info('Asegúrese de tener al menos:');
            $this->info('- 1 empresa');
            $this->info('- 1 sucursal');
            $this->info('- 1 especialidad');
            $this->info('- 1 médico');
            $this->info('- 1 paciente');

            return Command::FAILURE;
        }

        $citasCreadas = 0;

        for ($i = 0; $i < $cantidad; $i++) {
            try {
                // Crear cita para mañana a las 10:00 AM
                $fechaCita = now()->addDay()->setTime(10 + $i, 0, 0);

                $cita = Cita::create([
                    'paciente_id' => $paciente->id,
                    'medico_id' => $medico->id,
                    'especialidad_id' => $especialidad->id,
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => $sucursal->id,
                    'fecha_inicio' => $fechaCita,
                    'fecha_fin' => $fechaCita->copy()->addMinutes(30),
                    'motivo' => 'Consulta de prueba #'.($i + 1),
                    'estado' => 'confirmada',
                    'notas' => 'Cita creada para prueba de recordatorios',
                    'created_by' => 1,
                ]);

                // Programar recordatorios automáticamente
                $cita->programarRecordatorios();

                $this->info("✅ Cita #{$cita->id} creada para {$fechaCita->format('d/m/Y H:i')}");

                // Mostrar recordatorios creados
                $recordatorios = $cita->recordatorios;
                foreach ($recordatorios as $recordatorio) {
                    $this->info("   📅 Recordatorio {$recordatorio->tipo} programado para {$recordatorio->fecha_envio_programado->format('d/m/Y H:i')}");
                }

                $citasCreadas++;

            } catch (\Exception $e) {
                $this->error("❌ Error creando cita: {$e->getMessage()}");
            }
        }

        $this->info("\n📊 Resumen:");
        $this->info("✅ Citas creadas: {$citasCreadas}");
        $this->info('📅 Total recordatorios: '.CitaRecordatorio::count());

        // Probar el comando de procesamiento
        $this->info("\n🚀 Procesando recordatorios...");
        $this->call('citas:procesar-recordatorios');

        $this->info("\n🎉 Prueba completada!");
        $this->info("Puede verificar los recordatorios en la base de datos o ejecutar 'php artisan citas:procesar-recordatorios' para procesarlos.");

        return Command::SUCCESS;
    }
}
