<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesGoal extends Model
{
    use HasFactory, Multitenantable;

    protected $table = 'sales_goals';

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'year',
        'month',
        'base_sales',
        'increment_percentage',
        'target_amount',
        'notes',
    ];

    protected $casts = [
        'year' => 'integer',
        'month' => 'integer',
        'base_sales' => 'float',
        'increment_percentage' => 'float',
        'target_amount' => 'float',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
