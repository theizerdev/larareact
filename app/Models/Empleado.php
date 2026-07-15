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
                'cargo_id',
                'foto_empleado',
                'foto_documento',
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
        'foto_empleado',
        'foto_documento',
        'empresa_id',
        'sucursal_id',
        'user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
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

    /**
     * Get employee's full name.
     */
    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombres} {$this->apellidos}";
    }
}
