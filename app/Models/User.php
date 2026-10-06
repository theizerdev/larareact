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

#[Fillable(['name', 'username', 'status', 'email', 'password', 'telefono', 'pais_telefono_id', 'empresa_id', 'sucursal_id', 'layout_settings'])]
#[Hidden(['password', 'remember_token', 'whatsapp_otp', 'two_factor_secret', 'two_factor_recovery_codes'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, HasSpanishActivityLog, LogsActivity, Multitenantable, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Empresa que el Super Administrador eligió en el selector. Sólo vive en
     * memoria durante la petición (ver EmpresaActiva): mientras está puesta,
     * empresa_id apunta a ella y el scope Multitenantable filtra como si fuera
     * un usuario normal de esa empresa. Nunca se guarda en la base.
     */
    public ?Empresa $empresaActiva = null;

    /** @var array{empresa_id: int|null, sucursal_id: int|null} */
    private array $tenantReal = ['empresa_id' => null, 'sucursal_id' => null];

    protected static function booted(): void
    {
        // Si alguien guarda al usuario mientras tiene una empresa prestada,
        // se persisten sus valores reales y luego se vuelve a prestar.
        static::saving(function (User $user) {
            if ($user->empresaActiva) {
                $user->empresa_id = $user->tenantReal['empresa_id'];
                $user->sucursal_id = $user->tenantReal['sucursal_id'];
            }
        });

        static::saved(function (User $user) {
            if ($user->empresaActiva) {
                $user->entrarAEmpresa($user->empresaActiva);
            }
        });
    }

    public function entrarAEmpresa(Empresa $empresa): void
    {
        if (! $this->empresaActiva) {
            $this->tenantReal = [
                'empresa_id' => $this->getAttribute('empresa_id'),
                'sucursal_id' => $this->getAttribute('sucursal_id'),
            ];
        }

        // Sucursal para los formularios que la piden: la suya si es de esa
        // empresa, si no la primera. El scope no filtra por sucursal al
        // superadmin, así que sigue viendo todas las de la empresa.
        $sucursal = Sucursal::withoutTenant()->where('empresa_id', $empresa->id)
            ->orderByRaw('id = ? desc', [$this->tenantReal['sucursal_id']])
            ->orderBy('id')->first();

        $this->empresaActiva = $empresa;
        $this->empresa_id = $empresa->id;
        $this->sucursal_id = $sucursal?->id;
        $this->setRelation('empresa', $empresa);
        $this->setRelation('sucursal', $sucursal);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'username', 'status', 'email', 'telefono', 'empresa_id', 'sucursal_id'])
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

