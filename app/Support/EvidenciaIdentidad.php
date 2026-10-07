<?php

namespace App\Support;

/** Reglas de validación de la foto y el documento de identidad capturados en el alta. */
class EvidenciaIdentidad
{
    public static function reglas(): array
    {
        return [
            'foto' => ['nullable', 'image', 'max:4096'],
            'documento_frontal' => ['nullable', 'image', 'max:4096'],
            'documento_reverso' => ['nullable', 'image', 'max:4096'],
            'quitar_foto' => ['nullable', 'boolean'],
            'tipo_documento' => ['nullable', 'in:ine,pasaporte'],
        ];
    }
}
