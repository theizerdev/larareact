<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Modelo extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $table = 'modelos';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'familia_id',
        'marca_id',
        'categoria_id',
        'nombre_comercial',
        'codigo_modelo',
        'imagen_url',
        'specs_overrides',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'specs_overrides' => 'array',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function familia(): BelongsTo
    {
        return $this->belongsTo(Familia::class);
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    /**
     * Combined specifications (family + model) with model overriding family.
     */
    public function getCombinedSpecsAttribute(): array
    {
        $familySpecs = $this->familia->specs_json ?? [];
        $modelSpecs = $this->specs_overrides ?? [];
        return array_merge($familySpecs, $modelSpecs);
    }

}
