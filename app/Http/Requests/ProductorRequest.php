<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProductorRequest extends FormRequest
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
        $id = $this->route('productor')?->id ?? $this->route('productor');

        return [
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['required', 'string', 'max:255'],
            'rfc' => ['nullable', 'string', 'max:255'],
            'documento_identidad' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('productores', 'documento_identidad')->ignore($id),
            ],
            'razon_social_rancho' => ['nullable', 'string', 'max:255'],
            'nombre_comercial_rancho' => ['nullable', 'string', 'max:255'],
            'pais_telefono_id' => ['nullable', 'exists:pais,id'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'direccion' => ['nullable', 'string'],
            'codigo_postal' => ['nullable', 'string', 'max:50'],
            'estado' => ['nullable', 'string', 'max:255'],
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
     * Same cross-tenant gap found and fixed in ProveedorRequest.
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
