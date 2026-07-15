<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProveedorRequest extends FormRequest
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
        $id = $this->route('proveedor')?->id ?? $this->route('proveedor');

        return [
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['required', 'string', 'max:255'],
            'documento_identidad' => [
                'required',
                'string',
                'max:255',
                Rule::unique('proveedores', 'documento_identidad')->ignore($id),
            ],
            'pais_telefono_id' => ['nullable', 'exists:pais,id'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'direccion' => ['nullable', 'string'],
            'responsable' => ['nullable', 'string', 'max:255'],
            'pais_id' => ['required', 'exists:pais,id'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['required', 'string', Rule::in(['activo', 'suspendido', 'en_revision'])],
            'empresa_id' => ['nullable'],
            'sucursal_id' => ['nullable'],
            'user_id' => ['nullable'],
        ];
    }
}
