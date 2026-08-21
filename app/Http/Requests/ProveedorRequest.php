<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'rfc' => ['nullable', 'string', 'max:255'],
            'documento_identidad' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('proveedores', 'documento_identidad')->ignore($id),
            ],
            'pais_telefono_id' => ['nullable', 'exists:pais,id'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'direccion' => ['nullable', 'string'],
            'responsable' => ['nullable', 'string', 'max:255'],
            'curp' => ['nullable', 'string', 'max:18'],
            'pais_id' => ['required', 'exists:pais,id'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['required', 'string', Rule::in(['activo', 'suspendido', 'en_revision'])],
            'empresa_id' => ['nullable', 'exists:empresas,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * empresa_id/sucursal_id previously weren't even exists:-checked, and the
     * controller only defaults them from the logged-in user when the client
     * omits the field (?? empresa_id) - an explicit value from the client
     * passed straight through. Same cross-tenant gap found and fixed
     * elsewhere in this QA pass, applied here too.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();

            if (! $user || $user->isSuperAdmin()) {
                return;
            }

            if ($user->empresa_id && $this->filled('empresa_id') && (int) $this->input('empresa_id') !== (int) $user->empresa_id) {
                $validator->errors()->add('empresa_id', __('You are not allowed to assign this company.'));
            }

            if ($user->sucursal_id && $this->filled('sucursal_id') && (int) $this->input('sucursal_id') !== (int) $user->sucursal_id) {
                $validator->errors()->add('sucursal_id', __('You are not allowed to assign this branch.'));
            }
        });
    }
}
