<?php

namespace App\Services;

use App\Models\Empresa;
use App\Models\SubscriptionPlan;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppPricingSetting;
use App\Models\WhatsAppWalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WhatsAppBillingService
{
    /**
     * Resuelve la tarifa y cupo gratuito efectivos para una empresa.
     */
    public function resolvePricingForEmpresa(Empresa $empresa): array
    {
        $global = Schema::hasTable('whatsapp_pricing_settings')
            ? WhatsAppPricingSetting::current()
            : null;

        $sub = $empresa->getLatestSubscriptionRecord();
        $plan = $sub?->plan ?? SubscriptionPlan::getPlanRenovacionDefault();

        $unitCost = (float) ($plan?->costo_por_mensaje_usd ?? $global?->costo_por_mensaje_usd ?? 0.0050);
        if ($unitCost <= 0) {
            $unitCost = (float) ($global?->costo_por_mensaje_usd ?? 0.0050);
        }

        $freeQuota = (int) ($plan?->mensajes_incluidos_mes ?? $global?->mensajes_gratis_defecto ?? 60);
        $minPurchase = max(100, (int) ($plan?->min_compra_mensajes ?? $global?->min_compra_mensajes ?? 100));
        $billingEnabled = $global ? (bool) $global->cobro_activo : true;
        $packages = $global?->paquetes_recarga ?: [100, 500, 1000, 5000];

        return [
            'unit_cost_usd' => round($unitCost, 4),
            'free_quota' => max(0, $freeQuota),
            'min_purchase_messages' => $minPurchase,
            'billing_enabled' => $billingEnabled,
            'packages' => array_values(array_filter(array_map('intval', $packages), fn ($v) => $v >= $minPurchase)),
            'plan_nombre' => $plan?->nombre ?? 'Plan Actual',
            'subscription' => $sub,
        ];
    }

    /**
     * Reinicia el contador gratuito mensual si el ciclo ya venció.
     */
    private function syncCycleReset(Empresa $empresa): void
    {
        if (! Schema::hasColumn('empresas', 'whatsapp_cycle_reset_at')) {
            return;
        }

        if ($empresa->whatsapp_cycle_reset_at === null || now()->gte($empresa->whatsapp_cycle_reset_at)) {
            $empresa->whatsapp_messages_used_cycle = 0;
            $empresa->whatsapp_cycle_reset_at = now()->addMonth();
            $empresa->save();
        }
    }

    /**
     * Resumen de saldo, cupo gratuito y movimientos de la empresa.
     */
    public function getWalletSummary(int $empresaId): array
    {
        $empresa = Empresa::withoutGlobalScopes()->find($empresaId);
        if (! $empresa) {
            return [
                'balance_usd' => 0.0,
                'free_quota' => 60,
                'free_used' => 0,
                'free_remaining' => 60,
                'paid_remaining_messages' => 0,
                'total_remaining_messages' => 60,
                'unit_cost_usd' => 0.0050,
                'min_purchase_messages' => 100,
                'packages' => [100, 500, 1000, 5000],
                'billing_enabled' => true,
                'cycle_reset_at' => null,
                'transactions' => [],
            ];
        }

        $this->syncCycleReset($empresa);
        $pricing = $this->resolvePricingForEmpresa($empresa);

        $balance = round((float) ($empresa->whatsapp_balance_usd ?? 0), 4);
        $used = (int) ($empresa->whatsapp_messages_used_cycle ?? 0);
        $freeRemaining = max(0, $pricing['free_quota'] - $used);
        $unitCost = $pricing['unit_cost_usd'];
        $paidRemaining = $unitCost > 0 ? (int) floor(($balance + 1e-9) / $unitCost) : 0;

        $transactions = Schema::hasTable('whatsapp_wallet_transactions')
            ? WhatsAppWalletTransaction::where('empresa_id', $empresaId)
                ->orderBy('id', 'desc')
                ->limit(25)
                ->get()
            : collect();

        return [
            'is_unlimited' => $this->isUnlimitedEmpresa($empresa),
            'balance_usd' => $balance,
            'free_quota' => $pricing['free_quota'],
            'free_used' => $used,
            'free_remaining' => $freeRemaining,
            'paid_remaining_messages' => $paidRemaining,
            'total_remaining_messages' => $freeRemaining + $paidRemaining,
            'unit_cost_usd' => $unitCost,
            'min_purchase_messages' => $pricing['min_purchase_messages'],
            'packages' => $pricing['packages'],
            'billing_enabled' => $pricing['billing_enabled'],
            'payment_methods' => $this->getActivePaymentMethods(),
            'cycle_reset_at' => $empresa->whatsapp_cycle_reset_at?->toIso8601String(),
            'transactions' => $transactions,
        ];
    }

    /**
     * Determina si la empresa/usuario es Super Administrador sin límite de mensajería.
     */
    public function isUnlimitedEmpresa(Empresa $empresa): bool
    {
        if ($empresa->isExemptFromSubscription()) {
            return true;
        }

        $user = auth()->user();

        return $user !== null && method_exists($user, 'hasRole') && $user->hasRole('Super Administrador');
    }

    /**
     * Retorna las pasarelas de pago activas en la plataforma.
     */
    public function getActivePaymentMethods(): array
    {
        $master = Empresa::withoutGlobalScopes()->find(1);
        $methods = [];

        if ($master?->stripe_active) {
            $methods[] = ['id' => 'stripe', 'label' => 'Stripe (Tarjeta)'];
        }
        if ($master?->paypal_active) {
            $methods[] = ['id' => 'paypal', 'label' => 'PayPal'];
        }
        if ($master?->mercadopago_active) {
            $methods[] = ['id' => 'mercadopago', 'label' => 'MercadoPago'];
        }
        if (empty($methods) || ($master?->bank_transfer_active ?? true)) {
            $methods[] = ['id' => 'transferencia', 'label' => 'Transferencia / SPEI'];
        }

        return $methods;
    }

    /**
     * Autoriza y cobra atómicamente 1 mensaje saliente antes de enviarlo al microservicio.
     */
    public function authorizeAndCharge(int $empresaId, ?int $localMessageId = null, string $description = 'Envío de mensaje WhatsApp'): array
    {
        if (! Schema::hasColumn('empresas', 'whatsapp_balance_usd')) {
            return ['allowed' => true, 'billing_source' => 'unmetered', 'cost' => 0.0];
        }

        return DB::transaction(function () use ($empresaId, $localMessageId, $description) {
            /** @var Empresa|null $empresa */
            $empresa = Empresa::withoutGlobalScopes()->where('id', $empresaId)->lockForUpdate()->first();
            if (! $empresa) {
                return ['allowed' => false, 'error' => 'Empresa no encontrada para facturación de WhatsApp.'];
            }

            if ($this->isUnlimitedEmpresa($empresa)) {
                return ['allowed' => true, 'billing_source' => 'superadmin_unlimited', 'cost' => 0.0];
            }

            $this->syncCycleReset($empresa);
            $pricing = $this->resolvePricingForEmpresa($empresa);

            if (! $pricing['billing_enabled']) {
                return ['allowed' => true, 'billing_source' => 'disabled', 'cost' => 0.0];
            }

            // Verificar que la suscripción no esté vencida o cancelada
            if (! $empresa->isExemptFromSubscription()) {
                $sub = $pricing['subscription'];
                $expired = ! $sub
                    || in_array($sub->estado, ['expired', 'cancelled'], true)
                    || ($sub->fecha_vencimiento && now()->gt($sub->fecha_vencimiento));

                if ($expired) {
                    return [
                        'allowed' => false,
                        'code' => 'SUBSCRIPTION_EXPIRED',
                        'error' => 'Tu suscripción ha vencido. Renueva tu plan o adquiere un paquete de mensajes para continuar enviando.',
                    ];
                }
            }

            $used = (int) ($empresa->whatsapp_messages_used_cycle ?? 0);
            $freeQuota = $pricing['free_quota'];
            $unitCost = $pricing['unit_cost_usd'];
            $balance = round((float) ($empresa->whatsapp_balance_usd ?? 0), 4);

            // 1. Consumir del cupo gratuito (60 mensajes) si aún hay disponibles
            if ($used < $freeQuota) {
                $empresa->whatsapp_messages_used_cycle = $used + 1;
                $empresa->save();

                if (Schema::hasTable('whatsapp_wallet_transactions')) {
                    WhatsAppWalletTransaction::create([
                        'empresa_id' => $empresaId,
                        'user_id' => auth()->id(),
                        'tipo' => 'free_quota',
                        'monto_usd' => 0.0000,
                        'saldo_anterior' => $balance,
                        'saldo_nuevo' => $balance,
                        'whatsapp_message_id' => $localMessageId,
                        'descripcion' => $description.' (Cupo gratuito '.($used + 1).'/'.$freeQuota.')',
                    ]);
                }

                return [
                    'allowed' => true,
                    'billing_source' => 'free_quota',
                    'cost' => 0.0,
                ];
            }

            // 2. Descontar del saldo prepago ($0.005 USD por mensaje)
            if ($balance + 1e-9 < $unitCost) {
                return [
                    'allowed' => false,
                    'code' => 'INSUFFICIENT_BALANCE',
                    'error' => "Agotaste tus {$freeQuota} mensajes gratuitos y tu saldo es insuficiente (\${$balance} USD). Compra al menos {$pricing['min_purchase_messages']} mensajes para continuar.",
                ];
            }

            $newBalance = round(max(0, $balance - $unitCost), 4);
            $empresa->whatsapp_balance_usd = $newBalance;
            $empresa->save();

            $tx = null;
            if (Schema::hasTable('whatsapp_wallet_transactions')) {
                $tx = WhatsAppWalletTransaction::create([
                    'empresa_id' => $empresaId,
                    'user_id' => auth()->id(),
                    'tipo' => 'charge',
                    'monto_usd' => -$unitCost,
                    'saldo_anterior' => $balance,
                    'saldo_nuevo' => $newBalance,
                    'whatsapp_message_id' => $localMessageId,
                    'descripcion' => $description,
                ]);
            }

            return [
                'allowed' => true,
                'billing_source' => 'wallet',
                'cost' => $unitCost,
                'transaction_id' => $tx?->id,
            ];
        });
    }

    /**
     * Reembolsa atómicamente un mensaje que falló en el envío (idempotente).
     */
    public function refund(int $empresaId, string $billingSource, float $cost, ?int $localMessageId = null, string $reason = 'Fallo en envío'): void
    {
        if (! in_array($billingSource, ['free_quota', 'wallet'], true)) {
            return;
        }

        DB::transaction(function () use ($empresaId, $billingSource, $cost, $localMessageId, $reason) {
            if ($localMessageId) {
                $msg = WhatsAppMessage::where('id', $localMessageId)->lockForUpdate()->first();
                if ($msg) {
                    $meta = $msg->metadata ?? [];
                    if (! empty($meta['billing_refunded'])) {
                        return;
                    }
                    $meta['billing_refunded'] = true;
                    $meta['billing_refund_reason'] = $reason;
                    $msg->update(['metadata' => $meta]);
                }
            }

            $empresa = Empresa::withoutGlobalScopes()->where('id', $empresaId)->lockForUpdate()->first();
            if (! $empresa) {
                return;
            }

            if ($billingSource === 'free_quota') {
                if ((int) $empresa->whatsapp_messages_used_cycle > 0) {
                    $empresa->whatsapp_messages_used_cycle = (int) $empresa->whatsapp_messages_used_cycle - 1;
                    $empresa->save();
                }

                return;
            }

            if ($cost > 0) {
                $balance = round((float) ($empresa->whatsapp_balance_usd ?? 0), 4);
                $newBalance = round($balance + $cost, 4);
                $empresa->whatsapp_balance_usd = $newBalance;
                $empresa->save();

                if (Schema::hasTable('whatsapp_wallet_transactions')) {
                    WhatsAppWalletTransaction::create([
                        'empresa_id' => $empresaId,
                        'tipo' => 'refund',
                        'monto_usd' => $cost,
                        'saldo_anterior' => $balance,
                        'saldo_nuevo' => $newBalance,
                        'whatsapp_message_id' => $localMessageId,
                        'descripcion' => "Reembolso automático: {$reason}",
                    ]);
                }
            }
        });
    }

    /**
     * Acredita una compra de mensajes (mínimo 100 mensajes).
     */
    public function creditTopup(
        int $empresaId,
        int $messageCount,
        float $amountUsd,
        ?int $userId = null,
        ?int $paymentId = null,
        string $description = 'Recarga de mensajes WhatsApp'
    ): WhatsAppWalletTransaction {
        return DB::transaction(function () use ($empresaId, $messageCount, $amountUsd, $userId, $paymentId, $description) {
            $empresa = Empresa::withoutGlobalScopes()->where('id', $empresaId)->lockForUpdate()->firstOrFail();
            $balance = round((float) ($empresa->whatsapp_balance_usd ?? 0), 4);
            $newBalance = round($balance + $amountUsd, 4);

            $empresa->whatsapp_balance_usd = $newBalance;
            $empresa->save();

            return WhatsAppWalletTransaction::create([
                'empresa_id' => $empresaId,
                'user_id' => $userId,
                'tipo' => 'topup',
                'monto_usd' => $amountUsd,
                'saldo_anterior' => $balance,
                'saldo_nuevo' => $newBalance,
                'subscription_payment_id' => $paymentId,
                'descripcion' => "{$description} ({$messageCount} mensajes)",
            ]);
        });
    }
}
