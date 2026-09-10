<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Cliente extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'clientes';

    protected $fillable = [
        'empresa_id',
        'nombres',
        'apellidos',
        'tipo_documento',
        'numero_documento',
        'email',
        'telefono_principal',
        'telefono_secundario',
        'direccion',
        'ciudad',
        'latitud',
        'longitud',
        'empresa_trabajo',
        'cargo_trabajo',
        'ingreso_mensual',
        'dia_pago',
        'referencias_personales',
        'foto_documento',
        'foto_selfie_kyc',
        'limite_credito',
        'estado_crediticio',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'ingreso_mensual' => 'decimal:2',
            'limite_credito' => 'decimal:2',
            'latitud' => 'decimal:8',
            'longitud' => 'decimal:8',
            'referencias_personales' => 'array',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombres', 'apellidos', 'numero_documento', 'telefono_principal', 'estado_crediticio', 'limite_credito'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function creditos(): HasMany
    {
        return $this->hasMany(Credito::class, 'cliente_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellidos}");
    }

    public function getDocumentoIdentidadAttribute(): string
    {
        return "{$this->tipo_documento}-{$this->numero_documento}";
    }
}

