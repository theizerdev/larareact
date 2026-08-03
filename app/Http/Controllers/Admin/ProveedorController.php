<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProveedorController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Proveedor::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                  ->orWhere('nombre_comercial', 'like', "%{$search}%")
                  ->orWhere('rif_documento', 'like', "%{$search}%")
                  ->orWhere('contacto_nombre', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status === 'active' || $status === '1' || $status === 'true');
        }

        $proveedores = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/PointOfSale/Proveedores/Index', [
            'proveedores' => $proveedores,
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'rif_documento' => 'nullable|string|max:100',
            'contacto_nombre' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:1000',
            'categoria_insumos' => 'nullable|string|max:255',
            'notas' => 'nullable|string|max:1000',
            'estado' => 'nullable|boolean',
        ]);

        $validated['estado'] = $validated['estado'] ?? true;
        $validated['empresa_id'] = auth()->user()?->empresa_id;
        $validated['sucursal_id'] = auth()->user()?->sucursal_id;

        Proveedor::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Proveedor registrado exitosamente.'),
        ]);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $validated = $request->validate([
            'razon_social' => 'required|string|max:255',
            'nombre_comercial' => 'nullable|string|max:255',
            'rif_documento' => 'nullable|string|max:100',
            'contacto_nombre' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:1000',
            'categoria_insumos' => 'nullable|string|max:255',
            'notas' => 'nullable|string|max:1000',
            'estado' => 'nullable|boolean',
        ]);

        $proveedor->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Proveedor actualizado exitosamente.'),
        ]);
    }

    public function destroy(Proveedor $proveedor)
    {
        $proveedor->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Proveedor eliminado exitosamente.'),
        ]);
    }
}
