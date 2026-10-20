<?php

namespace App\Console\Commands;

use App\Models\Empleado;
use App\Models\User;
use App\Services\EmployeeService;
use Illuminate\Console\Command;

class SyncUsersToEmployeesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'empleados:sync-users {--empresa_id= : ID específico de la empresa a sincronizar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza todos los usuarios existentes con el módulo de empleados y asigna sus cargos';

    /**
     * Execute the console command.
     */
    public function handle(EmployeeService $employeeService): int
    {
        $this->info('🚀 Iniciando sincronización de usuarios hacia el módulo de empleados...');

        $empresaId = $this->option('empresa_id') ? (int) $this->option('empresa_id') : null;

        $query = User::with('roles');
        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
            $this->line("🏢 Filtrando exclusivamente por Empresa ID: <comment>{$empresaId}</comment>");
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->warn('⚠️ No se encontraron usuarios para sincronizar.');
            return Command::SUCCESS;
        }

        $this->line("👥 Analizando <comment>{$users->count()}</comment> usuarios registrados en el sistema...\n");

        $rows = [];
        $created = 0;
        $updated = 0;

        foreach ($users as $user) {
            $existing = Empleado::withoutGlobalScope('multitenancy')
                ->where('user_id', $user->id)
                ->first();

            $empleado = $employeeService->syncUserToEmployee($user);

            $action = $existing ? '<info>Actualizado</info>' : '<comment>Creado</comment>';
            if ($existing) {
                $updated++;
            } else {
                $created++;
            }

            $roles = $user->roles->pluck('name')->implode(', ') ?: 'Sin rol';

            $rows[] = [
                'ID Usuario' => $user->id,
                'Nombre' => $user->name,
                'Email' => $user->email,
                'Empresa ID' => $user->empresa_id ?? '1 (Default)',
                'Sucursal ID' => $user->sucursal_id ?? 'Todas',
                'Cargo' => $empleado->cargo,
                'Rol(es)' => $roles,
                'Acción' => $action,
            ];
        }

        $this->table(
            ['ID User', 'Nombre', 'Email', 'Empresa', 'Sucursal', 'Cargo Empleado', 'Rol(es)', 'Resultado'],
            $rows
        );

        $this->newLine();
        $this->info("✅ ¡Sincronización completada exitosamente!");
        $this->line("   - Empleados nuevos creados: <comment>{$created}</comment>");
        $this->line("   - Empleados existentes actualizados: <comment>{$updated}</comment>");
        $this->line("   - Total procesados: <comment>{$users->count()}</comment>");

        return Command::SUCCESS;
    }
}
