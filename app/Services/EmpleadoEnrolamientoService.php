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

        foreach ($anteriores as $ruta) {
            if (str_starts_with($ruta, '/storage/')) {
                Storage::disk('public')->delete(Str::after($ruta, '/storage/'));
            }
        }

        // Propagar inmediatamente a BioTime (empleado + foto frontal de enrolamiento)
        try {
            $pusher = app(BioTimeEmpleadoPusher::class);
            $res = $pusher->enviar($empleado->fresh());
            Log::info('Resultado de sincronización BioTime en enrolamiento', [
                'empleado_id' => $empleado->id,
                'resultado' => $res,
            ]);
        } catch (Throwable $e) {
            Log::warning('No se pudo enviar empleado a BioTime en enrolamiento: ' . $e->getMessage(), [
                'empleado_id' => $empleado->id,
            ]);
        }

        return $empleado->fresh();
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
