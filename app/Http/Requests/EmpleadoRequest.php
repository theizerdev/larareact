<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmpleadoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $empleadoId = $this->route('empleado') 
            ? (is_object($this->route('empleado')) ? $this->route('empleado')->id : $this->route('empleado')) 
            : null;

        return [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'documento_identidad' => 'required|string|max:50|unique:empleados,documento_identidad,' . $empleadoId,
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'correo' => 'nullable|email|max:255',
            'genero' => 'nullable|string|in:M,F,Otro',
            'departamento_id' => 'required|exists:departamentos,id',
            'responsable_id' => 'nullable|exists:responsables,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'foto_empleado' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_empleado_2' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento_reverso' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'jornada_laboral' => 'nullable|array',
            'vehiculos' => 'nullable|array',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }
}
