<?php

namespace App\Console\Commands;

use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Cargo;
use App\Models\ContpaqiEmpleadoMapeo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

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
        $conContpaqi = (bool) $this->option('contpaqi');

        $pendientes = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->whereNull('empleado_id')
            ->orderByRaw('CAST(emp_code AS UNSIGNED)')
            ->get();

        $departamentos = DB::table('biotime_departamentos')->where('empresa_id', $empresa->id)->pluck('dept_name', 'dept_code');
        $cargos = DB::table('biotime_cargos')->where('empresa_id', $empresa->id)->pluck('position_name', 'position_code');

        $creados = 0;
        $omitidos = [];

        foreach ($pendientes as $bio) {
            $codigo = trim((string) $bio->emp_code);

            if (Empleado::withoutTenant()->where('documento_identidad', $codigo)->exists()) {
                $omitidos[] = "{$codigo} {$bio->nombre_completo}: ya hay un empleado con documento {$codigo}; vincúlalo a mano.";

                continue;
            }

            if ($conContpaqi && ContpaqiEmpleadoMapeo::query()->paraEmpresa($empresa->id)->where('codigo_empleado', $codigo)->exists()) {
                $omitidos[] = "{$codigo} {$bio->nombre_completo}: el código {$codigo} ya está mapeado en CONTPAQi a otro empleado.";

                continue;
            }

            $this->line(sprintf('  + %-5s %s', $codigo, $bio->nombre_completo));

            if ($dryRun) {
                $creados++;

                continue;
            }

            DB::transaction(function () use ($bio, $codigo, $empresa, $sucursal, $usuario, $departamentos, $cargos, $conContpaqi) {
                $departamento = $this->departamento($departamentos[$bio->dept_code] ?? null, $empresa, $sucursal, $usuario);

                $empleado = Empleado::create([
                    'nombres' => $bio->first_name ?: 'N/A',
                    'apellidos' => $bio->last_name ?: 'N/A',
                    'documento_identidad' => $codigo,
                    'tarjeta_acceso_1' => $bio->card_no,
                    'telefono' => $bio->mobile,
                    'correo' => $bio->email,
                    'departamento_id' => $departamento?->id,
                    'cargo_id' => $this->cargo($cargos[$bio->position_code] ?? null, $departamento, $empresa, $sucursal, $usuario)?->id,
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => $sucursal->id,
                    'status' => true,
                ]);

                $bio->update(['empleado_id' => $empleado->id, 'link_status' => 'auto']);

                BiotimeMarcaje::query()
                    ->where('biotime_empleado_id', $bio->id)
                    ->update(['empleado_id' => $empleado->id]);

                if ($conContpaqi) {
                    ContpaqiEmpleadoMapeo::create([
                        'empresa_id' => $empresa->id,
                        'empleado_id' => $empleado->id,
                        'codigo_empleado' => $codigo,
                        'nombre_contpaqi' => mb_strtoupper(trim("{$bio->last_name} {$bio->first_name}")),
                        'activo' => true,
                        'notas' => 'Creado desde BioTime (emp_code del reloj).',
                    ]);
                }
            });

            $creados++;
        }

        $this->info(sprintf(
            'Empresa #%d (%s): %d empleados %s, %d omitidos.',
            $empresa->id,
            $empresa->razon_social,
            $creados,
            $dryRun ? 'por crear' : 'creados y vinculados',
            count($omitidos),
        ));

        foreach ($omitidos as $motivo) {
            $this->warn('   '.$motivo);
        }

        return $omitidos === [];
    }

    private function departamento(?string $nombre, Empresa $empresa, Sucursal $sucursal, User $usuario): ?Departamento
    {
        if (blank($nombre)) {
            return null;
        }

        return Departamento::withoutTenant()->firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => trim($nombre)],
            ['sucursal_id' => $sucursal->id, 'user_id' => $usuario->id, 'status' => true],
        );
    }

    private function cargo(?string $nombre, ?Departamento $departamento, Empresa $empresa, Sucursal $sucursal, User $usuario): ?Cargo
    {
        if (blank($nombre)) {
            return null;
        }

        return Cargo::withoutTenant()->firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => trim($nombre)],
            ['departamento_id' => $departamento?->id, 'sucursal_id' => $sucursal->id, 'user_id' => $usuario->id, 'status' => true],
        );
    }
}
