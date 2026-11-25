<?php

namespace App\Models;

use App\Traits\Multitenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmpleadoEnrolamientoCedula extends Model
{
    use Multitenantable;

    protected $table = 'empleado_enrolamiento_cedulas';

    public const ESTADO_EN_PROCESO = 'en_proceso';
    public const ESTADO_COMPLETADO = 'completado';
    public const ESTADO_RECHAZADO = 'rechazado';

    protected $fillable = [
        'uuid',
        'empresa_id',
        'sucursal_id',
        'empleado_id',
        'user_id',
        'origen',
        'estado',
        'no_empleado',
        'codigo_legacy',
        'nombre_completo',
        'area_departamento',
        'puesto_cargo',
        'correo',
        'aviso_privacidad_aceptado_en',
        'enrolado_en',
        'ip_address',
        'user_agent',
        'latitud',
        'longitud',
        'foto_1_path',
        'foto_2_path',
        'foto_1_hash',
        'foto_2_hash',
        'sello_digital',
        'sello_payload',
        'pdf_path',
    ];

    protected function casts(): array
    {
        return [
            'aviso_privacidad_aceptado_en' => 'datetime',
            'enrolado_en' => 'datetime',
            'latitud' => 'float',
            'longitud' => 'float',
            'sello_payload' => 'array',
        ];
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(EmpleadoEnrolamientoLog::class, 'cedula_id')
            ->orderBy('ocurrido_en')
            ->orderBy('id');
    }

    public function getPdfUrlAttribute(): ?string
    {
        if (blank($this->pdf_path)) {
            return null;
        }

        return asset('storage/' . preg_replace('#^/?(storage/)+#', '', ltrim($this->pdf_path, '/')));
    }

    /**
     * Verifica la integridad criptográfica del sello digital usando el payload almacenado.
     */
    public function verificarIntegridad(): bool
    {
        if (blank($this->sello_digital) || ! is_array($this->sello_payload)) {
            return false;
        }

        $calculado = hash_hmac(
            'sha256',
            json_encode($this->sello_payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            (string) config('app.key'),
        );

        return hash_equals($this->sello_digital, $calculado);
    }
}
