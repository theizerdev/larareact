<?php

namespace App\Services\PeopleSoft;

use App\Models\BiotimeMarcaje;
use App\Models\PeoplesoftEmpleadoMapeo;

/**
 * Traduce un marcaje de ZKTeco (fila de `biotime_marcajes`) a una fila del
 * layout TL_PUNCH_INTFC que espera la interfaz TCD de PeopleSoft Time and
 * Labor (operación de servicio PUNCHED_TIME_ADD).
 *
 * Es intencionalmente puro: no toca red ni base de datos. Así se puede probar
 * el mapeo completo hoy, sin tener un PeopleSoft enfrente, que es justo lo que
 * más caro sale de descubrir tarde.
 *
 * Referencia del layout: Oracle, "Objects Sent from the TCD" (PeopleSoft HCM
 * 9.2, Time and Labor). Los nombres y longitudes de campo salen de ahí.
 */
class PunchedTimeMapper
{
    /**
     * Tipos de punch de PeopleSoft (TL_PUNCH_INTFC.PUNCH_TYPE, Char 1).
     * Documentados por Oracle tanto en el registro TL_SCHEDULE como en la
     * página de errores TCD.
     */
    public const PUNCH_TYPES = [
        '1' => 'In',
        '2' => 'Out',
        '3' => 'Meal',
        '4' => 'Break',
        '5' => 'Transfer',
    ];

    /**
     * Formato de fecha/hora de las interfaces TCD:
     *   CCYY-MM-DDTHH:MM:SS.ssssss[+/-hhmm]
     * p.ej. 1999-09-14T16:47:56.793000-0700
     *
     * (El manual de Oracle escribe la máscara como "CCYY-DD-MM..." pero su
     * propio ejemplo es año-mes-día; manda el ejemplo.)
     */
    public const DTTM_FORMAT = 'Y-m-d\TH:i:s.uO';

    /**
     * @param  array<string,string>  $punchTypeMap  punch_state de ZKTeco => PUNCH_TYPE de PeopleSoft
     * @param  array<string,string>  $tcdIdPorDispositivo  nº de serie del reloj => TCD_ID
     */
    public function __construct(
        private readonly array $punchTypeMap,
        private readonly string $tcdIdDefault,
        private readonly array $tcdIdPorDispositivo = [],
        private readonly ?string $timezoneCode = null,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            punchTypeMap: (array) config('peoplesoft.punch_type_map', []),
            tcdIdDefault: (string) config('peoplesoft.tcd_id_default', ''),
            tcdIdPorDispositivo: (array) config('peoplesoft.tcd_id_por_dispositivo', []),
            timezoneCode: config('peoplesoft.timezone_code') ?: null,
        );
    }

    /**
     * Convierte un marcaje en una fila TL_PUNCH_INTFC.
     *
     * Devuelve el resultado en vez de lanzar excepción: un marcaje que no se
     * puede mapear no es un fallo del proceso, es una fila que se omite con su
     * motivo escrito para que alguien lo corrija.
     *
     * @return array{ok: bool, motivo: string|null, fila: array<string,mixed>|null}
     */
    public function map(BiotimeMarcaje $marcaje, ?PeoplesoftEmpleadoMapeo $mapeo): array
    {
        if (! $mapeo instanceof PeoplesoftEmpleadoMapeo) {
            return $this->rechazo("Sin equivalencia en PeopleSoft para el gafete/código «{$marcaje->emp_code}».");
        }

        if (! $mapeo->esUtilizable()) {
            return $this->rechazo($mapeo->activo
                ? "La equivalencia de «{$marcaje->emp_code}» no tiene BADGE_ID ni EMPLID."
                : "La equivalencia de «{$marcaje->emp_code}» está desactivada.");
        }

        // El modelo castea `punch_time` a datetime, así que aquí ya llega
        // como Carbon (o null si el marcaje viene incompleto).
        $punchTime = $marcaje->punch_time;

        if ($punchTime === null) {
            return $this->rechazo('El marcaje no trae fecha/hora.');
        }

        $punchType = $this->punchType($marcaje->punch_state);

        if ($punchType === null) {
            $etiqueta = $marcaje->punch_state_label ?: 'desconocido';

            return $this->rechazo("Tipo de marcaje «{$marcaje->punch_state}» ({$etiqueta}) sin equivalencia en PeopleSoft.");
        }

        $fila = [
            // Identidad. Se mandan los dos si se tienen: Time and Labor
            // traduce BADGE_ID a EMPLID, y con EMPLID ya resuelto se ahorra
            // ese paso y sus errores.
            'BADGE_ID' => $this->recortar($mapeo->badge_id, 20),
            'EMPLID' => $this->recortar($mapeo->emplid, 11),
            'EMPL_RCD' => (int) ($mapeo->empl_rcd ?? 0),

            // Contenido del punch.
            'PUNCH_DTTM' => $punchTime->format(self::DTTM_FORMAT),
            'PUNCH_TYPE' => $punchType,
            'TCD_ID' => $this->recortar($this->tcdId($marcaje->dispositivo_sn), 10),

            // 'A' = alta. El layout también admite borrado, pero PeopleSoft
            // borra el DÍA COMPLETO del empleado, no un punch suelto: por eso
            // aquí sólo se dan altas y la corrección de un día se hace con la
            // reposición completa (ver PeopleSoftExportService).
            'ADD_DELETE_IND' => 'A',
            'DELETE_DATE' => null,

            'ACTION_DTTM' => now()->format(self::DTTM_FORMAT),

            // Trazabilidad: deja el rastro del origen dentro del propio
            // registro de PeopleSoft (TL_COMMENTS es Char 254).
            'TL_COMMENTS' => $this->recortar($this->comentario($marcaje), 254),

            // Campo reservado por Oracle para su propio procesamiento: debe
            // ir siempre en blanco.
            'AUDIT_ACTN' => '',
        ];

        if ($this->timezoneCode !== null) {
            // TIMEZONE es Char(9) y usa los códigos propios de PeopleSoft
            // (tabla TIMEZONE), no los de IANA.
            $fila['TIMEZONE'] = $this->recortar($this->timezoneCode, 9);
        }

        return ['ok' => true, 'motivo' => null, 'fila' => $fila];
    }

    /**
     * punch_state de ZKTeco -> PUNCH_TYPE de PeopleSoft.
     * null = no hay equivalencia definida y el marcaje no debe salir.
     */
    public function punchType(int|string|null $punchState): ?string
    {
        if ($punchState === null || $punchState === '') {
            return null;
        }

        $destino = $this->punchTypeMap[(string) $punchState] ?? null;

        if ($destino === null) {
            return null;
        }

        $destino = (string) $destino;

        // Un mapa mal configurado no debe producir un punch inválido.
        return isset(self::PUNCH_TYPES[$destino]) ? $destino : null;
    }

    /**
     * TCD_ID del reloj que originó el marcaje, con caída al valor por defecto.
     */
    public function tcdId(?string $dispositivoSn): string
    {
        if ($dispositivoSn !== null && isset($this->tcdIdPorDispositivo[$dispositivoSn])) {
            return (string) $this->tcdIdPorDispositivo[$dispositivoSn];
        }

        return $this->tcdIdDefault;
    }

    private function comentario(BiotimeMarcaje $marcaje): string
    {
        $partes = array_filter([
            'Shigoto',
            $marcaje->dispositivo_alias ?: $marcaje->dispositivo_sn,
            $marcaje->verify_type_label,
            'ref:'.$marcaje->getKey(),
        ]);

        return implode(' | ', $partes);
    }

    /**
     * @return array{ok: bool, motivo: string, fila: null}
     */
    private function rechazo(string $motivo): array
    {
        return ['ok' => false, 'motivo' => $motivo, 'fila' => null];
    }

    private function recortar(?string $valor, int $largo): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        // Los campos de PeopleSoft son de longitud fija; mandar de más hace
        // que el mensaje entero se atore en el Service Operations Monitor.
        return mb_substr($valor, 0, $largo);
    }
}
