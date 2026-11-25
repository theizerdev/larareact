<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use App\Models\EmpleadoUbicacion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Ubicación del colaborador cada 15 minutos (o el intervalo que tenga en el
 * web), sólo durante su jornada: de su
 * entrada a su salida. La app deja de enviar al checar la salida, pero el
 * servidor también lo valida punto por punto, así que un teléfono con la
 * hora mal o una app vieja no deja rastro fuera de la jornada.
 */
class UbicacionJornadaService
{
    /** Cada cuánto toma la app un punto si el colaborador no tiene otro intervalo. */
    public const INTERVALO_MINUTOS = 15;

    /**
     * Una entrada sin salida deja de contar como jornada abierta pasado este
     * tiempo (olvidó checar la salida): mismo criterio que los pares de SAP TT.
     */
    public const MAX_JORNADA_HORAS = 16;

    /** Puntos por envío: la app junta los que no pudo mandar sin conexión. */
    public const MAX_PUNTOS = 200;

    /**
     * Token propio de la ubicación. La app cierra la sesión tras cada marcaje
     * y cada inicio de sesión borra los tokens `movil_app`, así que el
     * monitoreo no puede depender de esos: éste sobrevive a ambos, sólo
     * permite mandar la ubicación (RestringirTokenDeUbicacion) y caduca solo.
     */
    public const TOKEN = 'movil_ubicacion';

    public const HABILIDAD = 'ubicacion:jornada';

    /** Vigencia del token: la jornada más larga y un margen para vaciar la cola. */
    public const VIGENCIA_TOKEN_HORAS = self::MAX_JORNADA_HORAS + 4;

    /**
     * Token nuevo para el monitoreo de esta jornada; el de una jornada
     * anterior deja de servir.
     *
     * @return array{token: string, expira_en: Carbon}
     */
    public function emitirToken(User $user): array
    {
        $user->tokens()->where('name', self::TOKEN)->delete();
        $expira = Carbon::now()->addHours(self::VIGENCIA_TOKEN_HORAS);

        return [
            'token' => $user->createToken(self::TOKEN, [self::HABILIDAD], $expira)->plainTextToken,
            'expira_en' => $expira,
        ];
    }

    /**
     * Guarda los puntos que caen dentro de una jornada. Los repetidos (mismo
     * uuid_cliente) no se vuelven a guardar.
     *
     * @param  list<array{uuid_cliente: string, latitud: float|string, longitud: float|string, fecha_hora_dispositivo: string, precision_metros?: float|string|null, ubicacion_simulada?: bool|null}>  $puntos
     * @return array{guardados: int, duplicados: int, fuera_de_jornada: int}
     */
    public function registrar(Empleado $empleado, User $user, array $puntos): array
    {
        $ahora = Carbon::now();
        $limiteFuturo = $ahora->copy()->addSeconds(RegistroMarcajeService::TOLERANCIA_RELOJ_FUTURO_SEGUNDOS);
        $limitePasado = $ahora->copy()->subHours(RegistroMarcajeService::MAX_ANTIGUEDAD_COLA_HORAS);

        $conHora = collect($puntos)->map(fn (array $p) => $p + [
            'hora' => Carbon::parse($p['fecha_hora_dispositivo'])->setTimezone($ahora->getTimezone()),
        ]);

        $existentes = EmpleadoUbicacion::withoutTenant()
            ->whereIn('uuid_cliente', $conHora->pluck('uuid_cliente'))
            ->pluck('uuid_cliente')
            ->flip();

        $marcajes = $this->marcajesEntre(
            $empleado,
            $conHora->min('hora')?->copy()->subHours(self::MAX_JORNADA_HORAS) ?? $ahora,
            $conHora->max('hora') ?? $ahora,
        );

        $resultado = ['guardados' => 0, 'duplicados' => 0, 'fuera_de_jornada' => 0];

        foreach ($conHora->unique('uuid_cliente') as $p) {
            if ($existentes->has($p['uuid_cliente'])) {
                $resultado['duplicados']++;

                continue;
            }

            $entrada = $p['hora']->betweenIncluded($limitePasado, $limiteFuturo)
                ? $this->entradaDeJornada($marcajes, $p['hora'])
                : null;

            if (! $entrada) {
                $resultado['fuera_de_jornada']++;

                continue;
            }

            EmpleadoUbicacion::create([
                'empresa_id' => $empleado->empresa_id,
                'sucursal_id' => $empleado->sucursal_id,
                'empleado_id' => $empleado->id,
                'user_id' => $user->id,
                'asistencia_marcaje_id' => $entrada->id,
                'latitud' => $p['latitud'],
                'longitud' => $p['longitud'],
                'precision_metros' => $p['precision_metros'] ?? null,
                'ubicacion_simulada' => (bool) ($p['ubicacion_simulada'] ?? false),
                'fecha_hora' => $p['hora'],
                'uuid_cliente' => $p['uuid_cliente'],
            ]);
            $resultado['guardados']++;
        }

        return $resultado;
    }

    /** Minutos entre puntos: el "Intervalo de geolocalización" del colaborador en el web. */
    public function intervaloMinutos(Empleado $empleado): int
    {
        return (int) ($empleado->intervalo_geolocalizacion_minutos ?: self::INTERVALO_MINUTOS);
    }

    /** ¿Tiene el colaborador una jornada abierta ahora? La app lo usa para seguir o detenerse. */
    public function jornadaAbierta(Empleado $empleado, ?Carbon $momento = null): bool
    {
        $momento ??= Carbon::now();

        return $this->entradaDeJornada(
            $this->marcajesEntre($empleado, $momento->copy()->subHours(self::MAX_JORNADA_HORAS), $momento),
            $momento,
        ) !== null;
    }

    /**
     * La entrada de la jornada en curso en `$momento`: la última entrada de
     * las últimas MAX_JORNADA_HORAS sin una salida después.
     *
     * @param  Collection<int, AsistenciaMarcaje>  $marcajes  ordenados por fecha_hora
     */
    private function entradaDeJornada(Collection $marcajes, Carbon $momento): ?AsistenciaMarcaje
    {
        $previos = $marcajes->filter(fn (AsistenciaMarcaje $m) => $m->fecha_hora->lessThanOrEqualTo($momento)
            && $m->fecha_hora->greaterThanOrEqualTo($momento->copy()->subHours(self::MAX_JORNADA_HORAS)));

        $entrada = $previos->last(fn (AsistenciaMarcaje $m) => $m->tipo_marcaje === 'entrada');

        if (! $entrada) {
            return null;
        }

        $cerrada = $previos->contains(fn (AsistenciaMarcaje $m) => $m->tipo_marcaje === 'salida'
            && $m->fecha_hora->greaterThan($entrada->fecha_hora));

        return $cerrada ? null : $entrada;
    }

    /** @return Collection<int, AsistenciaMarcaje> */
    private function marcajesEntre(Empleado $empleado, Carbon $desde, Carbon $hasta): Collection
    {
        return AsistenciaMarcaje::withoutTenant()
            ->where('empleado_id', $empleado->id)
            ->whereIn('tipo_marcaje', ['entrada', 'salida'])
            ->whereBetween('fecha_hora', [$desde, $hasta])
            ->orderBy('fecha_hora')
            ->orderBy('id')
            ->get(['id', 'tipo_marcaje', 'fecha_hora']);
    }
}
