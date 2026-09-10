<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Credito extends Model
{
    use HasSpanishActivityLog, LogsActivity, Multitenantable;

    protected $table = 'creditos';

    protected $fillable = [
        'codigo_credito',
        'empresa_id',
        'sucursal_id',
        'cliente_id',
        'inventario_equipo_id',
        'plan_financiamiento_id',
        'user_id',
        'fecha_inicio',
        'precio_equipo',
        'monto_inicial',
        'metodo_pago_inicial',
        'referencia_pago_inicial',
        'monto_financiado',
        'porcentaje_interes',
        'interes_total',
        'total_credito',
        'saldo_pendiente',
        'estado',
        'contrato_url',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'precio_equipo' => 'decimal:2',
            'monto_inicial' => 'decimal:2',
            'monto_financiado' => 'decimal:2',
            'porcentaje_interes' => 'decimal:2',
            'interes_total' => 'decimal:2',
            'total_credito' => 'decimal:2',
            'saldo_pendiente' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['codigo_credito', 'cliente_id', 'total_credito', 'saldo_pendiente', 'estado'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function equipo(): BelongsTo
    {
        return $this->belongsTo(InventarioEquipo::class, 'inventario_equipo_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PlanFinanciamiento::class, 'plan_financiamiento_id');
    }

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(Cuota::class, 'credito_id')->orderBy('numero_cuota');
    }
}

