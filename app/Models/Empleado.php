<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empleado extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'nombres',
                'apellidos',
                'documento_identidad',
                'telefono',
                'correo',
                'genero',
                'departamento_id',
                'responsable_id',
                'jornada_laboral',
                'foto_empleado',
                'foto_empleado_2',
                'foto_documento',
                'foto_documento_reverso',
                'motivo_registro',
                'status'
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'nombres',
        'apellidos',
        'documento_identidad',
        'pais_telefono_id',
        'telefono',
        'correo',
        'genero',
        'departamento_id',
        'responsable_id',
        'cargo_id',
        'motivo_registro',
        'jornada_laboral',
        'foto_empleado',
        'foto_empleado_2',
        'foto_documento',
        'foto_documento_reverso',
        'empresa_id',
        'sucursal_id',
        'user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'jornada_laboral' => 'array',
        ];
    }

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class);
    }

    public function cargo(): BelongsTo
    {
        return $this->belongsTo(Cargo::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vehiculos()
    {
        return $this->hasMany(EmpleadoVehiculo::class, 'empleado_id');
    }

    /**
     * Get employee's full name.
     */
    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
