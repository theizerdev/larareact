<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Matricula;
use App\Models\AcademicStatusTracking;
use App\Models\Certificate;
use App\Models\AcademicRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateCertificateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'academic:generate-certificate 
                            {--matricula_id= : ID específico de matrícula}
                            {--type= : Tipo de certificado (completion|conduct|academic)}
                            {--force : Forzar generación aunque ya exista}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generar certificados para estudiantes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando generación de certificados...');

        $matriculaId = $this->option('matricula_id');
        $type = $this->option('type') ?? Certificate::TYPE_COMPLETION;
        $force = $this->option('force');

        if (!in_array($type, [
            Certificate::TYPE_COMPLETION,
            Certificate::TYPE_CONDUCT,
            Certificate::TYPE_ACADEMIC
        ])) {
            $this->error("❌ Tipo de certificado inválido: {$type}");
            return Command::FAILURE;
        }

        if ($matriculaId) {
            $matriculas = Matricula::where('id', $matriculaId)->get();
        } else {
            $matriculas = Matricula::where('estado', 'activo')
                                  ->whereHas('academicStatusTracking', function($query) {
                                      $query->where('academic_status', AcademicStatusTracking::STATUS_COMPLETED);
                                  })
                                  ->get();
        }

        $generated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($matriculas as $matricula) {
            try {
                DB::beginTransaction();
                
                $result = $this->generateCertificate($matricula, $type, $force);
                
                DB::commit();
                
                if ($result === 'generated') {
                    $generated++;
                    $this->info("✅ Certificado generado para matrícula {$matricula->id}");
                } else {
                    $skipped++;
                    $this->warn("⚠️ Certificado ya existe para matrícula {$matricula->id}");
                }
                
            } catch (\Exception $e) {
                DB::rollBack();
                $errors++;
                $this->error("❌ Error en matrícula {$matricula->id}: " . $e->getMessage());
            }
        }

        $this->info("\n📊 Resumen:");
        $this->info("✅ Generados: {$generated}");
        $this->info("⚠️ Omitidos: {$skipped}");
        $this->info("❌ Errores: {$errors}");
        $this->info("✅ Proceso completado");

        return Command::SUCCESS;
    }

    private function generateCertificate(Matricula $matricula, string $type, bool $force): string
    {
        // Verificar si ya existe un certificado activo del mismo tipo
        if (!$force) {
            $existingCertificate = Certificate::where('matricula_id', $matricula->id)
                                            ->where('certificate_type', $type)
                                            ->where('status', Certificate::STATUS_ACTIVE)
                                            ->first();

            if ($existingCertificate) {
                return 'skipped';
            }
        }

        // Obtener el estado académico actual
        $academicStatus = AcademicStatusTracking::where('matricula_id', $matricula->id)
                                               ->where('status', AcademicStatusTracking::TRACKING_ACTIVE)
                                               ->first();

        if (!$academicStatus) {
            throw new \Exception("No se encontró estado académico para la matrícula");
        }

        // Obtener registros académicos
        $academicRecords = AcademicRecord::where('matricula_id', $matricula->id)->get();

        // Preparar datos académicos
        $academicData = $this->prepareAcademicData($academicStatus, $academicRecords);

        // Generar contenido del certificado
        $content = $this->generateCertificateContent($matricula, $academicStatus, $type);

        // Generar número de certificado y código de verificación
        $certificateNumber = $this->generateCertificateNumber($matricula, $type);
        $verificationCode = $this->generateVerificationCode();

        // Crear el certificado
        $certificate = Certificate::create([
            'student_id' => $matricula->estudiante_id,
            'matricula_id' => $matricula->id,
            'school_period_id' => $matricula->periodo_id,
            'empresa_id' => $matricula->empresa_id,
            'sucursal_id' => $matricula->sucursal_id,
            'certificate_type' => $type,
            'certificate_number' => $certificateNumber,
            'issue_date' => now(),
            'status' => Certificate::STATUS_ACTIVE,
            'content' => $content,
            'academic_data' => $academicData,
            'overall_average' => $academicStatus->period_average,
            'total_subjects' => $academicStatus->total_subjects,
            'approved_subjects' => $academicStatus->approved_subjects,
            'conduct_grade' => $academicStatus->conduct_grade,
            'attendance_percentage' => $academicStatus->attendance_percentage,
            'completed' => true,
            'is_digital' => true,
            'verification_code' => $verificationCode,
            'issued_by_user_id' => auth()->id() ?? 1, // Usuario por defecto si no hay autenticación
        ]);

        return 'generated';
    }

    private function prepareAcademicData(AcademicStatusTracking $academicStatus, $academicRecords): array
    {
        return [
            'subjects' => $academicRecords->map(function ($record) {
                return [
                    'subject' => $record->subject->name ?? 'N/A',
                    'grade' => $record->final_grade,
                    'status' => $record->status,
                    'promoted' => $record->promoted,
                ];
            })->toArray(),
            'performance_summary' => [
                'average' => $academicStatus->period_average,
                'performance_level' => $academicStatus->performance_level,
                'approval_rate' => $academicStatus->approval_rate,
            ],
            'attendance_summary' => [
                'percentage' => $academicStatus->attendance_percentage,
            ],
        ];
    }

    private function generateCertificateContent(Matricula $matricula, AcademicStatusTracking $academicStatus, string $type): string
    {
        $student = $matricula->estudiante;
        $program = $matricula->programa;
        $period = $matricula->periodo;

        $content = "CERTIFICADO DE ";
        
        switch ($type) {
            case Certificate::TYPE_COMPLETION:
                $content .= "COMPLETACIÓN DE ESTUDIOS";
                $body = "La institución certifica que el/la estudiante {$student->full_name} ha completado exitosamente el período académico {$period->name} en el programa {$program->name}.";
                break;
                
            case Certificate::TYPE_CONDUCT:
                $content .= "CONDUCTA";
                $body = "La institución certifica que el/la estudiante {$student->full_name} ha mantenido una conducta {$academicStatus->conduct_grade} durante el período académico {$period->name}.";
                break;
                
            case Certificate::TYPE_ACADEMIC:
                $content .= "RENDIMIENTO ACADÉMICO";
                $body = "La institución certifica que el/la estudiante {$student->full_name} ha obtenido un promedio de {$academicStatus->period_average} en el período académico {$period->name}.";
                break;
        }

        $content .= "\n\n{$body}\n\n";
        $content .= "Promedio: {$academicStatus->period_average}\n";
        $content .= "Materias aprobadas: {$academicStatus->approved_subjects} de {$academicStatus->total_subjects}\n";
        $content .= "Asistencia: {$academicStatus->attendance_percentage}%\n";
        $content .= "Nivel de rendimiento: {$academicStatus->performance_level}\n";

        return $content;
    }

    private function generateCertificateNumber(Matricula $matricula, string $type): string
    {
        $prefix = match($type) {
            Certificate::TYPE_COMPLETION => 'COM',
            Certificate::TYPE_CONDUCT => 'CON',
            Certificate::TYPE_ACADEMIC => 'ACA',
            default => 'CRT',
        };

        $year = date('Y');
        $sequence = str_pad(Certificate::whereYear('created_at', $year)->count() + 1, 6, '0', STR_PAD_LEFT);
        
        return "{$prefix}-{$year}-{$sequence}";
    }

    private function generateVerificationCode(): string
    {
        return strtoupper(Str::random(8));
    }
}