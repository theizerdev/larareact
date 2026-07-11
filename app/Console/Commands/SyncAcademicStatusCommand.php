<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Matricula;
use App\Models\AcademicStatusTracking;
use App\Models\AcademicRecord;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

class SyncAcademicStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'academic:sync-status {--matricula_id= : ID específico de matrícula}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincronizar el estado académico de los estudiantes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando sincronización de estado académico...');

        $matriculaId = $this->option('matricula_id');
        
        if ($matriculaId) {
            $matriculas = Matricula::where('id', $matriculaId)->get();
        } else {
            $matriculas = Matricula::where('estado', 'activo')->get();
        }

        $processed = 0;
        $errors = 0;

        foreach ($matriculas as $matricula) {
            try {
                DB::beginTransaction();
                
                $this->syncAcademicStatus($matricula);
                
                DB::commit();
                $processed++;
                $this->info("✅ Matrícula {$matricula->id} sincronizada exitosamente");
                
            } catch (\Exception $e) {
                DB::rollBack();
                $errors++;
                $this->error("❌ Error en matrícula {$matricula->id}: " . $e->getMessage());
            }
        }

        $this->info("\n📊 Resumen:");
        $this->info("✅ Procesadas: {$processed}");
        $this->info("❌ Errores: {$errors}");
        $this->info("✅ Sincronización completada");

        return Command::SUCCESS;
    }

    private function syncAcademicStatus(Matricula $matricula)
    {
        // Obtener registros académicos de la matrícula
        $academicRecords = AcademicRecord::where('matricula_id', $matricula->id)->get();
        
        if ($academicRecords->isEmpty()) {
            $this->warn("⚠️ No hay registros académicos para la matrícula {$matricula->id}");
            return;
        }

        // Calcular estadísticas
        $totalSubjects = $academicRecords->count();
        $approvedSubjects = $academicRecords->where('status', AcademicRecord::STATUS_COMPLETED)->where('promoted', true)->count();
        $failedSubjects = $academicRecords->where('status', AcademicRecord::STATUS_FAILED)->count();
        $inRecoverySubjects = $academicRecords->where('in_recovery', true)->count();
        
        // Calcular promedio
        $average = $academicRecords->avg('final_grade');
        
        // Determinar estado académico
        $academicStatus = $this->determineAcademicStatus($approvedSubjects, $totalSubjects, $failedSubjects);
        
        // Determinar nivel de rendimiento
        $performanceLevel = $this->determinePerformanceLevel($average);

        // Actualizar o crear registro de seguimiento
        $tracking = AcademicStatusTracking::updateOrCreate(
            [
                'student_id' => $matricula->estudiante_id,
                'matricula_id' => $matricula->id,
                'school_period_id' => $matricula->periodo_id,
            ],
            [
                'program_id' => $matricula->programa_id,
                'educational_level_id' => $matricula->nivel_educativo_id,
                'empresa_id' => $matricula->empresa_id,
                'sucursal_id' => $matricula->sucursal_id,
                'academic_status' => $academicStatus,
                'period_average' => $average,
                'total_subjects' => $totalSubjects,
                'approved_subjects' => $approvedSubjects,
                'failed_subjects' => $failedSubjects,
                'in_recovery_subjects' => $inRecoverySubjects,
                'performance_level' => $performanceLevel,
                'promoted' => $approvedSubjects >= ($totalSubjects * 0.7), // 70% de aprobación
                'enrollment_date' => $matricula->fecha_matricula,
                'status' => AcademicStatusTracking::TRACKING_ACTIVE,
            ]
        );

        // Actualizar registros académicos con el tracking ID
        AcademicRecord::where('matricula_id', $matricula->id)
                     ->update(['status' => $this->mapAcademicStatus($academicStatus)]);

        $this->info("📈 Estado académico: {$academicStatus}, Promedio: {$average}, Aprobadas: {$approvedSubjects}/{$totalSubjects}");
    }

    private function determineAcademicStatus($approved, $total, $failed)
    {
        if ($total == 0) return AcademicStatusTracking::STATUS_ACTIVE;
        
        $approvalRate = ($approved / $total) * 100;
        
        if ($approvalRate >= 70) {
            return AcademicStatusTracking::STATUS_COMPLETED;
        } elseif ($approvalRate >= 50) {
            return AcademicStatusTracking::STATUS_ACTIVE;
        } elseif ($failed > ($total * 0.5)) {
            return AcademicStatusTracking::STATUS_PROBATION;
        } else {
            return AcademicStatusTracking::STATUS_SUSPENDED;
        }
    }

    private function determinePerformanceLevel($average)
    {
        if ($average >= 90) return AcademicStatusTracking::PERFORMANCE_EXCELLENT;
        if ($average >= 80) return AcademicStatusTracking::PERFORMANCE_GOOD;
        if ($average >= 70) return AcademicStatusTracking::PERFORMANCE_AVERAGE;
        return AcademicStatusTracking::PERFORMANCE_POOR;
    }

    private function mapAcademicStatus($academicStatus)
    {
        return match($academicStatus) {
            AcademicStatusTracking::STATUS_COMPLETED => AcademicRecord::STATUS_COMPLETED,
            AcademicStatusTracking::STATUS_WITHDRAWN => AcademicRecord::STATUS_WITHDRAWN,
            default => AcademicRecord::STATUS_ENROLLED,
        };
    }
}