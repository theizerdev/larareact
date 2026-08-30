<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FamiliaRequest extends FormRequest
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
            'marca_id' => ['required', 'exists:marcas,id'],
            'categoria_id' => ['nullable', 'exists:categorias,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'specs_json' => ['nullable', 'array'],
            'estado' => ['boolean'],
            'empresa_id' => ['nullable', 'exists:landlord.empresas,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
        ];
    }
}
