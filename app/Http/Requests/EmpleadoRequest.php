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
     * Prepare data before validation (sanitize and handle empty strings).
     */
    protected function prepareForValidation(): void
    {
        $input = $this->all();

        // Convert empty string relations to null so foreign keys don't fail
        foreach (['departamento_id', 'cargo_id', 'responsable_id', 'pais_telefono_id', 'user_id', 'empresa_id', 'sucursal_id'] as $field) {
            if (isset($input[$field]) && ($input[$field] === '' || $input[$field] === 'none' || $input[$field] === '0')) {
                $input[$field] = null;
            }
        }

        // Clean CURP if provided
        if (isset($input['curp']) && is_string($input['curp'])) {
            $input['curp'] = strtoupper(trim($input['curp']));
            if ($input['curp'] === '') {
                $input['curp'] = null;
            }
        }

        // Clean phone & email if empty
        if (isset($input['telefono']) && trim((string)$input['telefono']) === '') {
            $input['telefono'] = null;
        }
        if (isset($input['correo']) && trim((string)$input['correo']) === '') {
            $input['correo'] = null;
        }

        $this->replace($input);
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
            'documento_identidad' => 'nullable|string|max:50|unique:empleados,documento_identidad,' . $empleadoId,
            'codigo_acceso' => 'nullable|string|max:50',
            'tarjeta_acceso_1' => 'nullable|string|max:50',
            'tarjeta_acceso_2' => 'nullable|string|max:50',
            'tarjeta_acceso_3' => 'nullable|string|max:50',
            'curp' => 'nullable|string|max:25',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'telefono' => 'nullable|string|max:50',
            'correo' => 'nullable|email|max:255',
            'genero' => 'nullable|string|max:20',
            'departamento_id' => 'nullable|exists:departamentos,id',
            'responsable_id' => 'nullable|exists:responsables,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'foto_empleado' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_empleado_2' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'foto_documento_reverso' => 'nullable', // Puede ser archivo (Subida normal) o base64 (Cámara)
            'jornada_laboral' => 'nullable|array',
            'vehiculos' => 'nullable|array',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }

    /**
     * Custom human-friendly messages in Spanish.
     */
    public function messages(): array
    {
        return [
            'nombres.required' => 'El nombre del empleado es obligatorio.',
            'apellidos.required' => 'Los apellidos del empleado son obligatorios.',
            'documento_identidad.unique' => 'Este número de documento ya está registrado para otro empleado.',
            'correo.email' => 'El formato del correo electrónico no es válido.',
            'departamento_id.exists' => 'El departamento seleccionado no es válido.',
            'empresa_id.exists' => 'La empresa seleccionada no es válida.',
            'sucursal_id.exists' => 'La sucursal seleccionada no es válida.',
            'cargo_id.exists' => 'El cargo seleccionado no es válido.',
            'responsable_id.exists' => 'El responsable seleccionado no es válido.',
        ];
    }
}
