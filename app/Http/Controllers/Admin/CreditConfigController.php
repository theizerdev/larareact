<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditPolicy;
use App\Models\CreditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class CreditConfigController extends Controller
{
    public function index()
    {
        $policy = null;
        $logs = [];

        if (Schema::hasTable('credit_policies')) {
            $policy = CreditPolicy::first();

            if (!$policy) {
                $policy = CreditPolicy::create([
                    'nombre' => 'Configuración Principal',
                    'activo' => true,
                    'plazo_defecto_dias' => 30,
                    'limite_defecto' => 500.00,
                    'moneda' => 'USD',
                ]);
            }
        }

        if (Schema::hasTable('credit_logs')) {
            $logs = CreditLog::with('user:id,name,email')
                ->latest()
                ->take(50)
                ->get();
        }

        return Inertia::render('admin/CreditConfig/Index', [
            'policy' => $policy,
            'logs' => $logs,
        ]);
    }

    public function update(Request $request, $id = null)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255',
            'activo' => 'boolean',
            'plazo_defecto_dias' => 'numeric|min:0',
            'limite_defecto' => 'numeric|min:0',
            'permite_modificar_limite' => 'boolean',
            'dias_gracia' => 'numeric|min:0',
            'moneda' => 'string|max:10',

            // Intereses
            'interes_activado' => 'boolean',
            'interes_tipo' => 'string|in:diario,mensual',
            'interes_calculo' => 'string|in:fijo,porcentual,sin_interes',
            'interes_valor' => 'numeric|min:0',
            'interes_aplicar_despues_dias' => 'numeric|min:0',
            'interes_capitalizable' => 'boolean',

            // Límites
            'limite_accion_excedido' => 'string|in:bloquear,advertir,autorizacion',
            'permite_exceder_limite' => 'boolean',
            'solicitar_autorizacion' => 'boolean',
            'mostrar_credito_disponible' => 'boolean',

            // Formas de pago
            'forma_pago_tipo' => 'string|in:pago_unico,cuotas_semanales,quincenales,mensuales,personalizadas',
            'max_cuotas' => 'numeric|min:1',
            'pago_minimo_porcentaje' => 'numeric|min:0|max:100',
            'abono_minimo' => 'numeric|min:0',

            // Vencimientos
            'vencimiento_tipo' => 'string|in:dias_despues,fecha_fija,dia_especifico_mes',
            'vencimiento_dias_despues' => 'numeric|min:1',
            'vencimiento_dia_mes' => 'nullable|numeric|min:1|max:31',
            'saltar_domingos' => 'boolean',
            'saltar_festivos' => 'boolean',

            // Recordatorios
            'recordatorio_dias_antes' => 'numeric|min:0',
            'recordatorio_en_vencimiento' => 'boolean',
            'recordatorio_dias_despues' => 'numeric|min:0',
            'canal_whatsapp' => 'boolean',
            'canal_email' => 'boolean',
            'canal_sms' => 'boolean',

            // Penalizaciones
            'penalizacion_tipo' => 'string|in:ninguna,fija,porcentual',
            'penalizacion_valor' => 'numeric|min:0',
            'penalizacion_suspender_credito' => 'boolean',
            'penalizacion_bloquear_compras' => 'boolean',

            // Reglas
            'tipo_cliente_categoria' => 'string|in:contado,credito,vip,distribuidor,mayorista',

            // Aprobaciones
            'monto_requiere_autorizacion' => 'numeric|min:0',
            'rol_autorizador' => 'string|in:admin,supervisor,gerente',

            // Documentos
            'requiere_contrato' => 'boolean',
            'requiere_pagare' => 'boolean',
            'requiere_firma_digital' => 'boolean',
            'requiere_identificacion' => 'boolean',
            'requiere_comprobantes' => 'boolean',

            // Seguridad
            'permiso_crear_credito' => 'boolean',
            'permiso_modificar_plazo' => 'boolean',
            'permiso_cambiar_interes' => 'boolean',
            'permiso_cambiar_limite' => 'boolean',
            'permiso_eliminar_pagos' => 'boolean',
            'permiso_revertir_pagos' => 'boolean',
            'permiso_condonar_intereses' => 'boolean',
        ]);

        $policy = $id ? CreditPolicy::findOrFail($id) : CreditPolicy::first();

        if (!$policy) {
            $policy = CreditPolicy::create($data);
        } else {
            $policy->update($data);
        }

        if (Schema::hasTable('credit_logs')) {
            CreditLog::create([
                'user_id' => Auth::id(),
                'accion' => 'Actualización de Configuración de Créditos',
                'detalles' => [
                    'policy_id' => $policy->id,
                    'updated_at' => now()->toDateTimeString(),
                ],
            ]);
        }

        return redirect()->back()->with('success', 'Configuración de créditos actualizada correctamente.');
    }
}
