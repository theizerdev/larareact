<?php

namespace App\Console\Commands;

use App\Models\ConfiguracionSox;
use App\Models\User;
use Illuminate\Console\Command;

class SoxAuditUsersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sox:audit-users {--notify : Enviar alertas si hay canales configurados}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audita el estado de contraseñas, bloqueos y cumplimiento SOX de todos los usuarios';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Iniciando auditoría de seguridad y cumplimiento SOX...');

        $globalConfig = ConfiguracionSox::current();
        $users = User::query()->where('status', true)->get();

        $lockedCount = 0;
        $expiredCount = 0;
        $warningCount = 0;
        $healthyCount = 0;

        foreach ($users as $user) {
            $config = $user->empresa_id ? ConfiguracionSox::current($user->empresa_id) : $globalConfig;
            $daysRemaining = $user->daysUntilPasswordExpires($config->password_expires_days);

            if ($user->isLocked()) {
                $lockedCount++;
                $this->warn("Usuario bloqueado por intentos fallidos: {$user->email} (Bloqueado hasta: {$user->locked_until})");
            }

            if ($user->isPasswordExpired($config->password_expires_days)) {
                $expiredCount++;
                $this->error("Contraseña caducada: {$user->email} (Días: {$daysRemaining})");
            } elseif ($daysRemaining !== null && $daysRemaining <= 7) {
                $warningCount++;
                $this->line("<fg=yellow>Contraseña por vencer pronto:</> {$user->email} ({$daysRemaining} días restantes)");
            } else {
                $healthyCount++;
            }
        }

        $summary = [
            'total_activos' => $users->count(),
            'bloqueados' => $lockedCount,
            'caducados' => $expiredCount,
            'por_vencer_7_dias' => $warningCount,
            'en_regla' => $healthyCount,
            'fecha_auditoria' => now()->toIso8601String(),
        ];

        // Registrar en la bitácora de auditoría inmutable Spatie
        activity('auth')
            ->withProperties($summary)
            ->event('sox_scheduled_audit')
            ->log("Auditoría programada SOX completada. Total: {$users->count()} usuarios. Bloqueados: {$lockedCount}. Caducados: {$expiredCount}.");

        $this->table(
            ['Métrica', 'Total'],
            [
                ['Usuarios activos auditados', $users->count()],
                ['Cuentas bloqueadas', $lockedCount],
                ['Contraseñas caducadas', $expiredCount],
                ['Próximas a vencer (<= 7 días)', $warningCount],
                ['En cumplimiento total', $healthyCount],
            ]
        );

        $this->info('Auditoría SOX registrada exitosamente en la bitácora de auditoría.');

        return self::SUCCESS;
    }
}
