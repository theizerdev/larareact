<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Nomina extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'nominas';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'year',
        'month',
        'formato_pago',
        'periodo_inicio',
        'periodo_fin',
        'estado',
        'total_bruto',
        'total_bonos',
        'total_descuentos',
        'total_comision_reparaciones',
        'total_neto',
        'fecha_cierre',
        'notas',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'periodo_inicio' => 'date',
        'periodo_fin' => 'date',
        'total_bruto' => 'float',
        'total_bonos' => 'float',
        'total_descuentos' => 'float',
        'total_comision_reparaciones' => 'float',
        'total_neto' => 'float',
        'fecha_cierre' => 'datetime',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(NominaDetalle::class, 'nomina_id');
    }
}
