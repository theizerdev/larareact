<?php

namespace App\Services;

use App\Models\Empleado;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmpleadoEnrolamientoService
{
    /**
     * Valida y guarda los datos de enrolamiento de un empleado,
     * almacena sus fotografías frontales y sincroniza con BioTime.
     *
     * @param  array<string, mixed>  $datos
     * @throws ValidationException
     */
    public function guardar(Empleado $empleado, array $datos): Empleado
    {
        $validator = validator($datos, [
            'aviso_privacidad' => 'accepted',
            'foto_empleado' => 'required|string',
            'foto_empleado_2' => 'required|string',
            'genero' => 'required|in:M,F',
            'fecha_nacimiento' => 'required|date|before:-14 years|after:1900-01-01',
        ], [
            'aviso_privacidad.accepted' => 'Debe aceptar el aviso de privacidad.',
            'foto_empleado.required' => 'Falta la primera foto frontal.',
            'foto_empleado_2.required' => 'Falta la segunda foto frontal.',
            'genero.required' => 'Seleccione el sexo.',
            'fecha_nacimiento.required' => 'Capture la fecha de nacimiento.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento no es válida.',
            'fecha_nacimiento.after' => 'La fecha de nacimiento no es válida.',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $validated = $validator->validated();

        $fotos = [];
        foreach (['foto_empleado', 'foto_empleado_2'] as $campo) {
            $fotos[$campo] = $this->leerFoto($campo, $validated[$campo]);
        }

        $anteriores = array_filter([$empleado->foto_empleado, $empleado->foto_empleado_2]);
        $estadoPrevio = [
            'foto_empleado' => $empleado->foto_empleado,
            'foto_empleado_2' => $empleado->foto_empleado_2,
            'genero' => $empleado->genero,
            'fecha_nacimiento' => $empleado->fecha_nacimiento,
            'enrolado_en' => $empleado->enrolado_en,
        ];

        foreach ($fotos as $campo => $foto) {
            $ruta = 'empleados/' . Str::random(40) . '.' . $foto['ext'];
            Storage::disk('public')->put($ruta, $foto['binario']);
            $fotos[$campo] = '/storage/' . $ruta;
        }

        $empleado->update($fotos + [
            'genero' => $validated['genero'],
            'fecha_nacimiento' => $validated['fecha_nacimiento'],
            'enrolado_en' => now(),
        ]);

        // Propagar inmediatamente a BioTime (empleado + foto frontal de enrolamiento)
        try {
            $pusher = app(BioTimeEmpleadoPusher::class);
            $res = $pusher->enviar($empleado->fresh());
            Log::info('Resultado de sincronización BioTime en enrolamiento', [
                'empleado_id' => $empleado->id,
                'resultado' => $res,
            ]);

            if (isset($res['ok']) && ! $res['ok'] && ($res['accion'] ?? '') !== 'omitido') {
                $this->revertirEnrolamiento($empleado, $estadoPrevio, $fotos);
                $mensajeFormateado = self::formatearMensajeBioTime($res['mensaje'] ?? 'BioTime rechazó la sincronización.');
                throw ValidationException::withMessages([
                    'biotime' => $mensajeFormateado,
                ]);
            }
        } catch (ValidationException $ve) {
            throw $ve;
        } catch (Throwable $e) {
            Log::warning('No se pudo enviar empleado a BioTime en enrolamiento: ' . $e->getMessage(), [
                'empleado_id' => $empleado->id,
            ]);
            $this->revertirEnrolamiento($empleado, $estadoPrevio, $fotos);
            throw ValidationException::withMessages([
                'biotime' => 'Error de conexión con BioTime: ' . $e->getMessage(),
            ]);
        }

        // Si BioTime aceptó el enrolamiento (o se omitió por estar inactivo), eliminar fotos anteriores
        foreach ($anteriores as $ruta) {
            if (str_starts_with($ruta, '/storage/')) {
                Storage::disk('public')->delete(Str::after($ruta, '/storage/'));
            }
        }

        return $empleado->fresh();
    }

    /**
     * Revierte los cambios locales del empleado y limpia fotos subidas ante fallo de BioTime.
     */
    private function revertirEnrolamiento(Empleado $empleado, array $estadoPrevio, array $fotosNuevas): void
    {
        $empleado->update($estadoPrevio);

        foreach ($fotosNuevas as $ruta) {
            if (is_string($ruta) && str_starts_with($ruta, '/storage/')) {
                Storage::disk('public')->delete(Str::after($ruta, '/storage/'));
            }
        }
    }

    /**
     * Limpia y extrae el mensaje de error legible devuelto por la API de BioTime.
     */
    public static function formatearMensajeBioTime(string $mensaje): string
    {
        // Si el mensaje contiene un payload JSON incrustado (ej. "BioTime rechazó el cambio (HTTP 406): {\"message\":\"...\"}")
        if (preg_match('/^(.*?HTTP\s+\d+\)?:\s*)(\{.*\})$/s', $mensaje, $matches)) {
            $prefijo = trim($matches[1]);
            $json = json_decode($matches[2], true);
            if (is_array($json)) {
                $detalle = $json['message'] ?? $json['detail'] ?? $json['error'] ?? null;
                if (! $detalle && ! empty($json)) {
                    $primerValor = reset($json);
                    $detalle = is_array($primerValor) ? reset($primerValor) : (string) $primerValor;
                }
                if ($detalle) {
                    return rtrim($prefijo, ':') . ': ' . trim((string) $detalle);
                }
            }
        }

        // Intento directo de decodificar si el mensaje entero es JSON
        $jsonDirecto = json_decode($mensaje, true);
        if (is_array($jsonDirecto)) {
            $detalle = $jsonDirecto['message'] ?? $jsonDirecto['detail'] ?? $jsonDirecto['error'] ?? null;
            if ($detalle) {
                return 'BioTime: ' . trim((string) $detalle);
            }
        }

        return $mensaje;
    }

    /**
     * Foto de la cámara o del archivo elegido, como data URI.
     *
     * @return array{binario: string, ext: string}
     */
    public function leerFoto(string $campo, string $valor): array
    {
        if (preg_match('#^data:image/(jpe?g|png|webp);base64,#i', $valor, $m)) {
            $binario = base64_decode(substr($valor, strpos($valor, ',') + 1), true);

            if ($binario !== false && @imagecreatefromstring($binario) !== false) {
                $ext = strtolower($m[1]);

                return ['binario' => $binario, 'ext' => $ext === 'jpeg' ? 'jpg' : $ext];
            }
        }

        throw ValidationException::withMessages([$campo => 'La foto no es una imagen válida; tómela de nuevo.']);
    }
}
