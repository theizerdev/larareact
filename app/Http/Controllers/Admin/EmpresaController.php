<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmpresaRequest;
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
        $perPage = $request->input('perPage', 10);

        $query = Empresa::with('pais');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                    ->orWhere('nombre_comercial', 'like', "%{$search}%")
                    ->orWhere('documento', 'like', "%{$search}%")
                    ->orWhere('representante_legal', 'like', "%{$search}%")
                    ->orWhere('curp_representante_legal', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $empresas = $query->orderBy('razon_social', 'asc')->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Empresa::count(),
            'activos' => Empresa::where('status', true)->count(),
            'inactivos' => Empresa::where('status', false)->count(),
        ];

        return inertia('admin/Empresas/Index', [
            'empresas' => $empresas,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(EmpresaRequest $request)
    {
        $validated = $request->validated();
        $empresa = null;

        try {
            DB::transaction(function () use ($validated, &$empresa) {
                $empresa = new Empresa($validated);
                $empresa->api_key = Str::random(32);
                $empresa->whatsapp_api_key = Str::random(32);
                $empresa->save();
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Company created successfully.'),
                    'data' => $empresa,
                ], 201);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear empresa: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error creating the company. Please try again.'),
                ], 500);
            }

            return back()
                ->withInput()
                ->withErrors(['general' => __('There was an error creating the company. Please try again.')])
                ->with('notification', [
                    'type' => 'error',
                    'message' => __('There was an error creating the company. Please try again.'),
                ]);
        }
    }

    public function update(EmpresaRequest $request, Empresa $empresa)
    {
        $validated = $request->validated();

        try {
            DB::transaction(function () use ($empresa, $validated) {
                $empresa->update($validated);
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Company updated successfully.'),
                    'data' => $empresa,
                ]);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Company updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar empresa {$empresa->id}: ".$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error updating the company. Please try again.'),
                ], 500);
            }

            return back()
                ->withInput()
                ->withErrors(['general' => __('There was an error updating the company. Please try again.')])
                ->with('notification', [
                    'type' => 'error',
                    'message' => __('There was an error updating the company. Please try again.'),
                ]);
        }
    }

    public function toggleStatus(Request $request, Empresa $empresa)
    {
        try {
            DB::transaction(function () use ($empresa) {
                $empresa->status = ! $empresa->status;
                $empresa->save();
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Status updated successfully.'),
                    'status' => $empresa->status,
                ]);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de empresa {$empresa->id}: ".$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error updating the status. Please try again.'),
                ], 500);
            }

            return back()
                ->withErrors(['general' => __('There was an error updating the status. Please try again.')])
                ->with('notification', [
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
