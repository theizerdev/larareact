<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionSox extends Model
{
    protected $table = 'configuraciones_sox';

    protected $fillable = [
        'empresa_id',
        'min_password_length',
        'password_history_limit',
        'password_expires_days',
        'max_failed_attempts',
        'lockout_minutes',
        'require_mixed_case',
        'require_numbers',
        'require_symbols',
        'require_uncompromised',
        'sso_azure_enabled',
        'azure_tenant_id',
        'azure_client_id',
        'azure_client_secret',
        'azure_redirect_uri',
    ];

    protected $casts = [
        'min_password_length' => 'integer',
        'password_history_limit' => 'integer',
        'password_expires_days' => 'integer',
        'max_failed_attempts' => 'integer',
        'lockout_minutes' => 'integer',
        'require_mixed_case' => 'boolean',
        'require_numbers' => 'boolean',
        'require_symbols' => 'boolean',
        'require_uncompromised' => 'boolean',
        'sso_azure_enabled' => 'boolean',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /**
     * Get or create active SOX configuration.
     */
    public static function current(?int $empresaId = null): self
    {
        $query = static::query();

        if ($empresaId) {
            $config = (clone $query)->where('empresa_id', $empresaId)->first();
            if ($config) {
                return $config;
            }
        }

        // Global fallback
        $config = $query->whereNull('empresa_id')->first();

        if (!$config) {
            $config = static::create([
                'empresa_id' => null,
                'min_password_length' => 15,
                'password_history_limit' => 8,
                'password_expires_days' => 90,
                'max_failed_attempts' => 5,
                'lockout_minutes' => 15,
                'require_mixed_case' => true,
                'require_numbers' => true,
                'require_symbols' => true,
                'require_uncompromised' => true,
                'sso_azure_enabled' => false,
            ]);
        }

        return $config;
    }
}
