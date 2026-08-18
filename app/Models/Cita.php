<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cita extends Model
{
    use HasFactory, SoftDeletes, Multitenantable, HasSpanishActivityLog;

    protected $table = 'citas';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'codigo_cita',
        'paciente_id',
        'medico_id',
        'especialidad_id',
        'tipo_atencion_id',
        'fecha_hora_inicio',
        'fecha_hora_fin',
        'duracion_minutos',
        'buffer_descanso_minutos',
        'estado',
        'motivo_consulta',
        'notas_recepcion',
        'link_virtual',
        'monto_estimado',
        'monto_pagado',
        'estado_pago',
        'fecha_confirmacion',
        'fecha_llegada_sala_espera',
        'fecha_inicio_consulta',
        'fecha_fin_consulta',
        'motivo_cancelacion',
        'cancelado_por_user_id',
        'recordatorio_whatsapp_enviado',
        'fecha_envio_recordatorio',
        'created_by',
    ];

    protected $casts = [
        'fecha_hora_inicio' => 'datetime',
        'fecha_hora_fin' => 'datetime',
        'fecha_confirmacion' => 'datetime',
        'fecha_llegada_sala_espera' => 'datetime',
        'fecha_inicio_consulta' => 'datetime',
        'fecha_fin_consulta' => 'datetime',
        'fecha_envio_recordatorio' => 'datetime',
        'duracion_minutos' => 'integer',
        'buffer_descanso_minutos' => 'integer',
        'monto_estimado' => 'decimal:2',
        'monto_pagado' => 'decimal:2',
        'recordatorio_whatsapp_enviado' => 'boolean',
    ];

    protected $appends = ['color_estado', 'estado_formateado'];

    protected static function booted(): void
    {
        static::creating(function ($cita) {
            if (empty($cita->codigo_cita)) {
                $year = date('Y');
                $count = static::where('empresa_id', $cita->empresa_id)
                    ->whereYear('created_at', $year)
                    ->withTrashed()
                    ->count() + 1;

                $cita->codigo_cita = sprintf('CIT-%s-%04d', $year, $count);
            }
        });
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getColorEstadoAttribute(): string
    {
        return match ($this->estado) {
            'confirmada_pagada' => '#10b981', // 🟢 Verde: Confirmada y pagada
            'pendiente'         => '#eab308', // 🟡 Amarillo: Pendiente por confirmar/pago
            'en_sala_espera'    => '#3b82f6', // 🔵 Azul: Paciente en recepción/sala de espera
            'en_consulta'       => '#8b5cf6', // 🟣 Morado: Paciente en consulta con médico
            'atendida'          => '#f97316', // 🟠 Naranja: Atención finalizada
            'cancelada'         => '#ef4444', // 🔴 Rojo: Cancelada
            'no_asistio', 'bloqueado' => '#64748b', // ⚪ Gris: Inasistencia o Bloqueado
            default             => '#3b82f6',
        };
    }

    public function getEstadoFormateadoAttribute(): string
    {
        return match ($this->estado) {
            'confirmada_pagada' => 'Confirmada / Pagada',
            'pendiente'         => 'Pendiente por Confirmar',
            'en_sala_espera'    => 'En Sala de Espera',
            'en_consulta'       => 'En Consulta Médica',
            'atendida'          => 'Atendida / Finalizada',
            'cancelada'         => 'Cancelada',
            'no_asistio'        => 'No Asistió',
            'bloqueado'         => 'Horario Bloqueado',
            default             => ucfirst($this->estado),
        };
    }

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function paciente()
    {
        return $this->belongsTo(Paciente::class, 'paciente_id');
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'medico_id');
    }

    public function especialidad()
    {
        return $this->belongsTo(Especialidad::class, 'especialidad_id');
    }

    public function tipoAtencion()
    {
        return $this->belongsTo(TipoAtencion::class, 'tipo_atencion_id');
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canceladoPor()
    {
        return $this->belongsTo(User::class, 'cancelado_por_user_id');
    }

    public function preconsulta()
    {
        return $this->hasOne(CitaPreconsulta::class, 'cita_id');
    }

    public function consulta()
    {
        return $this->hasOne(ConsultaMedica::class, 'cita_id');
    }
}


