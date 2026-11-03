<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RelojBiometricoCedulaItem;
use App\Models\RelojEquipoBiometrico;
use App\Services\RelojCedulaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RelojCedulaController extends Controller
{
    /**
     * Obtiene el árbol completo de la Cédula (Etapas, Sub-etapas, Actividades y bloqueos) para un biométrico.
     */
    public function show(RelojEquipoBiometrico $biometrico, RelojCedulaService $cedulaService)
    {
        $cedulaTree = $cedulaService->getCedulaTree($biometrico);

        return response()->json([
            'success' => true,
            'cedula' => $cedulaTree,
        ]);
    }

    /**
     * Actualiza el estado o detalle de una actividad en la Cédula de Instalación.
     */
    public function updateItem(
        Request $request,
        RelojEquipoBiometrico $biometrico,
        RelojBiometricoCedulaItem $item,
        RelojCedulaService $cedulaService
    ) {
        $validated = $request->validate([
            'estado' => 'nullable|string|in:pendiente,en_proceso,completada,no_aplica',
            'responsable' => 'nullable|string|max:120',
            'valida' => 'nullable|string|max:120',
            'fecha_compromiso' => 'nullable|string|max:60',
            'fecha_realizada' => 'nullable|string|max:60',
            'evidencia_path' => 'nullable|string|max:255',
            'evidencia_tipo' => 'nullable|string|max:50',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $updatedItem = $cedulaService->updateItem($item, $validated, $request->user()?->id);
            $cedulaTree = $cedulaService->getCedulaTree($biometrico);

            return response()->json([
                'success' => true,
                'message' => 'Actividad de la Cédula actualizada correctamente.',
                'item' => $updatedItem,
                'cedula' => $cedulaTree,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la actividad de la Cédula: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sube un archivo de evidencia (fotografía o documento) para una actividad de la Cédula.
     */
    public function uploadEvidencia(
        Request $request,
        RelojEquipoBiometrico $biometrico,
        RelojBiometricoCedulaItem $item,
        RelojCedulaService $cedulaService
    ) {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:10240',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $tipo = in_array($ext, ['jpeg', 'jpg', 'png', 'webp'], true) ? 'foto' : 'documento';

        $fileName = sprintf(
            'cedula_%d_act_%d_%s.%s',
            $biometrico->id,
            $item->numero_actividad,
            Str::random(8),
            $ext
        );

        $path = $file->storeAs('cedulas_evidencias', $fileName, 'public');
        $url = Storage::url($path);

        $cedulaService->updateItem($item, [
            'evidencia_path' => $url,
            'evidencia_tipo' => $tipo,
        ], $request->user()?->id);

        $cedulaTree = $cedulaService->getCedulaTree($biometrico);

        return response()->json([
            'success' => true,
            'message' => 'Evidencia subida correctamente.',
            'url' => $url,
            'tipo' => $tipo,
            'cedula' => $cedulaTree,
        ]);
    }
}

