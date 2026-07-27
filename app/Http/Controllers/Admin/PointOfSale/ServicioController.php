<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Servicio;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) {
            return '$';
        }

        $empresa = $user->empresa;
        if (!$empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Servicio::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $servicios = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/PointOfSale/Servicios/Index', [
            'servicios' => $servicios,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'estado' => 'boolean',
        ]);

        Servicio::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Servicio creado exitosamente.'),
        ]);
    }

    public function update(Request $request, Servicio $servicio)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'estado' => 'boolean',
        ]);

        $servicio->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Servicio actualizado exitosamente.'),
        ]);
    }

    public function destroy(Servicio $servicio)
    {
        $servicio->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Servicio eliminado exitosamente.'),
        ]);
    }
}
