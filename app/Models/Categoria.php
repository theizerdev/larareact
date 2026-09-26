<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'categorias';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'nombre',
        'slug',
        'icono',
        'descripcion',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($categoria) {
            if (empty($categoria->slug) && ! empty($categoria->nombre)) {
                $categoria->slug = \Illuminate\Support\Str::slug($categoria->nombre) ?: 'categoria-' . time();
            }
        });

        static::updating(function ($categoria) {
            if (empty($categoria->slug) && ! empty($categoria->nombre)) {
                $categoria->slug = \Illuminate\Support\Str::slug($categoria->nombre) ?: 'categoria-' . time();
            }
        });
    }

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

    public function servicios(): HasMany
    {
        return $this->hasMany(Servicio::class);
    }
}
