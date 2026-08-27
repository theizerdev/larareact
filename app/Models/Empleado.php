<?php

namespace App\Models;

use App\Traits\HasKycValidaciones;
use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Empleado extends Model
{
    use HasFactory, HasKycValidaciones, HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected static function booted()
    {
        static::creating(function ($empleado) {
            if (empty($empleado->codigo_acceso)) {
                $empleado->codigo_acceso = \App\Services\AccessCodeService::generate('empleado', $empleado->sucursal_id);
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'nombres',
                'apellidos',
                'documento_identidad',
                'codigo_acceso',
                'tarjeta_acceso_1',
                'tarjeta_acceso_2',
                'tarjeta_acceso_3',
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
        'codigo_acceso',
        'tarjeta_acceso_1',
        'tarjeta_acceso_2',
        'tarjeta_acceso_3',
        'curp',
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
        'salario_diario',
        'turno_laboral_id',
        'status',
        'kyc_estatus',
        'kyc_validado_en',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'jornada_laboral' => 'array',
            'salario_diario' => 'decimal:2',
            'kyc_validado_en' => 'datetime',
        ];
    }

    public function turnoLaboral(): BelongsTo
    {
        return $this->belongsTo(TurnoLaboral::class, 'turno_laboral_id');
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

    public function marcajes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AsistenciaMarcaje::class, 'empleado_id');
    }

    public function asistenciaMarcajes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AsistenciaMarcaje::class, 'empleado_id');
    }

    /**
     * Get employee's full name.
     */
    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
