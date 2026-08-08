<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'sueldo_base' => ['nullable', 'numeric', 'min:0'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'pais_telefono_id' => ['nullable', 'exists:pais,id'],
            'status' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
            'empresa_id' => ['nullable', 'exists:empresas,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'roles' => ['array'],
            'send_welcome_whatsapp' => ['nullable', 'boolean'],
        ];
    }
}
