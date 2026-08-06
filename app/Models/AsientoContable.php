<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AsientoContable extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'asientos_contables';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'numero_asiento',
        'fecha',
        'glosa',
        'origen_type',
        'origen_id',
        'tasa_cambio',
        'estado',
        'created_by',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'tasa_cambio' => 'float',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function origen(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function apuntes(): HasMany
    {
        return $this->hasMany(ApunteContable::class, 'asiento_id');
    }
}
