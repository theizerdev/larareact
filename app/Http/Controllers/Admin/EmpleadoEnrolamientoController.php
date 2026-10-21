<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Enrolamiento del colaborador desde Colaboradores: bienvenida con aviso de
 * privacidad, sus datos (no. de empleado, nombre, área) y la captura de las
 * dos fotos frontales, el sexo y la fecha de nacimiento.
 *
 * Al guardar, el observer de Empleado manda sexo y fecha de nacimiento a
 * BioTime; las fotos salen en el ZIP de bio-photos (BioTimeFotoService).
 */
class EmpleadoEnrolamientoController extends Controller
{
    public function show(Empleado $empleado)
    {
        $empleado->load('departamento:id,nombre', 'empresa:id,razon_social');

        return Inertia::render('admin/Empleados/Enrolamiento', [
            'empleado' => [
                'id' => $empleado->id,
                'numero' => $empleado->documento_identidad,
                'nombres' => $empleado->nombres,
                'apellidos' => $empleado->apellidos,
                'area' => $empleado->departamento?->nombre,
                'genero' => $empleado->genero,
                'fecha_nacimiento' => $empleado->fecha_nacimiento?->format('Y-m-d'),
                'enrolado_en' => $empleado->enrolado_en?->toIso8601String(),
            ],
            'empresa' => $empleado->empresa?->razon_social,
        ]);
    }

    public function store(Request $request, Empleado $empleado)
    {
        $data = $request->validate([
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

        // Se decodifican las dos antes de escribir: si una falla no queda la otra huérfana en disco.
        $fotos = [];
        foreach (['foto_empleado', 'foto_empleado_2'] as $campo) {
            $fotos[$campo] = $this->leerFoto($campo, $data[$campo]);
        }

        $anteriores = array_filter([$empleado->foto_empleado, $empleado->foto_empleado_2]);

        foreach ($fotos as $campo => $foto) {
            $ruta = 'empleados/'.Str::random(40).'.'.$foto['ext'];
            Storage::disk('public')->put($ruta, $foto['binario']);
            $fotos[$campo] = '/storage/'.$ruta;
        }

        $empleado->update($fotos + [
            'genero' => $data['genero'],
            'fecha_nacimiento' => $data['fecha_nacimiento'],
            'enrolado_en' => now(),
        ]);

        foreach ($anteriores as $ruta) {
            if (str_starts_with($ruta, '/storage/')) {
                Storage::disk('public')->delete(Str::after($ruta, '/storage/'));
            }
        }

        return back();
    }

    /**
     * Foto de la cámara o del archivo elegido, como data URI.
     *
     * @return array{binario: string, ext: string}
     */
    private function leerFoto(string $campo, string $valor): array
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
