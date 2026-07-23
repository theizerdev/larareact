<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductorRequest;
use App\Models\Productor;
use App\Models\Pais;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductorController extends Controller
{
    public function index(Request $request)
    {
        $query = Productor::with(['pais', 'paisTelefono', 'empresa', 'sucursal', 'user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('razon_social', 'like', "%{$search}%")
                        ->orWhere('nombre_comercial', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('razon_social_rancho', 'like', "%{$search}%")
                        ->orWhere('nombre_comercial_rancho', 'like', "%{$search}%")
                        ->orWhere('responsable', 'like', "%{$search}%")
                        ->orWhere('telefono', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->status);
            })
            ->when($request->filled('pais_id'), function ($q) use ($request) {
                $q->where('pais_id', $request->pais_id);
            });

        $productores = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Productor::count(),
            'activos' => Productor::where('status', 'activo')->count(),
            'suspendidos' => Productor::where('status', 'suspendido')->count(),
            'en_revision' => Productor::where('status', 'en_revision')->count(),
        ];

        $user = auth()->user();
        $empresa = $user->empresa;
        $sucursal = $user->sucursal;

        return Inertia::render('admin/Productores/Index', [
            'productores' => $productores,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id', 'latitud', 'longitud', 'direccion']),
            'usuarios' => User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'filters' => $request->only('search', 'status', 'pais_id', 'perPage'),
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'razon_social' => $empresa->razon_social,
            ] : null,
            'sucursal' => $sucursal ? [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
                'latitud' => $sucursal->latitud,
                'longitud' => $sucursal->longitud,
                'direccion' => $sucursal->direccion,
            ] : null,
        ]);
    }

    public function store(ProductorRequest $request)
    {
        $data = $request->validated();
        $user = auth()->user();

        $data['empresa_id'] = $data['empresa_id'] ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $user->id;

        $data['razon_social_rancho'] = $data['razon_social_rancho'] ?? $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial_rancho'] ?? $data['nombre_comercial'];

        Productor::create($data);

        return redirect()->back();
    }

    public function update(ProductorRequest $request, Productor $productor)
    {
        $data = $request->validated();
        $user = auth()->user();

        $data['empresa_id'] = $data['empresa_id'] ?? $productor->empresa_id ?? $user->empresa_id;
        $data['sucursal_id'] = $data['sucursal_id'] ?? $productor->sucursal_id ?? $user->sucursal_id;
        $data['user_id'] = $data['user_id'] ?? $productor->user_id ?? $user->id;

        $data['razon_social_rancho'] = $data['razon_social_rancho'] ?? $data['razon_social'];
        $data['nombre_comercial_rancho'] = $data['nombre_comercial_rancho'] ?? $data['nombre_comercial'];

        $productor->update($data);

        return redirect()->back();
    }

    public function destroy(Productor $productor)
    {
        $productor->delete();

        return redirect()->back();
    }

    public function toggleStatus(Request $request, Productor $productor)
    {
        $request->validate([
            'status' => 'required|string|in:activo,suspendido,en_revision',
        ]);

        $productor->update([
            'status' => $request->status,
        ]);

        return redirect()->back();
    }

    public function generatePreRegistro(Request $request)
    {
        $request->validate([
            'razon_social_rancho' => 'required|string|max:255',
            'nombre_comercial_rancho' => 'required|string|max:255',
            'pais_telefono_id' => 'required|exists:pais,id',
            'telefono' => 'required|string|max:20',
        ]);

        $user = auth()->user();
        $token = bin2hex(random_bytes(16));

        \App\Models\ProductorPreRegistro::create([
            'razon_social_rancho' => $request->razon_social_rancho,
            'nombre_comercial_rancho' => $request->nombre_comercial_rancho,
            'pais_telefono_id' => $request->pais_telefono_id,
            'telefono' => $request->telefono,
            'token' => $token,
            'expires_at' => now()->addHours(12),
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'status' => 'pendiente',
        ]);

        try {
            $pais = \App\Models\Pais::findOrFail($request->pais_telefono_id);
            $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
            $cleanPhone = preg_replace('/[^0-9]/', '', $request->telefono);
            $to = $prefix . $cleanPhone;

            $empresa = $user->empresa ?? \App\Models\Empresa::first();
            $whatsappService = new \App\Services\WhatsAppService($empresa);

            $link = url("/preregistro-productor/{$token}");

            $message = "Estimado Productor del Rancho *{$request->nombre_comercial_rancho}*, le invitamos a completar su pre-registro de datos para su acceso a nuestras instalaciones con la siguiente información:\n\n"
                . "Ubicación: {$user->sucursal->nombre}\n"
                . "Rancho: {$request->nombre_comercial_rancho}\n"
                . "Colaboradores: Indicar todos los que acudirán\n"
                . "Vehículos: En los que acudirán.\n\n"
                . "Será Indispensable contar con: *INE vigente* y *Chaleco de seguridad*\n\n"
                . "Ingresar a:\n"
                . $link;

            $whatsappService->sendMessage($to, $message, true);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de invitación de productor: ' . $e->getMessage());
        }

        return redirect()->back();
    }
}
