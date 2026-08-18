<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Paciente extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity, Multitenantable, SoftDeletes;

    protected $table = 'pacientes';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['codigo_paciente', 'tipo_paciente', 'nombres', 'apellidos', 'nombre_mascota', 'tutor_nombre', 'status'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'codigo_paciente',
        'tipo_paciente',
        'nombres',
        'apellidos',
        'documento_identidad',
        'fecha_nacimiento',
        'genero',
        'pais_telefono_id',
        'telefono',
        'email',
        'direccion',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'tipo_sangre',
        'alergias',
        'antecedentes_medicos',
        'foto',
        'nombre_mascota',
        'especie',
        'raza',
        'color_marcas',
        'microchip',
        'esterilizado',
        'tutor_nombre',
        'tutor_documento',
        'pais_telefono_tutor_id',
        'tutor_telefono',
        'tutor_email',
        'status',
    ];

    protected $appends = [
        'nombre_completo',
        'edad',
        'telefono_whatsapp',
        'telefono_tutor_whatsapp',
    ];

    protected function casts(): array
    {
        return [
            'fecha_nacimiento' => 'date',
            'esterilizado' => 'boolean',
            'status' => 'boolean',
        ];
    }

    /**
     * Nombre completo visible para humanos o mascotas.
     */
    public function getNombreCompletoAttribute(): string
    {
        if ($this->tipo_paciente === 'animal') {
            return $this->nombre_mascota ? "{$this->nombre_mascota} ({$this->especie})" : 'Mascota sin nombre';
        }

        return trim("{$this->nombres} {$this->apellidos}");
    }

    /**
     * Cálculo dinámico de edad en años/meses.
     */
    public function getEdadAttribute(): ?string
    {
        if (! $this->fecha_nacimiento) {
            return null;
        }

        $nacimiento = Carbon::parse($this->fecha_nacimiento);
        $ahora = Carbon::now();

        $anios = (int) $nacimiento->diffInYears($ahora);
        if ($anios >= 1) {
            return "{$anios} " . ($anios === 1 ? 'año' : 'años');
        }

        $meses = (int) $nacimiento->diffInMonths($ahora);

        return "{$meses} " . ($meses === 1 ? 'mes' : 'meses');
    }

    public function getTelefonoWhatsappAttribute(): ?string
    {
        if (! $this->telefono) {
            return null;
        }
        $cleanPhone = preg_replace('/\D/', '', $this->telefono);
        $prefijo = $this->paisTelefono?->codigo_telefonico
            ? preg_replace('/\D/', '', $this->paisTelefono->codigo_telefonico)
            : '';

        return $prefijo ? "{$prefijo}{$cleanPhone}" : $cleanPhone;
    }

    public function getTelefonoTutorWhatsappAttribute(): ?string
    {
        if (! $this->tutor_telefono) {
            return null;
        }
        $cleanPhone = preg_replace('/\D/', '', $this->tutor_telefono);
        $prefijo = $this->paisTelefonoTutor?->codigo_telefonico
            ? preg_replace('/\D/', '', $this->paisTelefonoTutor->codigo_telefonico)
            : '';

        return $prefijo ? "{$prefijo}{$cleanPhone}" : $cleanPhone;
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function paisTelefonoTutor(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_tutor_id');
    }

    public function getDocumentoAttribute()
    {
        return $this->documento_identidad ?: $this->codigo_paciente;
    }

    public function getCedulaAttribute()
    {
        return $this->documento_identidad ?: $this->codigo_paciente;
    }
}
