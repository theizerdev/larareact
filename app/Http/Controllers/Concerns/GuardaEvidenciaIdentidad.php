<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Foto y documento de identidad (frente y reverso) de una persona dada de alta
 * desde el panel: guardan, reemplazan (borrando el archivo anterior) o quitan.
 */
trait GuardaEvidenciaIdentidad
{
    protected function guardarEvidencia(Request $request, array $data, string $carpeta, ?Model $actual = null): array
    {
        unset($data['quitar_foto']);

        foreach (['foto', 'documento_frontal', 'documento_reverso'] as $campo) {
            unset($data[$campo]);

            if ($request->hasFile($campo)) {
                if ($actual?->{$campo}) {
                    Storage::disk('public')->delete($actual->{$campo});
                }

                $data[$campo] = $request->file($campo)->store($carpeta, 'public');
            }
        }

        if ($actual && $request->boolean('quitar_foto') && ! $request->hasFile('foto')) {
            if ($actual->foto) {
                Storage::disk('public')->delete($actual->foto);
            }

            $data['foto'] = null;
        }

        return $data;
    }

    protected function borrarEvidencia(Model $modelo): void
    {
        foreach ([$modelo->foto, $modelo->documento_frontal, $modelo->documento_reverso] as $ruta) {
            if ($ruta) {
                Storage::disk('public')->delete($ruta);
            }
        }
    }
}
