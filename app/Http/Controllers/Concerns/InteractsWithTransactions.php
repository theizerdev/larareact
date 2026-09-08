<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\DeadlockException;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use PDOException;
use Throwable;

/**
 * Ejecución atómica de escrituras con respuesta honesta al cliente.
 *
 * Problema que resuelve: varios controladores hacían
 *
 *     try { ...escritura... }
 *     catch (\Exception $e) { return back()->with('notification', [...'error'...]); }
 *
 * `back()` es un 302 y Inertia lo interpreta como petición correcta, así que en
 * el frontend se disparaba `onSuccess`: toast verde, modal cerrado y formulario
 * reseteado, aunque la transacción hubiera fallado. El usuario perdía lo que
 * había capturado y creía que se había guardado.
 *
 * Aquí una respuesta de éxito sólo se emite si el `COMMIT` se completó:
 *
 *  - Éxito                       -> 302 con notificación de éxito (`onSuccess`).
 *  - Fallo esperado y accionable -> 422 con errores (`onError`, datos intactos).
 *  - Fallo inesperado            -> se relanza: 500 y jamás `onSuccess`.
 */
trait InteractsWithTransactions
{
    /**
     * Envuelve `$work` en una transacción y sólo responde éxito si confirmó.
     *
     * @param  callable():mixed  $work  Escrituras a ejecutar de forma atómica.
     * @param  string  $successMessage  Mensaje para el usuario si confirma.
     * @param  string  $failureMessage  Mensaje seguro si falla (sin detalles internos).
     * @param  string  $errorKey  Campo al que se asocia el error en el 422.
     * @param  array<string,mixed>  $context  Datos extra para el log (nunca al cliente).
     *
     * @throws ValidationException Fallo esperado (integridad, bloqueo, duplicado).
     * @throws Throwable Fallo inesperado: se propaga y devuelve 500.
     */
    protected function transactional(
        callable $work,
        string $successMessage,
        string $failureMessage,
        string $errorKey = 'general',
        array $context = [],
    ): RedirectResponse {
        try {
            // `attempts: 3` reintenta ante deadlock/lock, habitual en SQLite
            // bajo concurrencia. Laravel sólo reintenta si el driver marca el
            // error como recuperable; el resto sale a la primera.
            DB::transaction(static function () use ($work) {
                $work();
            }, 3);
        } catch (Throwable $e) {
            // La transacción ya hizo ROLLBACK: no hay escrituras a medias.
            Log::error('Transacción CRUD fallida: '.$e->getMessage(), array_merge($context, [
                'exception' => $e::class,
                'route' => request()->route()?->getName(),
                'user_id' => auth()->id(),
            ]));

            if ($this->isExpectedWriteFailure($e)) {
                // 422: Inertia dispara `onError`, el modal sigue abierto y el
                // usuario no pierde lo capturado.
                throw ValidationException::withMessages([$errorKey => $failureMessage]);
            }

            // Inesperado: que suba y devuelva 500. Nunca un falso positivo.
            throw $e;
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => $successMessage,
        ]);
    }

    /**
     * ¿Es un fallo de escritura previsible que el usuario puede resolver
     * (reintentar, corregir un duplicado, quitar dependencias)?
     *
     * Sólo estos se convierten en 422; cualquier otro debe salir como 500 para
     * que no se oculte un fallo real de infraestructura.
     */
    protected function isExpectedWriteFailure(Throwable $e): bool
    {
        // Duplicado: Laravel ya lo tipa, no hace falta mirar el mensaje.
        if ($e instanceof UniqueConstraintViolationException) {
            return true;
        }

        // Ojo: `DeadlockException` extiende `PDOException`, NO `QueryException`.
        // Comprobar sólo `QueryException` dejaba escapar como 500 justo el error
        // de concurrencia ("database is locked") que más se da en SQLite.
        if ($e instanceof DeadlockException) {
            return true;
        }

        if (! $e instanceof QueryException && ! $e instanceof PDOException) {
            return false;
        }

        $message = mb_strtolower($e->getMessage());

        $expected = [
            'foreign key constraint',   // dependencias que impiden el borrado
            'unique constraint',        // duplicado (SQLite / PostgreSQL)
            'duplicate entry',          // duplicado (MySQL)
            'integrity constraint',
            'database is locked',       // SQLITE_BUSY bajo concurrencia
            'deadlock found',
            'lock wait timeout',
            'not null constraint',
        ];

        foreach ($expected as $needle) {
            if (str_contains($message, $needle)) {
                return true;
            }
        }

        return false;
    }
}
