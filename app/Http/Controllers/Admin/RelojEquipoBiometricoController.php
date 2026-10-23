<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\RelojEquipoBiometrico;
use App\Models\RelojUbicacion;
use App\Services\EquiposUbicacionesImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RelojEquipoBiometricoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $legacy = $request->input('legacy');
        $ubicacionId = $request->input('reloj_ubicacion_id');
        $numLocalidad = $request->input('numero_localidad');
        $actualInstalado = $request->input('actual_instalado');
        $nuevoInstalado = $request->input('nuevo_instalado');
        $status = $request->input('status');
        $perPage = (int) $request->input('perPage', 15);

        $query = RelojEquipoBiometrico::with([
            'ubicacion:id,numero_localidad,planta,direccion,estado,ciudad,legacy',
            'empresa:id,razon_social',
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('localidad_nombre', 'like', "%{$search}%")
                    ->orWhere('ubicacion_fisica', 'like', "%{$search}%")
                    ->orWhere('actual_no_serie', 'like', "%{$search}%")
                    ->orWhere('actual_ip', 'like', "%{$search}%")
                    ->orWhere('actual_gateway', 'like', "%{$search}%")
                    ->orWhere('actual_comentario', 'like', "%{$search}%")
                    ->orWhere('nuevo_marca', 'like', "%{$search}%")
                    ->orWhere('nuevo_modelo', 'like', "%{$search}%")
                    ->orWhere('nuevo_no_serie', 'like', "%{$search}%")
                    ->orWhere('nuevo_ip', 'like', "%{$search}%")
                    ->orWhere('nuevo_mac_address', 'like', "%{$search}%")
                    ->orWhere('nuevo_comentario', 'like', "%{$search}%");

                if (is_numeric($search)) {
                    $q->orWhere('numero_localidad', (int) $search);
                }
            });
        }

        if ($legacy !== null && $legacy !== '' && $legacy !== 'all') {
            $query->where('legacy', $legacy);
        }

        if ($ubicacionId !== null && $ubicacionId !== '' && $ubicacionId !== 'all') {
            $query->where('reloj_ubicacion_id', (int) $ubicacionId);
        }

        if ($numLocalidad !== null && $numLocalidad !== '' && $numLocalidad !== 'all') {
            $query->where('numero_localidad', (int) $numLocalidad);
        }

        if ($actualInstalado !== null && $actualInstalado !== '' && $actualInstalado !== 'all') {
            $query->where('actual_instalado', $actualInstalado === '1' || $actualInstalado === 'true');
        }

        if ($nuevoInstalado !== null && $nuevoInstalado !== '' && $nuevoInstalado !== 'all') {
            $query->where('nuevo_instalado', $nuevoInstalado === '1' || $nuevoInstalado === 'true');
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('activo', $status === '1' || $status === 'true');
        }

        $biometricos = $query
            ->orderByRaw('CASE WHEN numero_localidad IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('numero_localidad', 'asc')
            ->orderBy('localidad_nombre', 'asc')
            ->orderBy('ubicacion_fisica', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        $porLegacy = RelojEquipoBiometrico::select('legacy', DB::raw('count(*) as total'))
            ->groupBy('legacy')
            ->pluck('total', 'legacy')
            ->toArray();

        $stats = [
            'total' => RelojEquipoBiometrico::count(),
            'actual_instalados' => RelojEquipoBiometrico::where('actual_instalado', true)->count(),
            'actual_no_instalados' => RelojEquipoBiometrico::where('actual_instalado', false)->count(),
            'nuevo_instalados' => RelojEquipoBiometrico::where('nuevo_instalado', true)->count(),
            'pendientes_ubicacion' => RelojEquipoBiometrico::where(function ($q) {
                $q->whereNull('ubicacion_fisica')
                    ->orWhere('ubicacion_fisica', '???')
                    ->orWhere('ubicacion_fisica', '');
            })->count(),
            'por_legacy' => $porLegacy,
        ];

        $ubicacionesCatalogo = RelojUbicacion::orderByRaw('CASE WHEN numero_localidad IS NULL THEN 1 ELSE 0 END ASC')
            ->orderBy('numero_localidad', 'asc')
            ->orderBy('planta', 'asc')
            ->get(['id', 'numero_localidad', 'planta', 'estado', 'ciudad', 'legacy', 'direccion']);

        $legaciesDisponibles = RelojEquipoBiometrico::whereNotNull('legacy')
            ->where('legacy', '!=', '')
            ->distinct()
            ->orderBy('legacy')
            ->pluck('legacy')
            ->values();

        return Inertia::render('admin/Asistencia/BiometricosSetup/Index', [
            'biometricos' => $biometricos,
            'stats' => $stats,
            'ubicacionesCatalogo' => $ubicacionesCatalogo,
            'legaciesDisponibles' => $legaciesDisponibles,
            'empresas' => Empresa::where('status', true)
                ->orderBy('razon_social')
                ->get(['id', 'razon_social']),
            'filters' => $request->only([
                'search',
                'legacy',
                'reloj_ubicacion_id',
                'numero_localidad',
                'actual_instalado',
                'nuevo_instalado',
                'status',
                'perPage',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'reloj_ubicacion_id' => 'nullable|exists:reloj_ubicaciones,id',
            'legacy' => 'nullable|string|max:60',
            'localidad_nombre' => 'required|string|max:255',
            'numero_localidad' => 'nullable|integer|min:1|max:99999',
            'ubicacion_fisica' => 'nullable|string|max:255',
            'actual_no_serie' => 'nullable|string|max:120',
            'actual_ip' => 'nullable|string|max:60',
            'actual_mascara' => 'nullable|string|max:60',
            'actual_gateway' => 'nullable|string|max:60',
            'actual_instalado' => 'boolean',
            'actual_comentario' => 'nullable|string|max:1000',
            'nuevo_marca' => 'nullable|string|max:120',
            'nuevo_modelo' => 'nullable|string|max:120',
            'nuevo_no_serie' => 'nullable|string|max:120',
            'nuevo_ip' => 'nullable|string|max:60',
            'nuevo_mascara' => 'nullable|string|max:60',
            'nuevo_gateway' => 'nullable|string|max:60',
            'nuevo_instalado' => 'boolean',
            'nuevo_comentario' => 'nullable|string|max:1000',
            'nuevo_mac_address' => 'nullable|string|max:60',
            'activo' => 'boolean',
        ]);

        if (empty($validated['empresa_id'])) {
            $validated['empresa_id'] = $request->user()?->empresa_id ?? Empresa::withoutGlobalScopes()->value('id');
        }

        if (! empty($validated['reloj_ubicacion_id'])) {
            $ubicacion = RelojUbicacion::find($validated['reloj_ubicacion_id']);
            if ($ubicacion) {
                $validated['numero_localidad'] = $validated['numero_localidad'] ?? $ubicacion->numero_localidad;
                $validated['legacy'] = $validated['legacy'] ?: $ubicacion->legacy;
            }
        }

        try {
            RelojEquipoBiometrico::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Equipo biométrico registrado exitosamente.',
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear equipo biométrico: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Ocurrió un error al registrar el equipo biométrico.',
            ]);
        }
    }

    public function update(Request $request, RelojEquipoBiometrico $biometrico)
    {
        $validated = $request->validate([
            'empresa_id' => 'nullable|exists:empresas,id',
            'reloj_ubicacion_id' => 'nullable|exists:reloj_ubicaciones,id',
            'legacy' => 'nullable|string|max:60',
            'localidad_nombre' => 'required|string|max:255',
            'numero_localidad' => 'nullable|integer|min:1|max:99999',
            'ubicacion_fisica' => 'nullable|string|max:255',
            'actual_no_serie' => 'nullable|string|max:120',
            'actual_ip' => 'nullable|string|max:60',
            'actual_mascara' => 'nullable|string|max:60',
            'actual_gateway' => 'nullable|string|max:60',
            'actual_instalado' => 'boolean',
            'actual_comentario' => 'nullable|string|max:1000',
            'nuevo_marca' => 'nullable|string|max:120',
            'nuevo_modelo' => 'nullable|string|max:120',
            'nuevo_no_serie' => 'nullable|string|max:120',
            'nuevo_ip' => 'nullable|string|max:60',
            'nuevo_mascara' => 'nullable|string|max:60',
            'nuevo_gateway' => 'nullable|string|max:60',
            'nuevo_instalado' => 'boolean',
            'nuevo_comentario' => 'nullable|string|max:1000',
            'nuevo_mac_address' => 'nullable|string|max:60',
            'activo' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($biometrico, $validated) {
                $biometrico->update($validated);
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Equipo biométrico actualizado exitosamente.',
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar equipo biométrico {$biometrico->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Ocurrió un error al actualizar el equipo biométrico.',
            ]);
        }
    }

    public function toggleStatus(RelojEquipoBiometrico $biometrico)
    {
        $biometrico->update(['activo' => ! $biometrico->activo]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Estado del equipo biométrico actualizado.',
        ]);
    }

    public function destroy(RelojEquipoBiometrico $biometrico)
    {
        try {
            $biometrico->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => 'Equipo biométrico eliminado correctamente.',
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar equipo biométrico {$biometrico->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'No se pudo eliminar el equipo biométrico.',
            ]);
        }
    }
}

