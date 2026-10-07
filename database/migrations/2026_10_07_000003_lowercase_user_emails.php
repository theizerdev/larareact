<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Pasa a minúsculas los correos de usuarios que se guardaron con mayúsculas.
 *
 * Fortify convierte el correo a minúsculas al iniciar sesión y la base distingue
 * mayúsculas, así que esas cuentas (p. ej. "Nombre.Apellido@empresa.com") no podían
 * entrar. Si pasar a minúsculas chocara con otra cuenta, se deja como está.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('users')->get(['id', 'email']) as $usuario) {
            $minusculas = mb_strtolower(trim((string) $usuario->email));

            if ($minusculas === $usuario->email) {
                continue;
            }

            $duplicado = DB::table('users')->where('id', '<>', $usuario->id)->whereRaw('lower(email) = ?', [$minusculas])->exists();

            if (! $duplicado) {
                DB::table('users')->where('id', $usuario->id)->update(['email' => $minusculas]);
            }
        }
    }

    public function down(): void
    {
        // No se puede revertir: no se conserva cómo estaban escritas las mayúsculas.
    }
};
