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
        $user = auth()->user();
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Servicio::with([
            'categoria:id,nombre',
            'marca:id,nombre',
            'modelo:id,nombre_comercial,codigo_modelo,marca_id,categoria_id',
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%")
                  ->orWhere('descripcion', 'like', "%{$search}%")
                  ->orWhereHas('categoria', fn($c) => $c->where('nombre', 'like', "%{$search}%"))
                  ->orWhereHas('marca', fn($m) => $m->where('nombre', 'like', "%{$search}%"))
                  ->orWhereHas('modelo', fn($mo) => $mo->where('nombre_comercial', 'like', "%{$search}%")->orWhere('codigo_modelo', 'like', "%{$search}%"));
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $servicios = $query->orderBy('id', 'desc')->paginate($perPage)->withQueryString();

        $categorias = \App\Models\Categoria::where('empresa_id', $user->empresa_id)
            ->where('estado', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $marcas = \App\Models\Marca::where('empresa_id', $user->empresa_id)
            ->where('estado', true)
            ->with(['modelos' => function ($q) {
                $q->where('estado', true)->select('id', 'marca_id', 'categoria_id', 'nombre_comercial', 'codigo_modelo');
            }])
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return inertia('admin/PointOfSale/Servicios/Index', [
            'servicios' => $servicios,
            'categorias' => $categorias,
            'marcas' => $marcas,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'marca_id' => 'nullable|exists:marcas,id',
            'modelo_id' => 'nullable|exists:modelos,id',
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'estado' => 'boolean',
        ]);

        $validated['precio'] = $validated['precio'] ?? 0.00;

        $servicio = Servicio::create($validated);

        $codigo = !empty($validated['codigo'])
            ? $validated['codigo']
            : 'SRV-' . str_pad($servicio->id, 8, '0', STR_PAD_LEFT);

        $descripcion = !empty($validated['descripcion'])
            ? $validated['descripcion']
            : "Servicio {$codigo} {$servicio->nombre}";

        $servicio->update([
            'codigo' => $codigo,
            'descripcion' => $descripcion,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Servicio creado exitosamente.'),
        ]);
    }

    public function update(Request $request, Servicio $servicio)
    {
        $validated = $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'marca_id' => 'nullable|exists:marcas,id',
            'modelo_id' => 'nullable|exists:modelos,id',
            'nombre' => 'required|string|max:255',
            'codigo' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'estado' => 'boolean',
        ]);

        $validated['precio'] = $validated['precio'] ?? $servicio->precio ?? 0.00;

        if (empty($validated['codigo'])) {
            $validated['codigo'] = $servicio->codigo ?: ('SRV-' . str_pad($servicio->id, 8, '0', STR_PAD_LEFT));
        }

        if (empty($validated['descripcion'])) {
            $validated['descripcion'] = "Servicio {$validated['codigo']} {$validated['nombre']}";
        }

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
