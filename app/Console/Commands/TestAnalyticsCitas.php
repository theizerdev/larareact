<?php

namespace App\Console\Commands;

use App\Models\Cita;
use App\Models\CitaRecordatorio;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Sucursal;
use Carbon\Carbon;
use Illuminate\Console\Command;

class TestAnalyticsCitas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'citas:test-analytics 
                            {--cantidad=50 : Número de citas de prueba a crear}
                            {--dias=30 : Días hacia atrás para generar citas}
                            {--estados=mixed : Estados de las citas (mixed, todas, confirmadas, canceladas, completadas)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear citas de prueba para analytics con diferentes estados y distribuciones';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cantidad = $this->option('cantidad');
        $dias = $this->option('dias');
        $estados = $this->option('estados');

        $this->info("🧪 Creando {$cantidad} citas de prueba para analytics...");
        $this->info("📅 Período: últimos {$dias} días");
        $this->info("📊 Estados: {$estados}");

        // Obtener datos base
        $empresaId = auth()->check() ? auth()->user()->empresa_id : 1;
        $sucursal = Sucursal::forUser()->first();
        $medicos = Medico::forUser()->activos()->limit(5)->get();
        $pacientes = Paciente::forUser()->limit(20)->get();
        $especialidades = Especialidad::forUser()->activas()->limit(5)->get();

        if ($medicos->isEmpty() || $pacientes->isEmpty() || $especialidades->isEmpty()) {
            $this->error('❌ No hay suficientes datos base (médicos, pacientes o especialidades)');

            return 1;
        }

        $bar = $this->output->createProgressBar($cantidad);
        $bar->start();

        $estadosDisponibles = $this->getEstadosDisponibles($estados);
        $citasCreadas = 0;

        for ($i = 0; $i < $cantidad; $i++) {
            try {
                // Generar fecha aleatoria dentro del período
                $fecha = Carbon::now()->subDays(rand(0, $dias))->addHours(rand(8, 18));

                // Seleccionar médico, paciente y especialidad aleatorios
                $medico = $medicos->random();
                $paciente = $pacientes->random();
                $especialidad = $especialidades->random();

                // Generar duración de consulta (30-60 minutos)
                $duracion = $especialidad->duracion_consulta ?? 30;
                $fechaFin = (clone $fecha)->addMinutes($duracion);

                // Seleccionar estado según distribución realista
                $estado = $this->seleccionarEstadoDistribuido($estadosDisponibles);

                // Crear la cita
                $cita = Cita::create([
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $sucursal->id,
                    'paciente_id' => $paciente->id,
                    'medico_id' => $medico->id,
                    'especialidad_id' => $especialidad->id,
                    'fecha_inicio' => $fecha,
                    'fecha_fin' => $fechaFin,
                    'estado' => $estado,
                    'motivo' => $this->generarMotivo($estado),
                    'notas' => $this->generarNotas($estado),
                    'monto' => $especialidad->costo_consulta ?? 500,
                    'tipo_cita' => 'consulta',
                    'canal_registro' => ['web', 'telefono', 'presencial'][rand(0, 2)],
                    'recordatorio_enviado' => false,
                    'confirmacion_paciente' => in_array($estado, [Cita::ESTADO_CONFIRMADA, Cita::ESTADO_FINALIZADA]) ? true : (rand(0, 1) ? true : false),
                ]);

                // Programar recordatorios para citas futuras confirmadas
                if (in_array($estado, [Cita::ESTADO_CONFIRMADA, Cita::ESTADO_PENDIENTE]) && $fecha->isFuture()) {
                    $cita->programarRecordatorios();
                }

                $citasCreadas++;
                $bar->advance();

            } catch (\Exception $e) {
                $this->error("\n❌ Error creando cita: ".$e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine();

        $this->info("✅ Citas creadas exitosamente: {$citasCreadas}");

        // Mostrar distribución por estados
        $distribucion = Cita::forUser()
            ->whereDate('fecha_inicio', '>=', Carbon::now()->subDays($dias))
            ->selectRaw('estado, COUNT(*) as total')
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();

        $this->info('📊 Distribución por estados:');
        foreach ($distribucion as $estado => $total) {
            $this->info("   {$estado}: {$total}");
        }

        // Mostrar estadísticas generales
        $totalCitas = Cita::forUser()->count();
        $totalRecordatorios = CitaRecordatorio::count();

        $this->info('📈 Estadísticas generales:');
        $this->info("   Total de citas en el sistema: {$totalCitas}");
        $this->info("   Total de recordatorios: {$totalRecordatorios}");

        return 0;
    }

    private function getEstadosDisponibles(string $tipo): array
    {
        $todosEstados = [
            Cita::ESTADO_PENDIENTE,
            Cita::ESTADO_CONFIRMADA,
            Cita::ESTADO_FINALIZADA,
            Cita::ESTADO_CANCELADA,
            Cita::ESTADO_NO_ASISTIO,
        ];

        return match ($tipo) {
            'todas' => $todosEstados,
            'confirmadas' => [Cita::ESTADO_CONFIRMADA],
            'canceladas' => [Cita::ESTADO_CANCELADA, Cita::ESTADO_NO_ASISTIO],
            'completadas' => [Cita::ESTADO_FINALIZADA],
            'mixed' => $this->getDistribucionRealista(),
            default => $todosEstados,
        };
    }

    private function getDistribucionRealista(): array
    {
        // Distribución realista basada en datos típicos de clínicas
        $distribucion = [];

        // 60% confirmadas/completadas
        for ($i = 0; $i < 60; $i++) {
            $distribucion[] = $i < 45 ? Cita::ESTADO_CONFIRMADA : Cita::ESTADO_FINALIZADA;
        }

        // 25% pendientes
        for ($i = 0; $i < 25; $i++) {
            $distribucion[] = Cita::ESTADO_PENDIENTE;
        }

        // 15% canceladas/no asistidas
        for ($i = 0; $i < 15; $i++) {
            $distribucion[] = $i < 10 ? Cita::ESTADO_CANCELADA : Cita::ESTADO_NO_ASISTIO;
        }

        return $distribucion;
    }

    private function seleccionarEstadoDistribuido(array $estadosDisponibles): string
    {
        if (count($estadosDisponibles) === 1) {
            return $estadosDisponibles[0];
        }

        return $estadosDisponibles[array_rand($estadosDisponibles)];
    }

    private function generarMotivo(string $estado): string
    {
        return match ($estado) {
            Cita::ESTADO_CANCELADA => [
                'Cancelado por el paciente',
                'Emergencia personal',
                'Cambio de horario solicitado',
                'Enfermedad del paciente',
                'Motivos personales',
            ][rand(0, 4)],
            Cita::ESTADO_NO_ASISTIO => [
                'No se presentó a la cita',
                'Olvidó la cita',
                'Problemas de transporte',
                'Emergencia imprevista',
                'Sin aviso previo',
            ][rand(0, 4)],
            Cita::ESTADO_FINALIZADA => [
                'Consulta médica general',
                'Revisión de rutina',
                'Control de seguimiento',
                'Chequeo médico',
                'Consulta especializada',
            ][rand(0, 4)],
            default => 'Cita médica programada'
        };
    }

    private function generarNotas(string $estado): ?string
    {
        if (in_array($estado, [Cita::ESTADO_CANCELADA, Cita::ESTADO_NO_ASISTIO])) {
            $notas = [
                'Paciente solicitó re-agendamiento',
                'Se ofreció nueva fecha disponible',
                'Se registró en lista de espera',
                'Se enviaron nuevas opciones de horario',
                'Se contactará para confirmar nueva cita',
            ];

            return $notas[rand(0, count($notas) - 1)];
        }

        return null;
    }
}
