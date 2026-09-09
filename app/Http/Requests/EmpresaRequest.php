<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Incidencia 2 (Integridad backend): antes la validación vivía inline en el
 * controlador y las coordenadas se aceptaban con `numeric` sin rango, por lo que
 * un valor fuera de -90..90 / -180..180 reventaba en la capa de BD (columna
 * decimal) y el `try/catch` del controlador lo convertía en un falso "éxito".
 * Aquí se rechaza en 422 con mensaje claro, antes de tocar la base de datos.
 */
class EmpresaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

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
            'representante_legal' => ['nullable', 'string', 'max:255'],
            'curp_representante_legal' => ['nullable', 'string', 'max:18'],
            'telefono' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],

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
}
