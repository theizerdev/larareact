<?php

namespace App\Services\Contpaqi;

use App\Models\Empleado;
use Illuminate\Support\Collection;

/**
 * Empareja un nombre tal como lo escribe CONTPAQi con un empleado de Shigoto.
 *
 * Los dos sistemas guardan el nombre distinto. CONTPAQi lo tiene en un solo
 * campo y en orden de apellidos primero ("LUQUE CASILLAS MA BEATRIZ"), mientras
 * que Shigoto lo tiene partido en `nombres` y `apellidos`. Además la captura de
 * pantalla del cliente trae los nombres cortados a media palabra.
 *
 * La regla de oro es que **ante la duda no se elige**. Un emparejamiento
 * equivocado le carga las horas extra a otra persona y el error se descubre
 * cuando la nómina ya se timbró, así que una coincidencia ambigua se reporta
 * como ambigua en vez de resolverse a la brava con la primera opción.
 */
class EmparejadorDeNombres
{
    /** Coincidencia exacta del nombre completo, en cualquiera de los dos órdenes. */
    public const EXACTA = 'exacta';

    /** El nombre de CONTPAQi venía cortado y es prefijo de un solo empleado. */
    public const PREFIJO = 'prefijo';

    /** El nombre encaja con más de un empleado: no se elige ninguno. */
    public const AMBIGUA = 'ambigua';

    /** Ningún empleado se parece. */
    public const SIN_COINCIDENCIA = 'sin_coincidencia';

    /**
     * @param  Collection<int, Empleado>  $empleados
     * @return array{estado: string, empleado: Empleado|null, candidatos: list<string>}
     */
    public function emparejar(string $nombreContpaqi, bool $truncado, Collection $empleados): array
    {
        $buscado = $this->normalizar($nombreContpaqi);

        if ($buscado === '') {
            return ['estado' => self::SIN_COINCIDENCIA, 'empleado' => null, 'candidatos' => []];
        }

        /*
         * Se prueban los dos órdenes porque no hay forma de saber cuál usó
         * quien dio de alta al empleado en CONTPAQi: unas nóminas van
         * "APELLIDOS NOMBRES" y otras al revés.
         */
        $exactas = $empleados->filter(function (Empleado $e) use ($buscado) {
            return in_array($buscado, $this->variantes($e), true);
        });

        if ($exactas->count() === 1) {
            return ['estado' => self::EXACTA, 'empleado' => $exactas->first(), 'candidatos' => []];
        }

        if ($exactas->count() > 1) {
            return [
                'estado' => self::AMBIGUA,
                'empleado' => null,
                'candidatos' => $exactas->map(fn (Empleado $e) => $e->nombre_completo)->values()->all(),
            ];
        }

        // El prefijo sólo se admite cuando el origen venía cortado. Aceptarlo
        // siempre haría que "PEREZ" cazara con cualquier Pérez de la empresa.
        if (! $truncado) {
            return ['estado' => self::SIN_COINCIDENCIA, 'empleado' => null, 'candidatos' => []];
        }

        $porPrefijo = $empleados->filter(function (Empleado $e) use ($buscado) {
            foreach ($this->variantes($e) as $variante) {
                if (str_starts_with($variante, $buscado)) {
                    return true;
                }
            }

            return false;
        });

        if ($porPrefijo->count() === 1) {
            return ['estado' => self::PREFIJO, 'empleado' => $porPrefijo->first(), 'candidatos' => []];
        }

        if ($porPrefijo->count() > 1) {
            return [
                'estado' => self::AMBIGUA,
                'empleado' => null,
                'candidatos' => $porPrefijo->map(fn (Empleado $e) => $e->nombre_completo)->values()->all(),
            ];
        }

        return ['estado' => self::SIN_COINCIDENCIA, 'empleado' => null, 'candidatos' => []];
    }

    /**
     * Las dos formas en que puede venir escrito el mismo empleado.
     *
     * @return list<string>
     */
    private function variantes(Empleado $empleado): array
    {
        return [
            $this->normalizar($empleado->apellidos.' '.$empleado->nombres),
            $this->normalizar($empleado->nombres.' '.$empleado->apellidos),
        ];
    }

    /**
     * Mayúsculas, sin acentos, sin puntuación y con un solo espacio entre
     * palabras.
     *
     * La eñe se conserva: en español distingue apellidos distintos —Nuño y
     * Nuno no son la misma familia— y perderla crearía ambigüedades donde no
     * las hay.
     */
    private function normalizar(string $valor): string
    {
        $valor = mb_strtoupper(trim($valor));

        $valor = strtr($valor, [
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U',
            'À' => 'A', 'È' => 'E', 'Ì' => 'I', 'Ò' => 'O', 'Ù' => 'U',
        ]);

        // Los puntos de las abreviaturas ("MA. GUADALUPE") sobran para comparar.
        $valor = str_replace(['.', ',', ';'], ' ', $valor);

        return trim((string) preg_replace('/\s+/u', ' ', $valor));
    }
}
