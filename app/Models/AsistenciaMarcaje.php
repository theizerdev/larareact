<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class AsistenciaMarcaje extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'asistencia_marcajes';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'empleado_id',
                'tipo_marcaje',
                'fecha_hora',
                'origen',
                'fotografia_path',
                'observaciones',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'empleado_id',
        'tipo_marcaje',
        'fecha_hora',
        'origen',
        'fotografia_path',
        'latitud',
        'longitud',
        'dispositivo_id',
        'observaciones',
        'registrado_por_user_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha_hora' => 'datetime',
            'latitud' => 'decimal:7',
            'longitud' => 'decimal:7',
        ];
    }

    /**
     * Formatear fecha y hora respetando la zona horaria local de la empresa/sistema
     */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        $timezone = config('app.timezone', 'America/Mexico_City');
        return \Carbon\Carbon::instance($date)->timezone($timezone)->format('Y-m-d H:i:s');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por_user_id');
    }
}
