<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pais;
use Illuminate\Http\Request;

class PaisController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Pais::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo_iso2', 'like', "%{$search}%")
                  ->orWhere('codigo_iso3', 'like', "%{$search}%")
                  ->orWhere('moneda_principal', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('activo', $status);
        }

        $paises = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Pais::count(),
            'activos' => Pais::where('activo', true)->count(),
            'inactivos' => Pais::where('activo', false)->count(),
        ];

        return inertia('Admin/Paises/Index', [
            'paises' => $paises,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2',
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3',
            'codigo_telefonico' => 'nullable|string|max:10',
            'moneda_principal' => 'nullable|string|max:3',
            'idioma_principal' => 'nullable|string|max:5',
            'continente' => 'nullable|string|max:50',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:50',
            'formato_fecha' => 'nullable|string|max:20',
            'formato_moneda' => 'nullable|string|max:20',
            'impuesto_predeterminado' => 'nullable|numeric|min:0',
            'separador_miles' => 'nullable|string|max:1',
            'separador_decimales' => 'nullable|string|max:1',
            'decimales_moneda' => 'nullable|integer|min:0',
            'activo' => 'boolean',
        ]);

        Pais::create($validated);

        return back();
    }

    public function update(Request $request, Pais $pais)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2,' . $pais->id,
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3,' . $pais->id,
            'codigo_telefonico' => 'nullable|string|max:10',
            'moneda_principal' => 'nullable|string|max:3',
            'idioma_principal' => 'nullable|string|max:5',
            'continente' => 'nullable|string|max:50',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:50',
            'formato_fecha' => 'nullable|string|max:20',
            'formato_moneda' => 'nullable|string|max:20',
            'impuesto_predeterminado' => 'nullable|numeric|min:0',
            'separador_miles' => 'nullable|string|max:1',
            'separador_decimales' => 'nullable|string|max:1',
            'decimales_moneda' => 'nullable|integer|min:0',
            'activo' => 'boolean',
        ]);

        $pais->update($validated);

        return back();
    }

    public function toggleStatus(Pais $pais)
    {
        $pais->activo = !$pais->activo;
        $pais->save();

        return back();
    }
}
