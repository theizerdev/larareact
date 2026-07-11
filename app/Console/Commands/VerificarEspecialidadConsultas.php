<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Consulta;

class VerificarEspecialidadConsultas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'consultas:verificar-especialidad';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar por qué las consultas en enfermería no muestran especialidad';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== VERIFICACIÓN DE ESPECIALIDADES EN CONSULTAS ===');
        $this->newLine();

        // Verificar consultas en sala de espera
        $this->info('1. CONSULTAS EN SALA DE ESPERA:');
        $this->line('----------------------------------------');
        $consultasSalaEspera = Consulta::where('estado', 'sala_espera')
            ->with(['paciente', 'medico', 'especialidad'])
            ->limit(10)
            ->get();

        foreach($consultasSalaEspera as $consulta) {
            $this->line("ID: {$consulta->id} | " .
                      "Paciente: {$consulta->paciente->nombre_completo} | " .
                      "Médico: {$consulta->medico->nombre_completo} | " .
                      "Especialidad: " . ($consulta->especialidad ? $consulta->especialidad->nombre : 'SIN ESPECIALIDAD') . " | " .
                      "Especialidad ID: " . ($consulta->especialidad_id ?? 'NULL'));
        }

        $this->newLine();
        $this->info('2. CONSULTAS EN ENFERMERÍA:');
        $this->line('----------------------------------------');
        $consultasEnfermeria = Consulta::where('estado', 'en_enfermeria')
            ->with(['paciente', 'medico', 'especialidad'])
            ->limit(10)
            ->get();

        foreach($consultasEnfermeria as $consulta) {
            $this->line("ID: {$consulta->id} | " .
                      "Paciente: {$consulta->paciente->nombre_completo} | " .
                      "Médico: {$consulta->medico->nombre_completo} | " .
                      "Especialidad: " . ($consulta->especialidad ? $consulta->especialidad->nombre : 'SIN ESPECIALIDAD') . " | " .
                      "Especialidad ID: " . ($consulta->especialidad_id ?? 'NULL'));
        }

        $this->newLine();
        $this->info('3. RESUMEN ESTADISTICAS:');
        $this->line('----------------------------------------');

        // Total de consultas por estado
        $totalSalaEspera = Consulta::where('estado', 'sala_espera')->count();
        $totalEnfermeria = Consulta::where('estado', 'en_enfermeria')->count();

        // Consultas sin especialidad
        $sinEspecialidadSala = Consulta::where('estado', 'sala_espera')
            ->whereNull('especialidad_id')
            ->count();
            
        $sinEspecialidadEnfermeria = Consulta::where('estado', 'en_enfermeria')
            ->whereNull('especialidad_id')
            ->count();

        $this->line("Total en sala de espera: {$totalSalaEspera}");
        $this->line("Sin especialidad en sala de espera: {$sinEspecialidadSala}");
        $this->line("Con especialidad en sala de espera: " . ($totalSalaEspera - $sinEspecialidadSala));
        $this->newLine();
        $this->line("Total en enfermería: {$totalEnfermeria}");
        $this->line("Sin especialidad en enfermería: {$sinEspecialidadEnfermeria}");
        $this->line("Con especialidad en enfermería: " . ($totalEnfermeria - $sinEspecialidadEnfermeria));

        // Verificar el flujo de estados
        $this->newLine();
        $this->info('4. ANÁLISIS DE EJEMPLO:');
        $this->line('----------------------------------------');

        $ejemploConsulta = Consulta::where('estado', 'en_enfermeria')
            ->whereNull('especialidad_id')
            ->first();

        if ($ejemploConsulta) {
            $this->line("Ejemplo de consulta sin especialidad:");
            $this->line("ID: {$ejemploConsulta->id}");
            $this->line("Estado actual: {$ejemploConsulta->estado}");
            $this->line("Médico asignado: {$ejemploConsulta->medico->nombre_completo}");
            $this->line("¿El médico tiene especialidad? " . ($ejemploConsulta->medico->especialidad ? 'SÍ' : 'NO'));
            if ($ejemploConsulta->medico->especialidad) {
                $this->line("Especialidad del médico: {$ejemploConsulta->medico->especialidad->nombre}");
            }
        } else {
            $this->line("No se encontraron consultas en enfermería sin especialidad");
        }

        // Verificar cómo se crean las consultas
        $this->newLine();
        $this->info('5. ANÁLISIS DE CREACIÓN DE CONSULTAS:');
        $this->line('----------------------------------------');

        // Verificar últimas consultas creadas
        $ultimasConsultas = Consulta::latest()->limit(5)->get();
        foreach($ultimasConsultas as $consulta) {
            $this->line("ID: {$consulta->id} | Estado: {$consulta->estado} | Especialidad ID: " . ($consulta->especialidad_id ?? 'NULL') . " | Médico ID: {$consulta->medico_id}");
        }

        $this->newLine();
        $this->info('=== FIN DEL ANÁLISIS ===');
    }
}