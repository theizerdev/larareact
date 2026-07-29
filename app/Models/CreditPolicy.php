<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditPolicy extends Model
{
    use HasFactory;

    protected $table = 'credit_policies';

    protected $fillable = [
        'nombre',
        'activo',
        'plazo_defecto_dias',
        'limite_defecto',
        'permite_modificar_limite',
        'dias_gracia',
        'moneda',
        // Intereses
        'interes_activado',
        'interes_tipo',
        'interes_calculo',
        'interes_valor',
        'interes_aplicar_despues_dias',
        'interes_capitalizable',
        // Límites
        'limite_accion_excedido',
        'permite_exceder_limite',
        'solicitar_autorizacion',
        'mostrar_credito_disponible',
        // Formas de pago
        'forma_pago_tipo',
        'max_cuotas',
        'pago_minimo_porcentaje',
        'abono_minimo',
        // Vencimientos
        'vencimiento_tipo',
        'vencimiento_dias_despues',
        'vencimiento_dia_mes',
        'saltar_domingos',
        'saltar_festivos',
        // Recordatorios
        'recordatorio_dias_antes',
        'recordatorio_en_vencimiento',
        'recordatorio_dias_despues',
        'canal_whatsapp',
        'canal_email',
        'canal_sms',
        // Penalizaciones
        'penalizacion_tipo',
        'penalizacion_valor',
        'penalizacion_suspender_credito',
        'penalizacion_bloquear_compras',
        // Reglas
        'tipo_cliente_categoria',
        // Aprobaciones
        'monto_requiere_autorizacion',
        'rol_autorizador',
        // Documentos
        'requiere_contrato',
        'requiere_pagare',
        'requiere_firma_digital',
        'requiere_identificacion',
        'requiere_comprobantes',
        // Seguridad
        'permiso_crear_credito',
        'permiso_modificar_plazo',
        'permiso_cambiar_interes',
        'permiso_cambiar_limite',
        'permiso_eliminar_pagos',
        'permiso_revertir_pagos',
        'permiso_condonar_intereses',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'permite_modificar_limite' => 'boolean',
        'interes_activado' => 'boolean',
        'interes_capitalizable' => 'boolean',
        'permite_exceder_limite' => 'boolean',
        'solicitar_autorizacion' => 'boolean',
        'mostrar_credito_disponible' => 'boolean',
        'saltar_domingos' => 'boolean',
        'saltar_festivos' => 'boolean',
        'recordatorio_en_vencimiento' => 'boolean',
        'canal_whatsapp' => 'boolean',
        'canal_email' => 'boolean',
        'canal_sms' => 'boolean',
        'penalizacion_suspender_credito' => 'boolean',
        'penalizacion_bloquear_compras' => 'boolean',
        'requiere_contrato' => 'boolean',
        'requiere_pagare' => 'boolean',
        'requiere_firma_digital' => 'boolean',
        'requiere_identificacion' => 'boolean',
        'requiere_comprobantes' => 'boolean',
        'permiso_crear_credito' => 'boolean',
        'permiso_modificar_plazo' => 'boolean',
        'permiso_cambiar_interes' => 'boolean',
        'permiso_cambiar_limite' => 'boolean',
        'permiso_eliminar_pagos' => 'boolean',
        'permiso_revertir_pagos' => 'boolean',
        'permiso_condonar_intereses' => 'boolean',
        'limite_defecto' => 'float',
        'interes_valor' => 'float',
        'pago_minimo_porcentaje' => 'float',
        'abono_minimo' => 'float',
        'penalizacion_valor' => 'float',
        'monto_requiere_autorizacion' => 'float',
    ];
}
