<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductorEmpleado;
use App\Models\Productor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProductorEmpleadoController extends Controller
{
    /**
     * List all employees for a given producer.
     */
    public function index($productorId)
    {
        $productor = Productor::findOrFail($productorId);
        $employees = ProductorEmpleado::where('productor_id', $productorId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'employees' => $employees
        ]);
    }

    /**
     * Store a new producer employee.
     */
    public function store(Request $request, $productorId)
    {
        $productor = Productor::findOrFail($productorId);

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
        $data['productor_id'] = $productorId;
        $data['empresa_id'] = $productor->empresa_id;
        $data['sucursal_id'] = $productor->sucursal_id;

        // Subir fotos
        if ($request->hasFile('foto_carnet')) {
            $data['foto_carnet'] = $request->file('foto_carnet')->store('productor_empleados', 'public');
        }
        if ($request->hasFile('documento_frontal')) {
            $data['documento_frontal'] = $request->file('documento_frontal')->store('productor_empleados', 'public');
        }
        if ($request->hasFile('documento_reverso')) {
            $data['documento_reverso'] = $request->file('documento_reverso')->store('productor_empleados', 'public');
        }

        $employee = ProductorEmpleado::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee added successfully',
            'employee' => $employee
        ], 201);
    }

    /**
     * Update producer employee.
     */
    public function update(Request $request, $id)
    {
        $employee = ProductorEmpleado::findOrFail($id);

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

        if ($request->hasFile('foto_carnet')) {
            if ($employee->foto_carnet) {
                Storage::disk('public')->delete($employee->foto_carnet);
            }
            $data['foto_carnet'] = $request->file('foto_carnet')->store('productor_empleados', 'public');
        }
        if ($request->hasFile('documento_frontal')) {
            if ($employee->documento_frontal) {
                Storage::disk('public')->delete($employee->documento_frontal);
            }
            $data['documento_frontal'] = $request->file('documento_frontal')->store('productor_empleados', 'public');
        }
        if ($request->hasFile('documento_reverso')) {
            if ($employee->documento_reverso) {
                Storage::disk('public')->delete($employee->documento_reverso);
            }
            $data['documento_reverso'] = $request->file('documento_reverso')->store('productor_empleados', 'public');
        }

        $employee->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully',
            'employee' => $employee
        ]);
    }

    /**
     * Delete producer employee.
     */
    public function destroy($id)
    {
        $employee = ProductorEmpleado::findOrFail($id);

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
