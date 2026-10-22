<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrdenReparacionHistorial extends Model
{
    use HasFactory;

    protected $table = 'orden_reparacion_historial';

    protected $fillable = [
        'orden_id',
        'user_id',
        'estado_anterior',
        'estado_nuevo',
        'comentario',
        'mensaje_whatsapp',
    ];

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getMensajeWhatsappAttribute($value)
    {
        if (!empty($value)) {
            return $value;
        }

        // Fallback dinámico si no fue persistido directamente en la columna
        if ($this->comentario && (str_contains($this->comentario, 'WhatsApp') || str_contains($this->comentario, '📲'))) {
            if (preg_match('/\((\+?\d+)\)/', $this->comentario, $matches)) {
                $phone = $matches[1];
                $msg = \App\Models\WhatsAppMessage::where('recipient_phone', 'like', "%{$phone}%")
                    ->whereBetween('created_at', [
                        $this->created_at->copy()->subMinutes(10),
                        $this->created_at->copy()->addMinutes(10),
                    ])
                    ->latest('id')
                    ->first();
                if ($msg) {
                    return $msg->message_content;
                }
            }
        }

        return null;
    }
}
