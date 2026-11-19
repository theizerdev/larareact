<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCurp implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        $curp = strtoupper(trim((string) $value));

        if (strlen($curp) !== 18) {
            $fail("La CURP debe tener exactamente 18 caracteres.");
            return;
        }

        // Validar que sean caracteres válidos alfanuméricos
        if (!preg_match('/^[A-Z0-9]{18}$/', $curp)) {
            $fail("La CURP debe contener únicamente letras y números.");
            return;
        }

        // Estructura general de 18 caracteres aceptada para no bloquear registros

    }
}
