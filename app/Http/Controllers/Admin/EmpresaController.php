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
        $data = $request->validated();

        // No hay try/catch que "trague" la excepción: si el INSERT falla, la
        // QueryException se propaga => 500 semántico + página Inertia de error
        // (ver bootstrap/app.php). El frontend NUNCA verá un falso 2xx.
        DB::transaction(function () use ($data) {
            $empresa = new Empresa($data);
            $empresa->api_key = Str::random(32);
            $empresa->whatsapp_api_key = Str::random(32);
            $empresa->save();
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Company created successfully.'),
        ]);
    }

    public function update(EmpresaRequest $request, Empresa $empresa)
    {
        $data = $request->validated();

        DB::transaction(function () use ($empresa, $data) {
            $empresa->update($data);
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Company updated successfully.'),
        ]);
    }

    public function toggleStatus(Empresa $empresa)
    {
        DB::transaction(function () use ($empresa) {
            $empresa->update(['status' => ! $empresa->status]);
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function updateLogos(Request $request, Empresa $empresa)
    {
        $request->validate([
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'logo_mini' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            DB::transaction(function () use ($request, $empresa) {
                if ($request->hasFile('logo')) {
                    $path = $request->file('logo')->store('empresas/logos', 'public');
                    $empresa->logo = '/storage/'.$path;
                }

                if ($request->hasFile('logo_mini')) {
                    $path = $request->file('logo_mini')->store('empresas/logos_mini', 'public');
                    $empresa->logo_mini = '/storage/'.$path;
                }

                $empresa->save();
            });
        } catch (\Throwable $e) {
            // Fallo de almacenamiento (disco lleno, permisos, etc.): se devuelve
            // como error de validación => el frontend dispara onError (no onSuccess).
            Log::error("Error al actualizar logos de empresa {$empresa->id}: ".$e->getMessage());

            return back()->withErrors([
                'logo' => __('There was an error updating the logos. Please try again.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Logos updated successfully.'),
        ]);
    }
}
