<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegister extends Model
{
    use HasFactory, Multitenantable, HasSpanishActivityLog;

    protected $fillable = [
        'empresa_id',
        'sucursal_id',
        'user_id',
        'opening_amount',
        'closing_amount',
        'counted_amount',
        'expected_amount',
        'difference',
        'opened_at',
        'closed_at',
        'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_amount' => 'float',
        'closing_amount' => 'float',
        'counted_amount' => 'float',
        'expected_amount' => 'float',
        'difference' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }

    /**
     * Obtiene la caja abierta activa para el usuario (o para la empresa y sucursal del usuario).
     */
    public static function getActiveRegister(?User $user = null): ?self
    {
        $user = $user ?? auth()->user();
        if (! $user) {
            return null;
        }

        return static::where('status', 'open')
            ->when($user->empresa_id, fn ($q) => $q->where('empresa_id', $user->empresa_id))
            ->when($user->sucursal_id, fn ($q) => $q->where('sucursal_id', $user->sucursal_id))
            ->orderByRaw('user_id = ? DESC', [$user->id])
            ->latest('opened_at')
            ->first();
    }

    /**
     * Verifica si existe una caja abierta para la empresa y sucursal del usuario.
     */
    public static function hasOpenRegister(?User $user = null): bool
    {
        return static::getActiveRegister($user) !== null;
    }
}
