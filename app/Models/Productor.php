<?php

namespace App\Models;

use App\Traits\HasSpanishActivityLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Productor extends Model
{
    use HasFactory, HasSpanishActivityLog, LogsActivity;

    protected static function booted()
    {
        static::updated(function ($productor) {
            if ($productor->isDirty('status') && $productor->status === 'activo') {
                try {
                    $pais = $productor->paisTelefono;
                    if ($pais && $productor->telefono) {
                        $prefix = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                        $cleanPhone = preg_replace('/[^0-9]/', '', $productor->telefono);
                        $to = $prefix . $cleanPhone;

                        $empresa = $productor->empresa;
                        $sucursal = $productor->sucursal;

                        $empresaName = $empresa ? $empresa->razon_social : 'Nuestra Empresa';
                        $sucursalName = $sucursal ? $sucursal->nombre : 'Nuestra Sucursal';

                        $message = "Estimado Productor *{$productor->nombre_comercial}*, le notificamos que ha pasado el periodo de revisión y que su suscripción en: {$empresaName}, {$sucursalName}, ha sido satisfactoria.";

                        $whatsappService = new \App\Services\WhatsAppService($empresa);
                        $whatsappService->sendMessage($to, $message, true);
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error al enviar WhatsApp de activación de productor: ' . $e->getMessage());
                }
            }
        });
    }

    protected $table = 'productores';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'razon_social',
                'nombre_comercial',
                'documento_identidad',
                'razon_social_rancho',
                'nombre_comercial_rancho',
                'pais_telefono_id',
                'telefono',
                'direccion',
                'codigo_postal',
                'estado',
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
        'razon_social_rancho',
        'nombre_comercial_rancho',
        'pais_telefono_id',
        'telefono',
        'direccion',
        'codigo_postal',
        'estado',
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

    public function empleados(): HasMany
    {
        return $this->hasMany(ProductorEmpleado::class, 'productor_id');
    }

    public function vehiculos(): HasMany
    {
        return $this->hasMany(ProductorVehiculo::class, 'productor_id');
    }
}
