<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empresa extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'empresas';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['razon_social', 'documento', 'status', 'telefono', 'email'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'pais_id',
        'razon_social',
        'nombre_comercial',
        'documento',
        'pais_telefono_id',
        'zona_horaria',
        'logo',
        'logo_mini',
        'direccion',
        'codigo_postal',
        'colonia',
        'ciudad',
        'estado',
        'latitud',
        'longitud',
        'representante_legal',
        'curp_representante_legal',
        'telefono',
        'email',
        'status',
        'api_key',
        'whatsapp_api_key',
        'whatsapp_api_url',
        'whatsapp_instance',
        'whatsapp_rate_limit',
        'whatsapp_active',
        'whatsapp_phone',
        'whatsapp_status',
        'whatsapp_last_connected',
        'mapbox_api_key',
        'mapbox_active',
        'google_maps_api_key',
        'google_maps_active',
        'control_acceso_base_url',
        'control_acceso_app_token',
        'control_acceso_user_token',
        'control_acceso_active',
        'jaak_api_key',
        'jaak_environment',
        'jaak_active',
        'biotime_base_url',
        'biotime_username',
        'biotime_password',
        'biotime_active',
        'biotime_auto_alta',
        'biotime_last_sync_at',
        'biotime_last_transaction_id',
        'contpaqi_periodicidad',
        'contpaqi_dia_inicio_semana',
    ];

    public const PERIODICIDAD_SEMANAL = 'semanal';

    public const PERIODICIDAD_QUINCENAL = 'quincenal';

    protected function casts(): array
    {
        return [
            // `float` (no `decimal:8`): el cast decimal serializa a string ("19.43260000"),
            // lo que rompe la aritmética del mapa en el frontend. `float` mantiene el
            // contrato numérico, igual que Proveedor/Productor.
            'latitud' => 'float',
            'longitud' => 'float',
            'status' => 'boolean',
            'whatsapp_active' => 'boolean',
            'whatsapp_rate_limit' => 'integer',
            'whatsapp_last_connected' => 'datetime',
            'mapbox_active' => 'boolean',
            'google_maps_active' => 'boolean',
            'control_acceso_active' => 'boolean',
            'jaak_api_key' => 'encrypted',
            'jaak_active' => 'boolean',
            'biotime_password' => 'encrypted',
            'biotime_active' => 'boolean',
            'biotime_auto_alta' => 'boolean',
            'biotime_last_sync_at' => 'datetime',
            'biotime_last_transaction_id' => 'integer',
            'contpaqi_dia_inicio_semana' => 'integer',
        ];
    }

    /**
     * Get the pais that this empresa belongs to.
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Calendario de nómina (CONTPAQi) */
    /* ------------------------------------------------------------------ */

    public function contpaqiPeriodicidad(): string
    {
        return $this->contpaqi_periodicidad ?: config('contpaqi.periodicidad', self::PERIODICIDAD_SEMANAL);
    }

    /** ISO-8601: 1 = lunes ... 7 = domingo. */
    public function contpaqiDiaInicioSemana(): int
    {
        $dia = (int) ($this->contpaqi_dia_inicio_semana ?: config('contpaqi.dia_inicio_semana', 1));

        return $dia >= 1 && $dia <= 7 ? $dia : 1;
    }

    /**
     * El período de nómina que toca cerrar: el último completo antes de hoy.
     *
     * La prenómina se arma cuando el período terminó, no a la mitad, así que
     * el default nunca incluye el día de hoy. Semanal: la semana pasada según
     * el día de corte. Quincenal: la quincena anterior, con la segunda del mes
     * corriendo del 16 al último día, que es como las cuenta CONTPAQi.
     *
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    public function contpaqiPeriodoAnterior(?CarbonImmutable $hoy = null): array
    {
        $hoy = ($hoy ?? CarbonImmutable::now())->startOfDay();

        if ($this->contpaqiPeriodicidad() === self::PERIODICIDAD_QUINCENAL) {
            if ($hoy->day > 15) {
                $desde = $hoy->startOfMonth();
                $hasta = $hoy->startOfMonth()->addDays(14);
            } else {
                $desde = $hoy->subMonthNoOverflow()->startOfMonth()->addDays(15);
                $hasta = $hoy->subMonthNoOverflow()->endOfMonth();
            }

            return [$desde->startOfDay(), $hasta->endOfDay()];
        }

        $desde = $hoy->subWeek()->startOfWeek($this->contpaqiDiaInicioSemana());

        return [$desde->startOfDay(), $desde->addDays(6)->endOfDay()];
    }
}
