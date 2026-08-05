<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEmpresaRequest;
use App\Http\Requests\Admin\UpdateEmpresaRequest;
use App\Http\Resources\EmpresaResource;
use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmpresaController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Empresa::class);

        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Empresa::with('pais');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                    ->orWhere('documento', 'like', "%{$search}%")
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
            'empresas' => EmpresaResource::collection($empresas),
            'stats' => $stats,
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(StoreEmpresaRequest $request)
    {
        $validated = $request->validated();

        try {
            $empresa = new Empresa($validated);
            $empresa->api_key = Str::random(32);
            $empresa->whatsapp_api_key = Str::random(32);
            $empresa->subscription_status = 'trial';
            $empresa->trial_ends_at = now()->addDays(7);
            $empresa->max_sucursales = 1;
            $empresa->save();

            $instanceName = ! empty($empresa->documento) ? $empresa->documento : 'empresa_'.$empresa->id;
            $empresa->update([
                'whatsapp_instance' => $instanceName,
            ]);

            try {
                \App\Services\WhatsAppService::forCompany($empresa)->createInstance();
            } catch (\Throwable $e) {
                Log::warning('No se pudo crear la instancia inicial en el motor WhatsApp: '.$e->getMessage());
            }

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

    public function update(UpdateEmpresaRequest $request, Empresa $empresa)
    {
        $validated = $request->validated();

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
