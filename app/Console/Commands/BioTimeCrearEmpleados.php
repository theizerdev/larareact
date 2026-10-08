<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\BioTimeEmpleadoProvisioner;
use Illuminate\Console\Command;

/**
 * Da de alta en Shigoto a los empleados del reloj que no tienen vínculo.
 *
 * Para empresas cuyo padrón vive en BioTime: sin un empleado de Shigoto
 * vinculado, las checadas se quedan en el espejo y no llegan a la nómina.
 *
 * El emp_code del reloj se guarda como documento_identidad (así el
 * auto-vínculo lo vuelve a encontrar) y, con --contpaqi, como "Código
 * empleado" de CONTPAQi. Sólo usar --contpaqi cuando el reloj y CONTPAQi
 * numeran igual: un código equivocado le carga las horas a otra persona.
 *
 * No asigna turno a propósito: con un turno supuesto el cálculo LFT
 * inventaría retardos. Se asigna después, por empleado.
 */
class BioTimeCrearEmpleados extends Command
{
    protected $signature = 'biotime:crear-empleados
        {--empresa= : ID de la empresa (por defecto: todas con biotime_active)}
        {--sucursal= : Sucursal donde se dan de alta (por defecto: la primera de la empresa)}
        {--usuario= : Autor de los departamentos y cargos que se creen (por defecto: el primer usuario de la empresa)}
        {--contpaqi : Crea también el mapeo a CONTPAQi usando el emp_code como código de empleado}
        {--dry-run : Muestra lo que haría sin escribir}';

    protected $description = 'Crea en Shigoto los empleados de BioTime sin vincular, los vincula y opcionalmente los mapea a CONTPAQi';

    public function handle(): int
    {
        $empresas = Empresa::query()
            ->when($this->option('empresa'), fn ($q, $id) => $q->whereKey($id))
            ->when(! $this->option('empresa'), fn ($q) => $q->where('biotime_active', true))
            ->get();

        $exit = self::SUCCESS;

        foreach ($empresas as $empresa) {
            $sucursal = Sucursal::withoutTenant()
                ->where('empresa_id', $empresa->id)
                ->when($this->option('sucursal'), fn ($q, $id) => $q->whereKey($id))
                ->orderBy('id')
                ->first();

            if ($sucursal === null) {
                $this->error("Empresa #{$empresa->id}: no tiene sucursal donde dar de alta a los empleados.");
                $exit = self::FAILURE;

                continue;
            }

            $usuario = User::query()
                ->when($this->option('usuario'), fn ($q, $id) => $q->whereKey($id), fn ($q) => $q->where('empresa_id', $empresa->id))
                ->orderBy('id')
                ->first();

            if ($usuario === null) {
                $this->error("Empresa #{$empresa->id}: no hay usuario que firme los catálogos nuevos; usa --usuario.");
                $exit = self::FAILURE;

                continue;
            }

            $this->procesarEmpresa($empresa, $sucursal, $usuario) || $exit = self::FAILURE;
        }

        return $exit;
    }

    private function procesarEmpresa(Empresa $empresa, Sucursal $sucursal, User $usuario): bool
    {
        $dryRun = (bool) $this->option('dry-run');

        $r = app(BioTimeEmpleadoProvisioner::class)->sincronizar(
            $empresa,
            dryRun: $dryRun,
            conContpaqi: (bool) $this->option('contpaqi'),
            sucursal: $sucursal,
            usuario: $usuario,
        );

        foreach ($r['nuevos'] as $linea) {
            $this->line('  + '.$linea);
        }

        $this->info(sprintf(
            'Empresa #%d (%s): %d empleados %s, %d omitidos.',
            $empresa->id,
            $empresa->razon_social,
            $r['creados'],
            $dryRun ? 'por crear' : 'creados y vinculados',
            count($r['omitidos']),
        ));

        foreach ($r['omitidos'] as $motivo) {
            $this->warn('   '.$motivo);
        }

        return $r['omitidos'] === [];
    }
}
