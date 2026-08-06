<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ApunteContable extends Model
{
    use HasFactory;

    protected $table = 'apuntes_contables';

    protected $fillable = [
        'asiento_id',
        'cuenta_id',
        'tercero_type',
        'tercero_id',
        'debe',
        'haber',
        'debe_usd',
        'haber_usd',
        'referencia',
    ];

    protected $casts = [
        'debe' => 'float',
        'haber' => 'float',
        'debe_usd' => 'float',
        'haber_usd' => 'float',
    ];

    public function asiento(): BelongsTo
    {
        return $this->belongsTo(AsientoContable::class, 'asiento_id');
    }

    public function cuenta(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_id');
    }

    public function tercero(): MorphTo
    {
        return $this->morphTo();
    }
}
