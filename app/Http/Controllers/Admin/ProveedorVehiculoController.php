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
     * Common validation rules.
     */
    protected function validationRules(): array
    {
        return [
            'tipo_vehiculo' => 'required|string|max:255',
            'categoria_vehiculo' => 'nullable|string|max:255',
            'subtipo_carroceria' => 'nullable|string|max:255',
            'marca' => 'required|string|max:255',
            'modelo' => 'required|string|max:255',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 2),
            'placa' => 'required|string|max:50',
            'numero_serie_vin' => 'nullable|string|max:50',
            'numero_ejes' => 'nullable|integer|min:1|max:20',
            'tarjeta_circulacion' => 'nullable|string|max:50',
            'aseguradora' => 'nullable|string|max:255',
            'poliza_seguro' => 'nullable|string|max:100',
            'vigencia_seguro' => 'nullable|date',
            'foto_frontal' => 'nullable|image|max:3072',
            'foto_trasera' => 'nullable|image|max:3072',
            'tiene_remolque' => 'nullable',
            'remolque_fabricante' => 'nullable|string|max:255',
            'remolque_serie_fabricante' => 'nullable|string|max:100',
            'remolque_vin' => 'nullable|string|max:50',
            'remolque_placa' => 'nullable|string|max:50',
            'remolque_tipo' => 'nullable|string|max:255',
            'remolque_modelo' => 'nullable|string|max:255',
            'remolque_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 2),
            'remolque_peso_bruto_vehicular' => 'nullable|string|max:50',
            'remolque_peso_vehicular' => 'nullable|string|max:50',
            'remolque_capacidad_carga' => 'nullable|string|max:50',
            'remolque_largo' => 'nullable|string|max:30',
            'remolque_ancho' => 'nullable|string|max:30',
            'remolque_alto' => 'nullable|string|max:30',
            'remolque_ejes' => 'nullable|integer|min:1|max:10',
            'remolque_capacidad_ejes' => 'nullable|string|max:50',
            'remolque_tipo_suspension' => 'nullable|string|max:50',
            'remolque_capacidad_patines' => 'nullable|string|max:50',
            'remolque_cantidad_llantas' => 'nullable|integer|min:1|max:50',
            'remolque_medida_llantas' => 'nullable|string|max:50',
            'remolque_presion_llantas' => 'nullable|string|max:30',
            'remolque_foto_placa' => 'nullable|image|max:3072',
            'remolque_foto_lateral' => 'nullable|image|max:3072',
        ];
    }

    /**
     * Store a new supplier vehicle.
     */
    public function store(Request $request, $proveedorId)
    {
        $proveedor = Proveedor::findOrFail($proveedorId);

        $validator = Validator::make($request->all(), $this->validationRules());

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
        $data['tiene_remolque'] = filter_var($request->input('tiene_remolque'), FILTER_VALIDATE_BOOLEAN);

        // Subir fotos unidad
        if ($request->hasFile('foto_frontal')) {
            $data['foto_frontal'] = $request->file('foto_frontal')->store('proveedor_vehiculos', 'public');
        }
        if ($request->hasFile('foto_trasera')) {
            $data['foto_trasera'] = $request->file('foto_trasera')->store('proveedor_vehiculos', 'public');
        }

        // Subir fotos semirremolque / caja
        if ($request->hasFile('remolque_foto_placa')) {
            $data['remolque_foto_placa'] = $request->file('remolque_foto_placa')->store('proveedor_vehiculos', 'public');
        }
        if ($request->hasFile('remolque_foto_lateral')) {
            $data['remolque_foto_lateral'] = $request->file('remolque_foto_lateral')->store('proveedor_vehiculos', 'public');
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

        $validator = Validator::make($request->all(), $this->validationRules());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $data['tiene_remolque'] = filter_var($request->input('tiene_remolque'), FILTER_VALIDATE_BOOLEAN);

        // Subir fotos unidad reemplazando las anteriores
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

        // Subir fotos semirremolque reemplazando las anteriores
        if ($request->hasFile('remolque_foto_placa')) {
            if ($vehicle->remolque_foto_placa) {
                Storage::disk('public')->delete($vehicle->remolque_foto_placa);
            }
            $data['remolque_foto_placa'] = $request->file('remolque_foto_placa')->store('proveedor_vehiculos', 'public');
        }
        if ($request->hasFile('remolque_foto_lateral')) {
            if ($vehicle->remolque_foto_lateral) {
                Storage::disk('public')->delete($vehicle->remolque_foto_lateral);
            }
            $data['remolque_foto_lateral'] = $request->file('remolque_foto_lateral')->store('proveedor_vehiculos', 'public');
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
        $filesToDelete = [
            $vehicle->foto_frontal,
            $vehicle->foto_trasera,
            $vehicle->remolque_foto_placa,
            $vehicle->remolque_foto_lateral,
        ];

        foreach ($filesToDelete as $file) {
            if ($file) {
                Storage::disk('public')->delete($file);
            }
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully'
        ]);
    }
}
