<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\Empleado;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Reglas compartidas por el kiosko web (RelojChecadorKioskoController) y la
 * app móvil (Api\KioskoApiController) al buscar empleados y registrar
 * marcajes. Antes cada controlador tenía su copia y las correcciones del
 * kiosko web (coincidencia exacta, doble toque, validación de la foto) no
 * llegaron a la app.
 */
class RegistroMarcajeService
{
    /** Un segundo envío del mismo marcaje dentro de esta ventana es un doble toque. */
    public const VENTANA_DUPLICADO_SEGUNDOS = 10;

    /** Tamaño máximo de la foto del marcaje ya decodificada. */
    public const FOTO_MAX_BYTES = 5 * 1024 * 1024;

    /**
     * Un marcaje que la app guardó sin conexión conserva la hora del teléfono
     * sólo si llega dentro de este plazo. Más tarde se registra con la hora de
     * recepción y queda anotado: el reloj del teléfono lo controla el
     * trabajador, así que no se acepta cualquier hora.
     */
    public const MAX_ANTIGUEDAD_COLA_HORAS = 24;

    /** Margen para teléfonos con el reloj ligeramente adelantado. */
    public const TOLERANCIA_RELOJ_FUTURO_SEGUNDOS = 120;

    /** `ubicacion_estado` que manda la app; la etiqueta es null cuando sí hubo ubicación. */
    public const ESTADOS_UBICACION = [
        'ok' => null,
        'gpsApagado' => 'GPS apagado',
        'permisoDenegado' => 'permiso de ubicación negado',
        'permisoDenegadoSiempre' => 'permiso de ubicación bloqueado',
        'sinSenal' => 'sin señal de GPS',
    ];

    /** Marcaje ya registrado con el mismo identificador de la app (reenvío). */
    public function porUuidCliente(Empleado $empleado, ?string $uuid): ?AsistenciaMarcaje
    {
        if (blank($uuid)) {
            return null;
        }

        return AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->where('uuid_cliente', $uuid)
            ->first();
    }

    /**
     * Hora con que se registra un marcaje de la app y, si no se pudo respetar
     * la del teléfono, la nota que lo explica.
     *
     * En línea manda el servidor. Desde la cola sin conexión se usa la hora en
     * que la persona marcó, si es creíble (ni futura ni más vieja que
     * MAX_ANTIGUEDAD_COLA_HORAS).
     *
     * @return array{0: Carbon, 1: ?string}
     */
    public function horaDeMarcaje(?string $fechaHoraDispositivo, bool $desdeCola): array
    {
        $ahora = Carbon::now();

        if (! $desdeCola || blank($fechaHoraDispositivo)) {
            return [$ahora, null];
        }

        $dispositivo = Carbon::parse($fechaHoraDispositivo)->setTimezone($ahora->getTimezone());
        $limiteFuturo = $ahora->copy()->addSeconds(self::TOLERANCIA_RELOJ_FUTURO_SEGUNDOS);
        $limitePasado = $ahora->copy()->subHours(self::MAX_ANTIGUEDAD_COLA_HORAS);

        if ($dispositivo->greaterThan($limiteFuturo) || $dispositivo->lessThan($limitePasado)) {
            return [$ahora, 'Enviado sin conexión: la hora del teléfono ('.$dispositivo->format('d/m/Y H:i')
                .') está fuera de rango; se usó la hora de recepción.'];
        }

        return [$dispositivo, null];
    }

    /**
     * Agrega notas de revisión a las observaciones sin pasar del límite de la
     * columna (255).
     */
    public function anotarObservaciones(?string $observaciones, array $notas): ?string
    {
        $partes = array_values(array_filter([$observaciones, ...$notas], fn ($p) => filled($p)));

        return $partes ? mb_substr(implode(' - ', $partes), 0, 255) : null;
    }

    /**
     * Busca un empleado activo por código de acceso, documento, CURP, teléfono
     * o id. Una coincidencia exacta gana a una parcial (LIKE '%123'): antes
     * `first()` devolvía el de menor id aunque sólo coincidiera por sufijo.
     */
    public function buscarEmpleado(string $entrada, ?int $empresaId): ?Empleado
    {
        $query = trim($entrada);
        $cleanQuery = preg_replace('/[^a-zA-Z0-9]/', '', $query);
        $isNumeric = ctype_digit($cleanQuery);
        $intVal = $isNumeric ? (int) $cleanQuery : null;
        $padded8 = $isNumeric ? sprintf('%08d', $intVal) : null;
        $padded6 = $isNumeric ? sprintf('%06d', $intVal) : null;

        return Empleado::with(['turnoLaboral', 'departamento', 'cargo'])
            ->where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where(function ($q) use ($query, $cleanQuery, $isNumeric, $intVal, $padded8, $padded6) {
                $q->where('codigo_acceso', $query)
                    ->orWhere('codigo_acceso', $cleanQuery)
                    ->orWhere('documento_identidad', $query)
                    ->orWhere('documento_identidad', $cleanQuery)
                    ->orWhere('curp', $query)
                    ->orWhere('telefono', $query)
                    ->orWhere('id', $query);

                if ($isNumeric && $intVal > 0) {
                    $q->orWhere('codigo_acceso', $padded8)
                        ->orWhere('documento_identidad', $padded6)
                        ->orWhere('codigo_acceso', (string) $intVal)
                        ->orWhere('documento_identidad', (string) $intVal)
                        ->orWhere('codigo_acceso', 'like', "%{$cleanQuery}");
                }
            })
            ->orderByRaw(
                'CASE
                    WHEN codigo_acceso = ? OR codigo_acceso = ? OR documento_identidad = ? OR documento_identidad = ? OR curp = ? OR telefono = ? THEN 0
                    WHEN codigo_acceso = ? OR documento_identidad = ? OR codigo_acceso = ? OR documento_identidad = ? THEN 1
                    WHEN id = ? THEN 2
                    ELSE 3
                END',
                [
                    $query, $cleanQuery, $query, $cleanQuery, $query, $query,
                    $padded8, $padded6, $isNumeric ? (string) $intVal : null, $isNumeric ? (string) $intVal : null,
                    $query,
                ]
            )
            ->orderBy('id')
            ->first();
    }

    /**
     * Doble toque / reintento: el mismo tipo de marcaje del mismo empleado
     * registrado hace segundos. Quien llama responde con él en lugar de crear
     * otro (ni recalcular horas ni reenviar el WhatsApp).
     */
    public function duplicadoReciente(Empleado $empleado, string $tipoMarcaje): ?AsistenciaMarcaje
    {
        return AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->where('tipo_marcaje', $tipoMarcaje)
            ->where('created_at', '>=', now()->subSeconds(self::VENTANA_DUPLICADO_SEGUNDOS))
            ->latest('id')
            ->first();
    }

    /**
     * Guarda la foto del marcaje (base64, con o sin prefijo data URI) sólo si
     * realmente es una imagen y no es desmedida. Nombre impredecible: el
     * anterior time()_id colisionaba y era adivinable.
     *
     * @return string|null ruta en el disco public, o null si no se guardó
     */
    public function guardarFoto(?string $base64, int $empleadoId): ?string
    {
        if (blank($base64)) {
            return null;
        }

        $image = preg_replace('#^data:image/(png|jpe?g);base64,#i', '', $base64);
        $image = str_replace(' ', '+', $image);
        $binary = base64_decode($image, true);

        if ($binary === false || strlen($binary) > self::FOTO_MAX_BYTES || @getimagesizefromstring($binary) === false) {
            return null;
        }

        $ruta = 'marcajes/'.time()."_{$empleadoId}_".Str::random(10).'.jpg';
        Storage::disk('public')->put($ruta, $binary);

        return $ruta;
    }

    /**
     * Envía el WhatsApp del marcaje en la cola. Antes salía dentro de la
     * petición: con la pasarela lenta o caída el kiosko quedaba esperando
     * hasta el timeout HTTP (30 s) y el reintento del usuario duplicaba.
     * notificarMarcaje() captura sus errores, así que el job no se reintenta
     * ni duplica el mensaje.
     */
    public function notificarEnCola(Empleado $empleado, AsistenciaMarcaje $marcaje): void
    {
        dispatch(static fn () => app(NotificacionAsistenciaWhatsAppService::class)->notificarMarcaje($empleado, $marcaje));
    }
}
