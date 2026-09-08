<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmpresaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare inputs for validation (convert empty coordinate strings to null).
     */
    protected function prepareForValidation(): void
    {
        $sanitizeCoord = function ($value) {
            if ($value === null) {
                return null;
            }
            if (is_string($value)) {
                $trimmed = trim($value);
                if ($trimmed === '' || strcasecmp($trimmed, 'null') === 0 || strcasecmp($trimmed, 'undefined') === 0) {
                    return null;
                }
                if (is_numeric($trimmed)) {
                    return (float) $trimmed;
                }
            }
            if (is_numeric($value)) {
                return (float) $value;
            }
            return $value;
        };

        $this->merge([
            'latitud' => $sanitizeCoord($this->latitud),
            'longitud' => $sanitizeCoord($this->longitud),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $id = $this->route('empresa')?->id ?? $this->route('empresa');

        return [
            'razon_social' => ['required', 'string', 'max:255'],
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'documento' => [
                'required',
                'string',
                'max:255',
                Rule::unique('empresas', 'documento')->ignore($id),
            ],
            'pais_id' => ['nullable', 'exists:pais,id'],
            'direccion' => ['nullable', 'string'],
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
            'zona_horaria' => ['nullable', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'representante_legal' => ['nullable', 'string', 'max:255'],
            'curp_representante_legal' => ['nullable', 'string', 'max:18'],
            'status' => ['boolean'],
        ];
    }
}
