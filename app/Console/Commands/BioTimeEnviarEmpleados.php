<?php

namespace App\Console\Commands;

use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Services\BioTimeEmpleadoPusher;
use Illuminate\Console\Command;

/**
 * Envía a BioTime a los colaboradores que ya existían antes de activar el
 * envío automático (la web sólo envía lo que se crea o edita después).
 *
 * Por defecto sólo los activos sin vínculo con BioTime; --todos también
 * revisa a los vinculados y les manda lo que difiera.
 */
class BioTimeEnviarEmpleados extends Command
{
    protected $signature = 'biotime:enviar-empleados
        {--empresa= : ID de la empresa (por defecto: todas con biotime_push)}
        {--empleado=* : IDs de colaboradores específicos}
        {--todos : Incluye a los ya vinculados con BioTime}
        {--dry-run : Muestra lo que haría sin escribir en BioTime}';

    protected $description = 'Da de alta / actualiza en BioTime a los colaboradores de Organización';

    public function handle(BioTimeEmpleadoPusher $pusher): int
    {
        $empresas = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id))
            ->when(! $this->option('empresa'), fn ($q) => $q->where('biotime_push', true))
            ->get();

        $exit = self::SUCCESS;
        $dryRun = (bool) $this->option('dry-run');

        foreach ($empresas as $empresa) {
            if (! BioTimeEmpleadoPusher::habilitado($empresa)) {
                $this->error("Empresa #{$empresa->id}: el envío a BioTime no está activo (BioTime activo, envío activo y credenciales).");
                $exit = self::FAILURE;

                continue;
            }

            $vinculados = BiotimeEmpleado::query()->where('empresa_id', $empresa->id)->whereNotNull('empleado_id')->pluck('empleado_id');

            $empleados = Empleado::withoutTenant()
                ->where('empresa_id', $empresa->id)
                ->when($this->option('empleado'), fn ($q, $ids) => $q->whereIn('id', $ids))
                ->when(! $this->option('empleado'), fn ($q) => $q->where('status', true))
                ->when(! $this->option('todos') && ! $this->option('empleado'), fn ($q) => $q->whereNotIn('id', $vinculados))
                ->orderBy('id')
                ->get();

            $this->info("Empresa #{$empresa->id} ({$empresa->razon_social}): {$empleados->count()} colaboradores".($dryRun ? ' (simulación)' : '').'.');

            $conteo = [];
            foreach ($empleados as $empleado) {
                $r = $pusher->enviar($empleado, $dryRun);
                $conteo[$r['accion']] = ($conteo[$r['accion']] ?? 0) + 1;

                $linea = "  #{$empleado->id} {$empleado->documento_identidad} {$empleado->nombres} {$empleado->apellidos}: {$r['mensaje']}";
                $r['ok'] ? $this->line($linea) : $this->warn($linea);
            }

            foreach ($conteo as $accion => $n) {
                $this->line("   {$accion}: {$n}");
            }
        }

        return $exit;
    }
}
