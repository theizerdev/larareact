<?php

namespace App\Services;

use App\Models\BiotimeEmpleado;
use App\Models\Empleado;
use App\Models\Empresa;
use Illuminate\Support\Facades\Storage;

/**
 * Deja las fotos de Colaboradores en el formato que BioTime acepta como
 * bio-photo (la foto con la que los relojes de rostro con luz visible generan
 * la plantilla facial):
 *
 * - JPG, de hasta config('biotime.foto_max_kb') KB (25 KB en BioTime).
 * - Nombrada con el número de empleado de BioTime: 123.jpg.
 * - Sin metadatos y con la orientación EXIF ya aplicada (los relojes no la leen).
 *
 * La API REST documentada de BioTime no recibe fotos, así que el ZIP se carga
 * en BioTime › Dispositivo › Datos › Bio-Photo › Importar Bio-Photo.
 */
class BioTimeFotoService
{
    /** Lado menor (px) por debajo del cual ya no se reduce: el reloj no reconocería el rostro. */
    private const LADO_MINIMO = 200;

    /**
     * JPG listo para BioTime, o null si el archivo no es una imagen o no cabe
     * en el límite sin bajar de LADO_MINIMO.
     */
    public function preparar(string $binario): ?string
    {
        $original = @imagecreatefromstring($binario);
        if ($original === false) {
            return null;
        }

        $original = $this->orientar($original, $binario);
        $ancho = imagesx($original);
        $alto = imagesy($original);
        $maxBytes = max(1, (int) config('biotime.foto_max_kb', 25)) * 1024;
        $escala = min(1, max(1, (int) config('biotime.foto_max_lado', 640)) / max($ancho, $alto));

        while (min($ancho, $alto) * $escala >= self::LADO_MINIMO) {
            $lienzo = $this->redimensionar($original, (int) round($ancho * $escala), (int) round($alto * $escala));

            foreach ([85, 75, 65, 55, 45] as $calidad) {
                ob_start();
                imagejpeg($lienzo, null, $calidad);
                $jpg = (string) ob_get_clean();

                if (strlen($jpg) <= $maxBytes) {
                    return $jpg;
                }
            }

            $escala *= 0.85;
        }

        return null;
    }

    /**
     * Colaboradores vinculados cuya foto actual no ha salido en un ZIP: sin
     * exportar nunca o con una foto nueva (al subirla cambia la ruta).
     */
    public function pendientes(Empresa $empresa): int
    {
        return BiotimeEmpleado::query()
            ->join('empleados', 'empleados.id', '=', 'biotime_empleados.empleado_id')
            ->where('biotime_empleados.empresa_id', $empresa->id)
            ->whereNotNull('empleados.foto_empleado')
            ->where('empleados.foto_empleado', '<>', '')
            ->where(fn ($q) => $q->whereNull('biotime_empleados.foto_exportada')
                ->orWhereColumn('biotime_empleados.foto_exportada', '<>', 'empleados.foto_empleado'))
            ->count();
    }

    /**
     * ZIP con la bio-photo de cada colaborador vinculado a BioTime. Con
     * $soloPendientes sólo entran las fotos que no salieron en un ZIP anterior.
     * Las que entran quedan marcadas como exportadas.
     *
     * @return array{fotos: int, omitidos: array<int,string>}
     */
    public function exportarZip(Empresa $empresa, string $destino, bool $soloPendientes = false): array
    {
        $zip = new \ZipArchive();
        if ($zip->open($destino, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException("No se pudo crear el ZIP en {$destino}.");
        }

        $fotos = 0;
        $omitidos = [];
        /** @var array<int, string> $exportadas biotime_empleados.id => ruta de la foto que salió */
        $exportadas = [];

        $vinculos = BiotimeEmpleado::query()
            ->where('empresa_id', $empresa->id)
            ->whereNotNull('empleado_id')
            ->orderByRaw('CAST(emp_code AS UNSIGNED)')
            ->get(['id', 'emp_code', 'empleado_id', 'foto_exportada']);

        $empleados = Empleado::withoutTenant()
            ->whereIn('id', $vinculos->pluck('empleado_id'))
            ->get(['id', 'nombres', 'apellidos', 'foto_empleado'])
            ->keyBy('id');

        foreach ($vinculos as $vinculo) {
            $empleado = $empleados->get($vinculo->empleado_id);
            if ($empleado === null || blank($empleado->foto_empleado)) {
                continue;
            }

            if ($soloPendientes && $vinculo->foto_exportada === $empleado->foto_empleado) {
                continue;
            }

            $nombre = trim("{$vinculo->emp_code} {$empleado->nombres} {$empleado->apellidos}");
            $binario = $this->leer($empleado->foto_empleado);

            if ($binario === null) {
                $omitidos[] = "{$nombre}: no se encontró el archivo de la foto.";

                continue;
            }

            $jpg = $this->preparar($binario);
            if ($jpg === null) {
                $omitidos[] = "{$nombre}: la foto no es una imagen válida o es demasiado pequeña.";

                continue;
            }

            $zip->addFromString(trim((string) $vinculo->emp_code).'.jpg', $jpg);
            $exportadas[$vinculo->id] = $empleado->foto_empleado;
            $fotos++;
        }

        if ($fotos === 0) {
            // ZipArchive no escribe un ZIP vacío; se deja una nota para que la descarga no falle.
            $zip->addFromString('LEEME.txt', $soloPendientes
                ? "No hay fotos nuevas para BioTime desde el último ZIP.\n"
                : "No hay colaboradores vinculados a BioTime con foto.\n");
        }

        if (! $zip->close()) {
            throw new \RuntimeException("No se pudo escribir el ZIP en {$destino}.");
        }

        // Se marca hasta tener el ZIP escrito: si falla, las fotos siguen pendientes.
        $ahora = now();
        foreach ($exportadas as $id => $ruta) {
            BiotimeEmpleado::whereKey($id)->update(['foto_exportada' => $ruta, 'foto_exportada_at' => $ahora]);
        }

        return ['fotos' => $fotos, 'omitidos' => $omitidos];
    }

    /** Lee la foto guardada en el disco public ("/storage/empleados/x.jpg", "empleados/x.jpg"). */
    private function leer(string $ruta): ?string
    {
        if (str_starts_with($ruta, 'http://') || str_starts_with($ruta, 'https://')) {
            return null;
        }

        $relativa = preg_replace('#^/?storage/#', '', ltrim($ruta, '/'));
        $disco = Storage::disk('public');

        return $disco->exists($relativa) ? $disco->get($relativa) : null;
    }

    /** Aplica la orientación EXIF de las fotos tomadas con celular. */
    private function orientar(\GdImage $img, string $binario): \GdImage
    {
        if (! function_exists('exif_read_data') || ! str_starts_with($binario, "\xFF\xD8")) {
            return $img;
        }

        $exif = @exif_read_data('data://image/jpeg;base64,'.base64_encode($binario));
        $grados = match ((int) ($exif['Orientation'] ?? 1)) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        return $grados === 0 ? $img : (imagerotate($img, $grados, 0) ?: $img);
    }

    /** Copia sobre fondo blanco: un PNG con transparencia saldría negro en JPG. */
    private function redimensionar(\GdImage $img, int $ancho, int $alto): \GdImage
    {
        $lienzo = imagecreatetruecolor($ancho, $alto);
        imagefill($lienzo, 0, 0, imagecolorallocate($lienzo, 255, 255, 255));
        imagecopyresampled($lienzo, $img, 0, 0, 0, 0, $ancho, $alto, imagesx($img), imagesy($img));

        return $lienzo;
    }
}
