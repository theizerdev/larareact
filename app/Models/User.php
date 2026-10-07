<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\Multitenantable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\PasskeyAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property string $status
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property string|null $telefono
 * @property int|null $empresa_id
 * @property int|null $sucursal_id
 * @property string|null $whatsapp_otp
 * @property Carbon|null $phone_verified_at
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 */
use App\Traits\HasSpanishActivityLog;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[Fillable(['name', 'username', 'status', 'email', 'password', 'password_changed_at', 'failed_login_attempts', 'locked_until', 'telefono', 'pais_telefono_id', 'empresa_id', 'sucursal_id', 'layout_settings'])]
#[Hidden(['password', 'remember_token', 'whatsapp_otp', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, HasSpanishActivityLog, LogsActivity, Multitenantable, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'username', 'status', 'email', 'telefono', 'empresa_id', 'sucursal_id', 'failed_login_attempts', 'locked_until'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Check if user is a Super Administrator.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasAnyRole(['Super Administrador', 'super-admin', 'Super Admin', 'super_admin']);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'password' => 'hashed',
            'password_changed_at' => 'datetime',
            'locked_until' => 'datetime',
            'failed_login_attempts' => 'integer',
            'layout_settings' => 'array',
        ];
    }

    public function passwordHistories()
    {
        return $this->hasMany(PasswordHistory::class);
    }

    /**
     * Check if account is currently locked out by SOX policy.
     */
    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    /**
     * Minutes remaining until account is unlocked.
     */
    public function lockoutRemainingMinutes(): int
    {
        if (!$this->isLocked()) {
            return 0;
        }

        return max(1, (int) ceil(now()->diffInSeconds($this->locked_until) / 60));
    }

    /**
     * Unlock user account and reset failed attempts.
     */
    public function unlock(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Check if password has exceeded SOX expiration policy (default 90 days).
     */
    public function isPasswordExpired(?int $customDays = null): bool
    {
        $daysLimit = $customDays ?? ConfiguracionSox::current($this->empresa_id)->password_expires_days;

        if (!$this->password_changed_at) {
            return true;
        }

        return $this->password_changed_at->diffInDays(now()) >= $daysLimit;
    }

    /**
     * Days remaining until password expires.
     */
    public function daysUntilPasswordExpires(?int $customDays = null): int
    {
        $daysLimit = $customDays ?? ConfiguracionSox::current($this->empresa_id)->password_expires_days;

        if (!$this->password_changed_at) {
            return 0;
        }

        $elapsed = $this->password_changed_at->diffInDays(now());
        return max(0, $daysLimit - (int) $elapsed);
    }

    /**
     * Record new password in history and update password_changed_at.
     */
    public function recordPasswordHistory(string $newPasswordHash): void
    {
        $this->passwordHistories()->create([
            'password_hash' => $newPasswordHash,
            'created_at' => now(),
        ]);

        $this->update([
            'password_changed_at' => now(),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function paisTelefono()
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }
}

