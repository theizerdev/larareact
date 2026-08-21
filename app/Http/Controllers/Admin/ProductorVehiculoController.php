<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductorVehiculo;
use App\Models\Productor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProductorVehiculoController extends Controller
{
    /**
     * List all vehicles for a given producer.
     */
    public function index($productorId)
    {
        $productor = Productor::findOrFail($productorId);
        $vehicles = ProductorVehiculo::where('productor_id', $productorId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'vehicles' => $vehicles
        ]);
    }

    /**
     * Store a new producer vehicle.
     */
    public function store(Request $request, $productorId)
    {
        $productor = Productor::findOrFail($productorId);

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
        $data['productor_id'] = $productorId;
        $data['empresa_id'] = $productor->empresa_id;
        $data['sucursal_id'] = $productor->sucursal_id;

        // Subir fotos
        if ($request->hasFile('foto_frontal')) {
            $data['foto_frontal'] = $request->file('foto_frontal')->store('productor_vehiculos', 'public');
        }
        if ($request->hasFile('foto_trasera')) {
            $data['foto_trasera'] = $request->file('foto_trasera')->store('productor_vehiculos', 'public');
        }

        $vehicle = ProductorVehiculo::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle added successfully',
            'vehicle' => $vehicle
        ], 201);
    }

    /**
     * Update producer vehicle.
     */
    public function update(Request $request, $id)
    {
        $vehicle = ProductorVehiculo::findOrFail($id);

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

        if ($request->hasFile('foto_frontal')) {
            if ($vehicle->foto_frontal) {
                Storage::disk('public')->delete($vehicle->foto_frontal);
            }
            $data['foto_frontal'] = $request->file('foto_frontal')->store('productor_vehiculos', 'public');
        }
        if ($request->hasFile('foto_trasera')) {
            if ($vehicle->foto_trasera) {
                Storage::disk('public')->delete($vehicle->foto_trasera);
            }
            $data['foto_trasera'] = $request->file('foto_trasera')->store('productor_vehiculos', 'public');
        }

        $vehicle->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'vehicle' => $vehicle
        ]);
    }

    /**
     * Delete producer vehicle.
     */
    public function destroy($id)
    {
        $vehicle = ProductorVehiculo::findOrFail($id);

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
