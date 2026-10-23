<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\RelojEquipoBiometrico;
use App\Models\RelojUbicacion;
use App\Models\Sucursal;
use App\Services\EquiposUbicacionesImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RelojUbicacionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $legacy = $request->input('legacy');
        $estado = $request->input('estado');
        $status = $request->input('status');
        $perPage = (int) $request->input('perPage', 15);

        $query = RelojUbicacion::with([
            'empresa:id,razon_social',
            'sucursal:id,nombre,zona_horaria',
        ])->withCount('equiposBiometricos');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('planta', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%")
                    ->orWhere('ciudad', 'like', "%{$search}%")
                    ->orWhere('estado', 'like', "%{$search}%")
                    ->orWhere('legacy', 'like', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('numero_localidad', (int) $search);
                }
            });
        }

        if ($legacy !== null && $legacy !== '' && $legacy !== 'all') {
            if ($legacy === 'sin_legacy') {
                $query->whereNull('legacy');
            } else {
                $query->where('legacy', $legacy);
            }
        }

        if ($estado !== null && $estado !== '' && $estado !== 'all') {
            $query->where('estado', $estado);
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('activo', (bool) $status);
        }

        $ubicaciones = $query
            ->orderByRaw('CASE WHEN numero_localidad IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('numero_localidad', 'asc')
            ->orderBy('planta', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $porLegacy = RelojUbicacion::select('legacy', DB::raw('count(*) as total'))
            ->groupBy('legacy')
            ->pluck('total', 'legacy')
            ->toArray();

        $stats = [
            'total' => RelojUbicacion::count(),
            'activos' => RelojUbicacion::where('activo', true)->count(),
            'inactivos' => RelojUbicacion::where('activo', false)->count(),
            'estados_count' => RelojUbicacion::whereNotNull('estado')->distinct('estado')->count('estado'),
            'total_equipos' => RelojEquipoBiometrico::count(),
            'por_legacy' => $porLegacy,
        ];

        $estadosDisponibles = RelojUbicacion::whereNotNull('estado')
            ->where('estado', '!=', '')
            ->distinct()
            ->orderBy('estado')
            ->pluck('estado')
            ->values();

        $legaciesDisponibles = RelojUbicacion::whereNotNull('legacy')
            ->where('legacy', '!=', '')
            ->distinct()
            ->orderBy('legacy')
            ->pluck('legacy')
            ->values();

        return Inertia::render('admin/Asistencia/Ubicaciones/Index', [
            'ubicaciones' => $ubicaciones,
            'stats' => $stats,
            'estadosDisponibles' => $estadosDisponibles,
            'legaciesDisponibles' => $legaciesDisponibles,
            'sucursales' => Sucursal::where('status', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'zona_horaria', 'empresa_id']),
            'empresas' => Empresa::where('status', true)
                ->orderBy('razon_social')
                ->get(['id', 'razon_social']),
            'filters' => $request->only(['search', 'legacy', 'estado', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'numero_localidad' => 'nullable|integer|min:1|max:99999',
            'planta' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:1000',
            'estado' => 'nullable|string|max:120',
            'ciudad' => 'nullable|string|max:120',
            'legacy' => 'nullable|string|max:60',
            'activo' => 'boolean',
        ]);

        if (empty($validated['empresa_id'])) {
            $validated['empresa_id'] = $request->user()?->empresa_id ?? Empresa::withoutGlobalScopes()->value('id');
        }

        try {
            RelojUbicacion::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Ubicación de planta registrada exitosamente.',
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear ubicación de reloj checador: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Ocurrió un error al registrar la ubicación.',
            ]);
        }
    }

    public function update(Request $request, RelojUbicacion $ubicacion)
    {
        $validated = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'numero_localidad' => 'nullable|integer|min:1|max:99999',
            'planta' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:1000',
            'estado' => 'nullable|string|max:120',
            'ciudad' => 'nullable|string|max:120',
            'legacy' => 'nullable|string|max:60',
            'activo' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($ubicacion, $validated) {
                $ubicacion->update($validated);
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Ubicación de planta actualizada exitosamente.',
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar ubicación {$ubicacion->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Ocurrió un error al actualizar la ubicación.',
            ]);
        }
    }

    public function toggleStatus(RelojUbicacion $ubicacion)
    {
        $ubicacion->update(['activo' => ! $ubicacion->activo]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Estado de la ubicación actualizado.',
        ]);
    }

    public function destroy(RelojUbicacion $ubicacion)
    {
        try {
            $ubicacion->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Ubicación eliminada correctamente.',
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar ubicación {$ubicacion->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'No se pudo eliminar la ubicación.',
            ]);
        }
    }

    /**
     * Analiza el archivo Excel subido y devuelve el resumen separado de Ubicaciones (2) y Biométricos setup.
     */
    public function previewImport(Request $request, EquiposUbicacionesImportService $importService)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:20480',
            'scope' => 'nullable|in:ambos,ubicaciones,biometricos',
        ]);

        $scope = $request->input('scope', 'ambos');
        $file = $request->file('file');
        $empresaId = $request->user()?->empresa_id;

        $result = $importService->parsePreview($file->getRealPath(), $scope, $empresaId);

        return response()->json($result);
    }

    /**
     * Ejecuta la importación masiva separando los datos en Ubicaciones y Biométricos Setup.
     */
    public function import(Request $request, EquiposUbicacionesImportService $importService)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:20480',
            'scope' => 'nullable|in:ambos,ubicaciones,biometricos',
        ]);

        $scope = $request->input('scope', 'ambos');
        $file = $request->file('file');
        $empresaId = $request->user()?->empresa_id;

        $response = $importService->importFromFile($file->getRealPath(), $scope, $empresaId);

        if (! ($response['success'] ?? false)) {
            return response()->json($response, 422);
        }

        $res = $response['result'];
        $msg = sprintf(
            'Importación completada: Ubicaciones (%d nuevas, %d actualizadas) | Biométricos Setup (%d nuevos, %d actualizados).',
            $res['ubicaciones_creadas'],
            $res['ubicaciones_actualizadas'],
            $res['biometricos_creados'],
            $res['biometricos_actualizados']
        );

        return response()->json([
            'success' => true,
            'message' => $msg,
            'result' => $res,
        ]);
    }
}

