<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmpresaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = (int) $request->input('perPage', 10);
        $sortBy = $request->input('sortBy', 'razon_social');
        $sortDir = strtolower($request->input('sortDir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = Empresa::with('pais')->withCount(['sucursales', 'users']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                    ->orWhere('nombre_comercial', 'like', "%{$search}%")
                    ->orWhere('documento', 'like', "%{$search}%")
                    ->orWhere('representante_legal', 'like', "%{$search}%")
                    ->orWhere('curp_representante_legal', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            if ($status === '1' || $status === '0') {
                $query->where('status', (bool) (int) $status);
            } elseif ($status === 'con_sucursales') {
                $query->has('sucursales');
            } elseif ($status === 'con_usuarios') {
                $query->has('users');
            }
        }

        $allowedSort = ['razon_social', 'nombre_comercial', 'documento', 'status', 'created_at', 'sucursales_count', 'users_count'];
        if (in_array($sortBy, $allowedSort, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('razon_social', 'asc');
        }

        $empresas = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Empresa::count(),
            'activos' => Empresa::where('status', true)->count(),
            'inactivos' => Empresa::where('status', false)->count(),
            'con_sucursales' => Empresa::has('sucursales')->count(),
            'con_usuarios' => Empresa::has('users')->count(),
        ];

        return inertia('admin/Empresas/Index', [
            'empresas' => $empresas,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'perPage', 'sortBy', 'sortDir']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento',
            'pais_id' => 'nullable|exists:pais,id',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
            'curp_representante_legal' => 'nullable|string|max:18',
            'status' => 'boolean',
        ]);

        try {
            $empresa = new Empresa($validated);
            $empresa->api_key = Str::random(32);
            $empresa->whatsapp_api_key = Str::random(32);
            $empresa->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear empresa: '.$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the company. Please try again.'),
            ]);
        }
    }

    public function update(Request $request, Empresa $empresa)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento,'.$empresa->id,
            'pais_id' => 'nullable|exists:pais,id',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
            'curp_representante_legal' => 'nullable|string|max:18',
            'status' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($empresa, $validated) {
                $empresa->update($validated);
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar empresa {$empresa->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the company. Please try again.'),
            ]);
        }
    }

    public function destroy(Empresa $empresa)
    {
        try {
            if ($empresa->sucursales()->exists()) {
                return back()->with('notification', [
                    'type' => 'error',
                    'message' => __('Cannot delete this company because it has registered branches.'),
                ]);
            }

            if ($empresa->users()->exists()) {
                return back()->with('notification', [
                    'type' => 'error',
                    'message' => __('Cannot delete this company because it has associated users.'),
                ]);
            }

            $empresa->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar empresa {$empresa->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the company. Please try again.'),
            ]);
        }
    }

    public function toggleStatus(Empresa $empresa)
    {
        try {
            $empresa->status = ! $empresa->status;
            $empresa->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de empresa {$empresa->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }

    public function updateLogos(Request $request, Empresa $empresa)
    {
        $request->validate([
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'logo_mini' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            if ($request->hasFile('logo')) {
                $path = $request->file('logo')->store('empresas/logos', 'public');
                $empresa->logo = '/storage/'.$path;
            }

            if ($request->hasFile('logo_mini')) {
                $path = $request->file('logo_mini')->store('empresas/logos_mini', 'public');
                $empresa->logo_mini = '/storage/'.$path;
            }

            $empresa->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Logos updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar logos de empresa {$empresa->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the logos. Please try again.'),
            ]);
        }
    }
}
