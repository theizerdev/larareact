<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProveedorVehiculo;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProveedorVehiculoController extends Controller
{
    /**
     * List all vehicles for a given supplier.
     */
    public function index($proveedorId)
    {
        $proveedor = Proveedor::findOrFail($proveedorId);
        $vehicles = ProveedorVehiculo::where('proveedor_id', $proveedorId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'vehicles' => $vehicles
        ]);
    }

    /**
     * Store a new supplier vehicle.
     */
    public function store(Request $request, $proveedorId)
    {
        $proveedor = Proveedor::findOrFail($proveedorId);

        $validator = Validator::make($request->all(), [
            'tipo_vehiculo' => 'required|string|max:255',
            'marca' => 'required|string|max:255',
            'modelo' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 2),
            'placa' => 'required|string|max:50',
            'foto_frontal' => 'nullable|image|max:2048',
            'foto_trasera' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['proveedor_id'] = $proveedorId;
        $data['empresa_id'] = $proveedor->empresa_id;
        $data['sucursal_id'] = $proveedor->sucursal_id;

        // Subir fotos
        if ($request->hasFile('foto_frontal')) {
            $data['foto_frontal'] = $request->file('foto_frontal')->store('proveedor_vehiculos', 'public');
        }
        if ($request->hasFile('foto_trasera')) {
            $data['foto_trasera'] = $request->file('foto_trasera')->store('proveedor_vehiculos', 'public');
        }

        $vehicle = ProveedorVehiculo::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle added successfully',
            'vehicle' => $vehicle
        ], 201);
    }

    /**
     * Update supplier vehicle.
     */
    public function update(Request $request, $id)
    {
        $vehicle = ProveedorVehiculo::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'tipo_vehiculo' => 'required|string|max:255',
            'marca' => 'required|string|max:255',
            'modelo' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 2),
            'placa' => 'required|string|max:50',
            'foto_frontal' => 'nullable|image|max:2048',
            'foto_trasera' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Subir fotos reemplazando las anteriores
        if ($request->hasFile('foto_frontal')) {
            if ($vehicle->foto_frontal) {
                Storage::disk('public')->delete($vehicle->foto_frontal);
            }
            $data['foto_frontal'] = $request->file('foto_frontal')->store('proveedor_vehiculos', 'public');
        }
        if ($request->hasFile('foto_trasera')) {
            if ($vehicle->foto_trasera) {
                Storage::disk('public')->delete($vehicle->foto_trasera);
            }
            $data['foto_trasera'] = $request->file('foto_trasera')->store('proveedor_vehiculos', 'public');
        }

        $vehicle->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'vehicle' => $vehicle
        ]);
    }

    /**
     * Delete supplier vehicle.
     */
    public function destroy($id)
    {
        $vehicle = ProveedorVehiculo::findOrFail($id);

        // Borrar archivos
        if ($vehicle->foto_frontal) {
            Storage::disk('public')->delete($vehicle->foto_frontal);
        }
        if ($vehicle->foto_trasera) {
            Storage::disk('public')->delete($vehicle->foto_trasera);
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully'
        ]);
    }
}
