<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Validator;

/**
 * Reglas comunes para el par latitud/longitud.
 *
 * Antes cada formulario validaba `nullable|numeric` por separado, así que era
 * posible persistir una latitud sin su longitud: media coordenada es
 * inutilizable y el mapa la representa en un punto equivocado.
 *
 * Aquí se garantiza que el par sea completo, numérico y dentro de rango, y que
 * el par vacío siga siendo válido (retrocompatibilidad con los registros
 * históricos que nunca tuvieron ubicación).
 */
trait ValidatesCoordinates
{
    /**
     * @return array<string, array<int, string>>
     */
    protected function coordinateRules(): array
    {
        return [
            'latitud' => ['nullable', 'numeric', 'between:-90,90'],
            'longitud' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * Normaliza la entrada antes de validar.
     *
     * El formulario envía cadena vacía cuando el usuario borra el campo, y
     * `''` no es `numeric`: sin esto, vaciar una coordenada devolvía un error de
     * validación en lugar de limpiar el valor.
     *
     * @return array<string, mixed>
     */
    protected function normalizedCoordinates(): array
    {
        $normalized = [];

        foreach (['latitud', 'longitud'] as $field) {
            if (! $this->has($field)) {
                continue;
            }

            $value = $this->input($field);

            $normalized[$field] = (is_string($value) && trim($value) === '') || $value === null
                ? null
                : $value;
        }

        return $normalized;
    }

    /**
     * Rechaza coordenadas a medias. Se engancha desde `withValidator()`.
     */
    protected function validateCoordinatePair(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $lat = $this->input('latitud');
            $lng = $this->input('longitud');

            $hasLat = $lat !== null && $lat !== '';
            $hasLng = $lng !== null && $lng !== '';

            if ($hasLat === $hasLng) {
                return;
            }

            $missing = $hasLat ? 'longitud' : 'latitud';

            $validator->errors()->add(
                $missing,
                __('La ubicación debe incluir latitud y longitud, o ninguna de las dos.'),
            );
        });
    }
}
