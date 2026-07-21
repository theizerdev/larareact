<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CargoRequest extends FormRequest
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
        return [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'departamento_id' => 'required|exists:departamentos,id',
            'empresa_id' => 'required|exists:empresas,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'user_id' => 'required|exists:users,id',
            'status' => 'nullable|integer|in:0,1',
        ];
    }
}
