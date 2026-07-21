<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Marca extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'marcas';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'nombre',
        'slug',
        'logo_url',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function familias(): HasMany
    {
        return $this->hasMany(Familia::class);
    }

    public function modelos(): HasMany
    {
        return $this->hasMany(Modelo::class);
    }
}
