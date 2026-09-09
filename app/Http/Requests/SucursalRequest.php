<?php

namespace App\Http\Requests;

use App\Models\Sucursal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Ver nota en EmpresaRequest. Además: valida que, al editar, el registro siga
 * perteneciendo a la empresa del usuario (multi-tenant), igual que CargoRequest.
 */
class SucursalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'empresa_id' => ['required', 'exists:empresas,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'codigo_numeral' => ['nullable', 'string', 'max:2'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'pais_telefono_id' => ['nullable', 'exists:pais,id'],

            // Ubicación estructurada + coordenadas validadas.
            'pais_id' => ['nullable', 'exists:pais,id'],
            'direccion' => ['nullable', 'string', 'max:1000'],
            'codigo_postal' => ['nullable', 'string', 'max:20'],
            'colonia' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'estado' => ['nullable', 'string', 'max:255'],
            'zona_horaria' => ['nullable', 'string', 'max:100'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitud'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitud'],

            'status' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'latitud.between' => __('Latitude must be between -90 and 90.'),
            'longitud.between' => __('Longitude must be between -180 and 180.'),
            'latitud.required_with' => __('Latitude is required when longitude is set.'),
            'longitud.required_with' => __('Longitude is required when latitude is set.'),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();

            if (! $user || $user->isSuperAdmin()) {
                return;
            }

            if ($user->empresa_id && (int) $this->input('empresa_id') !== (int) $user->empresa_id) {
                $validator->errors()->add('empresa_id', __('You are not allowed to assign this company.'));
            }

            // Al editar: la sucursal objetivo debe pertenecer a la empresa del usuario.
            $sucursal = $this->route('sucursal');
            if ($sucursal instanceof Sucursal
                && $user->empresa_id
                && (int) $sucursal->empresa_id !== (int) $user->empresa_id) {
                $validator->errors()->add('empresa_id', __('You are not allowed to edit this branch.'));
            }
        });
    }
}
