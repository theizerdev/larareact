<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TipoServicio extends Model
{
    use HasFactory, Multitenantable;

    /** Catálogo de toda la empresa: el scope no lo limita a la sucursal del usuario. */
    public const TENANT_SOLO_EMPRESA = true;

    protected $table = 'tipo_servicios';

    protected $fillable = [
        'nombre',
        'empresa_id',
        'sucursal_id',
        'user_id',
        'status',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
