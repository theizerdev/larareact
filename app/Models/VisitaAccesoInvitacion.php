<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class VisitaAccesoInvitacion extends Model
{
    use HasFactory;

    protected $table = 'visita_acceso_invitaciones';

    protected $fillable = [
        'uuid',
        'codigo_invitacion',
        'tipo_acceso',
        'anfitrion_id',
        'anfitrion_user_id',
        'visitante_nombre',
        'visitante_nombres',
        'visitante_apellidos',
        'visitante_documento',
        'foto_carnet',
        'doc_foto_frontal',
        'doc_foto_trasera',
        'pais_telefono_id',
        'visitante_telefono',
        'visitante_empresa',
        'tipo_servicio_id',
        'empleado_id',
        'proveedor_id',
        'proveedor_empleado_id',
        'productor_id',
        'productor_empleado_id',
        'fecha_estimada',
        'hora_estimada',
        'medio_acceso',
        'vehiculo_placa',
        'vehiculo_marca',
        'vehiculo_modelo',
        'vehiculo_anio',
        'vehiculo_foto_frontal',
        'vehiculo_foto_trasera',
        'acompanantes',
        'datos_acceso_completados',
        'motivo_visita',
        'status',
        'empresa_id',
        'sucursal_id',
    ];

    protected $casts = [
        'acompanantes'             => 'array',
        'datos_acceso_completados' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->codigo_invitacion)) {
                $model->codigo_invitacion = static::generarCodigoInvitacion();
            }
        });
    }

    public static function generarCodigoInvitacion(): string
    {
        $ultimo = static::max('id') ?? 0;
        $num = 90000001 + $ultimo;
        return (string) $num;
    }

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

    public function tipoServicio(): BelongsTo
    {
        return $this->belongsTo(TipoServicio::class, 'tipo_servicio_id');
    }

    public function anfitrion(): BelongsTo
    {
        return $this->belongsTo(Responsable::class, 'anfitrion_id');
    }

    public function anfitrionUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'anfitrion_user_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function proveedorEmpleado(): BelongsTo
    {
        return $this->belongsTo(ProveedorEmpleado::class, 'proveedor_empleado_id');
    }

    public function productor(): BelongsTo
    {
        return $this->belongsTo(Productor::class, 'productor_id');
    }

    public function productorEmpleado(): BelongsTo
    {
        return $this->belongsTo(ProductorEmpleado::class, 'productor_empleado_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }
}
