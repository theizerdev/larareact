<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;


class Medico extends Model
{
    use HasSpanishActivityLog, Multitenantable, SoftDeletes;

    protected $table = 'medicos';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'codigo_medico',
        'nombres',
        'apellidos',
        'documento_identidad',
        'licencia_medica',
        'tipo_licencia',
        'pais_telefono_id',
        'telefono',
        'email',
        'especialidad_principal_id',
        'color_agenda',
        'biografia',
        'foto',
        'status',
    ];

    protected $appends = [
        'nombre_completo',
        'titulo_licencia_internacional',
        'telefono_whatsapp',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
        ];
    }

    /**
     * Nombre completo con título profesional sugerido.
     */
    public function getNombreCompletoAttribute(): string
    {
        $nombres = trim("{$this->nombres} {$this->apellidos}");
        if (empty($nombres)) {
            return "Médico #{$this->id}";
        }

        return "Dr(a). {$nombres}";
    }

    /**
     * Obtiene el rótulo/etiqueta internacional adaptada según el país de la empresa.
     */
    public function getTituloLicenciaInternacionalAttribute(): string
    {
        if (! empty($this->tipo_licencia)) {
            return $this->tipo_licencia;
        }

        $paisIso = strtoupper($this->empresa?->pais?->codigo_iso2 ?? 'GENERIC');

        return match ($paisIso) {
            'MX' => 'Cédula Profesional / SEP',
            'CO' => 'Registro ReTHUS / Tarjeta Prof.',
            'AR' => 'Matrícula Nac. / Prov. (MN/MP)',
            'PE' => 'Colegiatura CMP / RNE',
            'CL' => 'Registro Superintendencia de Salud',
            'ES' => 'N° de Colegiado Médico (OMC)',
            'US' => 'NPI / State License',
            'EC' => 'Registro Senescyt / MSP',
            'VE' => 'N° Colegiatura / MPPS',
            default => 'N° Licencia / Colegiatura Médica',
        };
    }

    /**
     * Teléfono internacional formateado para WhatsApp.
     */
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

    public function especialidadPrincipal(): BelongsTo
    {
        return $this->belongsTo(Especialidad::class, 'especialidad_principal_id');
    }

    public function especialidades(): BelongsToMany
    {
        return $this->belongsToMany(Especialidad::class, 'medico_especialidad')
            ->withTimestamps();
    }

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function consultas(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ConsultaMedica::class, 'medico_id');
    }
}

