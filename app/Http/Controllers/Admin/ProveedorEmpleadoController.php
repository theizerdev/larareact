<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProveedorEmpleado;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProveedorEmpleadoController extends Controller
{
    /**
     * List all employees for a given supplier.
     */
    public function index($proveedorId)
    {
        $proveedor = Proveedor::findOrFail($proveedorId);
        $employees = ProveedorEmpleado::where('proveedor_id', $proveedorId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'employees' => $employees
        ]);
    }

    /**
     * Store a new supplier employee.
     */
    public function store(Request $request, $proveedorId)
    {
        $proveedor = Proveedor::findOrFail($proveedorId);

        $validator = Validator::make($request->all(), [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:50',
            'genero' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'edad' => 'nullable|integer',
            'correo' => 'nullable|email|max:255',
            'cargo' => 'nullable|string|max:255',
            'foto_carnet' => 'nullable|image|max:2048',
            'documento_frontal' => 'nullable|image|max:2048',
            'documento_reverso' => 'nullable|image|max:2048',
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
        if ($request->hasFile('foto_carnet')) {
            $data['foto_carnet'] = $request->file('foto_carnet')->store('proveedor_empleados', 'public');
        }
        if ($request->hasFile('documento_frontal')) {
            $data['documento_frontal'] = $request->file('documento_frontal')->store('proveedor_empleados', 'public');
        }
        if ($request->hasFile('documento_reverso')) {
            $data['documento_reverso'] = $request->file('documento_reverso')->store('proveedor_empleados', 'public');
        }

        $employee = ProveedorEmpleado::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee added successfully',
            'employee' => $employee
        ], 201);
    }

    /**
     * Update supplier employee.
     */
    public function update(Request $request, $id)
    {
        $employee = ProveedorEmpleado::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:50',
            'genero' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'edad' => 'nullable|integer',
            'correo' => 'nullable|email|max:255',
            'cargo' => 'nullable|string|max:255',
            'foto_carnet' => 'nullable|image|max:2048',
            'documento_frontal' => 'nullable|image|max:2048',
            'documento_reverso' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Subir fotos reemplazando las anteriores
        if ($request->hasFile('foto_carnet')) {
            if ($employee->foto_carnet) {
                Storage::disk('public')->delete($employee->foto_carnet);
            }
            $data['foto_carnet'] = $request->file('foto_carnet')->store('proveedor_empleados', 'public');
        }
        if ($request->hasFile('documento_frontal')) {
            if ($employee->documento_frontal) {
                Storage::disk('public')->delete($employee->documento_frontal);
            }
            $data['documento_frontal'] = $request->file('documento_frontal')->store('proveedor_empleados', 'public');
        }
        if ($request->hasFile('documento_reverso')) {
            if ($employee->documento_reverso) {
                Storage::disk('public')->delete($employee->documento_reverso);
            }
            $data['documento_reverso'] = $request->file('documento_reverso')->store('proveedor_empleados', 'public');
        }

        $employee->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully',
            'employee' => $employee
        ]);
    }

    /**
     * Delete supplier employee.
     */
    public function destroy($id)
    {
        $employee = ProveedorEmpleado::findOrFail($id);

        // Borrar archivos
        if ($employee->foto_carnet) {
            Storage::disk('public')->delete($employee->foto_carnet);
        }
        if ($employee->documento_frontal) {
            Storage::disk('public')->delete($employee->documento_frontal);
        }
        if ($employee->documento_reverso) {
            Storage::disk('public')->delete($employee->documento_reverso);
        }

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    }
}
