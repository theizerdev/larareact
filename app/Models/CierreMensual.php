<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CierreMensual extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'cierres_mensuales';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'year',
        'month',
        'fecha_cierre',
        'total_ingresos',
        'total_egresos',
        'saldo_neto',
        'fondo_siguiente_mes',
        'retiro_utilidad',
        'status',
        'notas',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'fecha_cierre' => 'datetime',
        'total_ingresos' => 'float',
        'total_egresos' => 'float',
        'saldo_neto' => 'float',
        'fondo_siguiente_mes' => 'float',
        'retiro_utilidad' => 'float',
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
}
