<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class VisitaAcceso extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity;

    protected $table = 'visitas_accesos';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'codigo_visitante',
                'tipo_acceso',
                'empleado_id',
                'proveedor_id',
                'proveedor_empleado_id',
                'medio_acceso',
                'fecha_ingreso',
                'hora_ingreso',
                'fecha_salida',
                'hora_salida',
                'status',
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'codigo_visitante',
        'tipo_acceso',
        'empleado_id',
        'proveedor_id',
        'proveedor_empleado_id',
        'productor_id',
        'productor_empleado_id',
        'medio_acceso',
        'empleado_vehiculo_id',
        'proveedor_vehiculo_id',
        'productor_vehiculo_id',
        'vehiculo_tipo',
        'vehiculo_marca',
        'vehiculo_modelo',
        'vehiculo_placa',
        'vehiculo_foto_frontal',
        'vehiculo_foto_trasera',
        'fecha_ingreso',
        'hora_ingreso',
        'fecha_salida',
        'hora_salida',
        'responsable_id',
        'observaciones',
        'acompanantes',
        'empresa_id',
        'sucursal_id',
        'status',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date:Y-m-d',
        'fecha_salida' => 'date:Y-m-d',
        'codigo_visitante' => 'integer',
        'status' => 'integer',
        'acompanantes' => 'array',
    ];

    /**
     * Generar automáticamente el siguiente código de visitante iniciando en 80000001
     */
    public static function generarSiguienteCodigoVisitante(): int
    {
        $ultimoCodigo = static::max('codigo_visitante');
        
        if (!$ultimoCodigo || $ultimoCodigo < 80000001) {
            return 80000001;
        }

        return $ultimoCodigo + 1;
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

    public function empleadoVehiculo(): BelongsTo
    {
        return $this->belongsTo(EmpleadoVehiculo::class, 'empleado_vehiculo_id');
    }

    public function proveedorVehiculo(): BelongsTo
    {
        return $this->belongsTo(ProveedorVehiculo::class, 'proveedor_vehiculo_id');
    }

    public function productorVehiculo(): BelongsTo
    {
        return $this->belongsTo(ProductorVehiculo::class, 'productor_vehiculo_id');
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Responsable::class, 'responsable_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }
}
