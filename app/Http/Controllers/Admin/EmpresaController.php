<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use Illuminate\Http\Request;
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
                  ->orWhere('documento', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $empresas = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Empresa::count(),
            'activos' => Empresa::where('status', true)->count(),
            'inactivos' => Empresa::where('status', false)->count(),
        ];

        return inertia('Admin/Empresas/Index', [
            'empresas' => $empresas,
            'stats' => $stats,
            'paises' => Pais::where('activo', true)->get(['id', 'nombre', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento',
            'pais_id' => 'required|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
        ]);

        $empresa = new Empresa($validated);
        // Generar un token aleatorio para el api key (según requerimiento de la revisión)
        $empresa->api_key = Str::random(32);
        // Si usamos whatsapp_api_key en vez de api_key (la DB tiene ambos)
        $empresa->whatsapp_api_key = Str::random(32);
        
        $empresa->save();

        return back();
    }

    public function update(Request $request, Empresa $empresa)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'documento' => 'required|string|max:255|unique:empresas,documento,' . $empresa->id,
            'pais_id' => 'required|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'telefono' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'representante_legal' => 'nullable|string|max:255',
        ]);

        $empresa->update($validated);

        return back();
    }

    public function toggleStatus(Empresa $empresa)
    {
        $empresa->status = !$empresa->status;
        $empresa->save();

        return back();
    }

    public function updateLogos(Request $request, Empresa $empresa)
    {
        $request->validate([
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'logo_mini' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:1024',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('empresas/logos', 'public');
            $empresa->logo = '/storage/' . $path;
        }

        if ($request->hasFile('logo_mini')) {
            $path = $request->file('logo_mini')->store('empresas/logos_mini', 'public');
            $empresa->logo_mini = '/storage/' . $path;
        }

        $empresa->save();

        return back();
    }
}
