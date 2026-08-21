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

        // Regex Oficial RENAPO
        $regex = '/^[A-Z]{4}\d{6}[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/';

        if (!preg_match($regex, $curp)) {
            $fail("El formato o estructura de la CURP es inválido.");
            return;
        }

        // Algoritmo Dígito Verificador RENAPO
        $dictionary = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
        $sum = 0;

        for ($i = 0; $i < 17; $i++) {
            $char = $curp[$i];
            $pos = mb_strpos($dictionary, $char, 0, 'UTF-8');
            if ($pos === false) {
                $fail("La CURP contiene un carácter no válido ('{$char}').");
                return;
            }
            $sum += $pos * (18 - $i);
        }

        $digit = (10 - ($sum % 10)) % 10;
        $expectedDigit = (int) $curp[17];

        if ($digit !== $expectedDigit) {
            $fail("El dígito verificador de la CURP es inválido según el algoritmo oficial de RENAPO.");
        }
    }
}
