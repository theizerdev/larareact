<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Proveedor extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity;

    protected static function booted()
    {
        static::updated(function ($proveedor) {
            if ($proveedor->isDirty('status') && $proveedor->status === 'activo') {
                try {
                    $pais = $proveedor->paisTelefono;
                    if ($pais && $proveedor->telefono) {
                        $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                        $cleanPhone = preg_replace('/[^0-9]/', '', $proveedor->telefono);
                        $to = $prefix . $cleanPhone;

                        $empresa = $proveedor->empresa;
                        $sucursal = $proveedor->sucursal;

                        $empresaName = $empresa ? $empresa->razon_social : 'Nuestra Empresa';
                        $sucursalName = $sucursal ? $sucursal->nombre : 'Nuestra Sucursal';

                        $message = "Estimado Proveedor *{$proveedor->nombre_comercial}*, le notificamos que ha pasado el periodo de revisión y que su suscripción en: {$empresaName}, {$sucursalName}, ha sido satisfactorio.";

                        $whatsappService = new \App\Services\WhatsAppService($empresa);
                        $whatsappService->sendMessage($to, $message, true);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de activación de proveedor: ' . $e->getMessage());
                }
            }
        });
    }

    protected $table = 'proveedores';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'razon_social',
                'nombre_comercial',
                'documento_identidad',
                'pais_telefono_id',
                'telefono',
                'direccion',
                'responsable',
                'pais_id',
                'latitud',
                'longitud',
                'status'
            ])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => static::getSpanishDescription($eventName));
    }

    protected $fillable = [
        'razon_social',
        'nombre_comercial',
        'documento_identidad',
        'pais_telefono_id',
        'telefono',
        'direccion',
        'responsable',
        'pais_id',
        'latitud',
        'longitud',
        'empresa_id',
        'sucursal_id',
        'user_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'latitud' => 'float',
            'longitud' => 'float',
        ];
    }

    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    public function paisTelefono(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_telefono_id');
    }

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

    public function empleados(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProveedorEmpleado::class, 'proveedor_id');
    }

    public function vehiculos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProveedorVehiculo::class, 'proveedor_id');
    }
}
