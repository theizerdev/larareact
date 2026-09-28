<?php

namespace App\Console\Commands;

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Crea y vincula una cuenta de usuario a cada empleado que no tenga una.
 *
 * El acceso por número de empleado (POST /api/login-empleado) emite un token
 * de Sanctum, y un token necesita un `User` al cual pertenecer. Un empleado con
 * `user_id` en NULL responde 403 "Tu número no está vinculado a una cuenta de
 * acceso" aunque el número sea correcto; este comando es lo que cierra esa
 * brecha.
 *
 * POR DEFECTO NO ESCRIBE NADA. Sin --aplicar sólo enseña qué haría, que es como
 * conviene correrlo la primera vez: crea cuentas en masa sobre datos de
 * producción y los correos generados quedan como identificador permanente.
 *
 * Las cuentas se crean SIN rol, que es justo lo que las vuelve "trabajador":
 * el login por número rechaza cuentas administrativas a propósito, y asignar
 * aquí cualquier rol dejaría entrar al panel con sólo el número del gafete.
 */
class VincularUsuariosEmpleados extends Command
{
    protected $signature = 'empleados:vincular-usuarios
        {--empresa= : Limita a una empresa por ID}
        {--dominio=shigoto.local : Dominio para los correos generados cuando el empleado no tiene uno}
        {--incluir-inactivos : Procesa también empleados con status=false}
        {--aplicar : Guarda los cambios. Sin esta bandera todo queda en pantalla}';

    protected $description = 'Crea y vincula una cuenta de acceso a los empleados sin user_id, para que puedan entrar con su número';

    public function handle(): int
    {
        $aplicar = (bool) $this->option('aplicar');
        $dominio = trim((string) $this->option('dominio'));

        $empleados = Empleado::withoutTenant()
            ->whereNull('user_id')
            ->when($this->option('empresa'), fn ($q, $id) => $q->where('empresa_id', $id))
            ->when(! $this->option('incluir-inactivos'), fn ($q) => $q->where('status', true))
            ->orderBy('id')
            ->get();

        if ($empleados->isEmpty()) {
            $this->info('No hay empleados sin cuenta vinculada. Nada que hacer.');

            return self::SUCCESS;
        }

        $this->info("Empleados sin cuenta: {$empleados->count()}");
        $this->newLine();

        // Se resuelven todos los correos antes de escribir nada, para detectar
        // choques entre empleados del mismo lote y no a mitad del recorrido.
        $correosTomados = User::withoutTenant()->pluck('email')
            ->map(fn ($e) => mb_strtolower($e))->flip();

        $plan = [];

        foreach ($empleados as $empleado) {
            $existente = $this->usuarioExistentePara($empleado);

            if ($existente) {
                $plan[] = [$empleado, 'vincular', $existente->email, $existente];

                continue;
            }

            $correo = $this->correoPara($empleado, $dominio, $correosTomados);
            $correosTomados->put($correo, true);
            $plan[] = [$empleado, 'crear', $correo, null];
        }

        $this->table(
            ['Empleado', 'Nombre', 'Número', 'Acción', 'Correo'],
            collect($plan)->map(fn ($fila) => [
                $fila[0]->id,
                mb_substr($fila[0]->nombres.' '.$fila[0]->apellidos, 0, 30),
                $fila[0]->codigo_acceso ?: ($fila[0]->documento_identidad ?: '—'),
                $fila[1] === 'crear' ? 'crear cuenta' : 'vincular existente',
                $fila[2],
            ])->all(),
        );

        if (! $aplicar) {
            $this->newLine();
            $this->warn('Simulación: no se escribió nada. Repite con --aplicar para guardar.');

            return self::SUCCESS;
        }

        $creadas = 0;
        $vinculadas = 0;

        DB::transaction(function () use ($plan, &$creadas, &$vinculadas) {
            foreach ($plan as [$empleado, $accion, $correo, $existente]) {
                $user = $existente;

                if ($accion === 'crear') {
                    $user = new User;
                    $user->name = trim($empleado->nombres.' '.$empleado->apellidos);
                    $user->email = $correo;
                    // Contraseña aleatoria: estas cuentas entran por número, no
                    // por contraseña. Dejarla vacía o predecible abriría el
                    // login normal con /api/login y el panel web.
                    $user->password = Hash::make(Str::password(32));
                    $user->status = 'activo';
                    $user->empresa_id = $empleado->empresa_id;
                    $user->sucursal_id = $empleado->sucursal_id;
                    $user->email_verified_at = now();
                    $user->save();

                    $creadas++;
                } else {
                    $vinculadas++;
                }

                $empleado->user_id = $user->id;
                $empleado->save();
            }
        });

        $this->newLine();
        $this->info("Listo. Cuentas creadas: {$creadas}. Vinculadas a usuarios existentes: {$vinculadas}.");

        return self::SUCCESS;
    }

    /**
     * Busca un usuario que ya represente a este empleado, para no duplicar
     * cuentas cuando la persona ya entra al sistema por correo.
     */
    private function usuarioExistentePara(Empleado $empleado): ?User
    {
        if (blank($empleado->correo)) {
            return null;
        }

        $user = User::withoutTenant()->where('email', $empleado->correo)->first();

        // Un usuario ya tomado por otro empleado no se puede reutilizar: la app
        // resuelve el empleado desde user_id y quedarían dos apuntando al mismo.
        if ($user && Empleado::withoutTenant()->where('user_id', $user->id)->exists()) {
            return null;
        }

        return $user;
    }

    /**
     * Correo para la cuenta nueva. Se prefiere el del empleado; si no tiene o
     * ya está ocupado, se genera uno estable a partir de su número.
     */
    private function correoPara(Empleado $empleado, string $dominio, Collection $tomados): string
    {
        $propio = mb_strtolower(trim((string) $empleado->correo));

        if (filter_var($propio, FILTER_VALIDATE_EMAIL) && ! $tomados->has($propio)) {
            return $propio;
        }

        $numero = $empleado->codigo_acceso ?: $empleado->documento_identidad ?: $empleado->id;
        $base = 'emp'.Str::slug((string) $numero, '');
        $correo = "{$base}@{$dominio}";

        // Los números son únicos, pero un correo generado podría chocar con uno
        // ya existente en users; se desempata con el id del empleado.
        if ($tomados->has($correo)) {
            $correo = "{$base}.{$empleado->id}@{$dominio}";
        }

        return $correo;
    }
}
