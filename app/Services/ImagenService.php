<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Guarda imágenes que llegan como data-URL base64 (cámara o archivo reducido en
 * el navegador) en el disco público y devuelve la ruta '/storage/...'.
 */
class ImagenService
{
    public const MAX_BYTES = 8 * 1024 * 1024;

    private const TIPOS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    /** ¿Es una data-URL de imagen decodificable y de un tipo permitido? */
    public static function esDataUrlValida(mixed $valor): bool
    {
        return self::decodificar($valor) !== null;
    }

    /** ¿Es la ruta de una imagen ya guardada por el sistema? */
    public static function esRutaGuardada(mixed $valor): bool
    {
        return is_string($valor) && str_starts_with($valor, '/storage/') && ! str_contains($valor, '..');
    }

    /**
     * Devuelve la ruta a guardar: la data-URL nueva se escribe en disco; una
     * ruta existente se conserva tal cual; vacío/null devuelve null.
     */
    public static function guardar(mixed $valor, string $carpeta): ?string
    {
        if (self::esRutaGuardada($valor)) {
            return $valor;
        }

        $img = self::decodificar($valor);
        if ($img === null) {
            return null;
        }

        $ruta = trim($carpeta, '/').'/'.Str::random(40).'.'.$img['ext'];
        Storage::disk('public')->put($ruta, $img['bytes']);

        return '/storage/'.$ruta;
    }

    /** Borra del disco una ruta '/storage/...' (ignora vacíos y URLs externas). */
    public static function borrar(?string $ruta): void
    {
        if (self::esRutaGuardada($ruta)) {
            Storage::disk('public')->delete(substr($ruta, strlen('/storage/')));
        }
    }

    /** @return array{bytes: string, ext: string}|null */
    private static function decodificar(mixed $valor): ?array
    {
        if (! is_string($valor) || ! preg_match('#^data:image/[a-z+.-]+;base64,#i', $valor)) {
            return null;
        }

        $bytes = base64_decode(str_replace(' ', '+', substr($valor, strpos($valor, ',') + 1)), true);
        if ($bytes === false || $bytes === '' || strlen($bytes) > self::MAX_BYTES) {
            return null;
        }

        // El tipo real sale del contenido, no de lo que declare el cliente.
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);

        return isset(self::TIPOS[$mime]) ? ['bytes' => $bytes, 'ext' => self::TIPOS[$mime]] : null;
    }
}
