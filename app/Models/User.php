<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\HasSpanishActivityLog;
use App\Traits\HasGroupRoles;
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
#[Fillable(['name', 'username', 'status', 'email', 'password', 'telefono', 'pais_telefono_id', 'empresa_id', 'sucursal_id', 'layout_settings', 'whatsapp_otp_code', 'whatsapp_otp_expires_at', 'whatsapp_verified_at'])]
#[Hidden(['password', 'remember_token', 'whatsapp_otp', 'whatsapp_otp_code', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, HasGroupRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable, HasSpanishActivityLog {
        HasRoles::hasRole as spatieHasRole;
        HasRoles::hasAnyRole insteadof HasGroupRoles;
        HasRoles::hasAllRoles insteadof HasGroupRoles;
        HasRoles::hasPermissionTo as spatieHasPermissionTo;
        HasGroupRoles::hasPermissionTo insteadof HasRoles;
        HasGroupRoles::hasAnyPermission insteadof HasRoles;
        HasGroupRoles::hasAllPermissions insteadof HasRoles;
    }

    /**
     * Safe hasRole method that supports multi-tenancy and prevents RoleDoesNotExist exceptions.
     */
    public function hasRole($roles, ?string $guard = null): bool
    {
        if (is_string($roles) && in_array($roles, ['Super Administrador', 'super-admin', 'Super Admin'])) {
            return $this->id === 1 || \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $this->id)
                ->whereIn('roles.name', ['Super Administrador', 'super-admin', 'Super Admin'])
                ->exists();
        }

        try {
            return $this->spatieHasRole($roles, $guard);
        } catch (\Spatie\Permission\Exceptions\RoleDoesNotExist $e) {
            return false;
        }
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Administrador');
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
            'layout_settings' => 'array',
        ];
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
