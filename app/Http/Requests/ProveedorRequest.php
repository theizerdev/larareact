<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesCoordinates;
use Illuminate\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProveedorRequest extends FormRequest
{
    use ValidatesCoordinates;

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
            ...$this->coordinateRules(),
            'status' => ['required', 'string', Rule::in(['activo', 'suspendido', 'en_revision'])],
            'empresa_id' => ['nullable'],
            'sucursal_id' => ['nullable'],
            'user_id' => ['nullable'],
        ];
    }

    /**
     * Convierte a null los campos de coordenada vacíos antes de validar.
     */
    protected function prepareForValidation(): void
    {
        $this->merge($this->normalizedCoordinates());
    }

    /**
     * Impide guardar media coordenada (latitud sin longitud o al revés).
     */
    public function withValidator(Validator $validator): void
    {
        $this->validateCoordinatePair($validator);
    }
}
