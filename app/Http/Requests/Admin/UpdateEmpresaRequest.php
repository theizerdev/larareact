<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmpresaRequest extends FormRequest
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
        $empresaId = $this->route('empresa')?->id ?? $this->route('empresa');

        return [
            'razon_social' => ['required', 'string', 'max:255'],
            'documento' => ['required', 'string', 'max:255', Rule::unique('empresas', 'documento')->ignore($empresaId)],
            'pais_id' => ['nullable', 'exists:pais,id'],
            'direccion' => ['nullable', 'string'],
            'latitud' => ['nullable', 'numeric'],
            'longitud' => ['nullable', 'numeric'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'representante_legal' => ['nullable', 'string', 'max:255'],
            'status' => ['boolean'],
        ];
    }
}
