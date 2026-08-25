<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckSubscriptionExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:send-reminders 
                            {--days= : Días de anticipación específicos separados por comas (por defecto: 10,5,3,1,0)}
                            {--force : Enviar recordatorio forzado ignorando si ya se envió hoy}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica el estado de las suscripciones y envía alertas de vencimiento por WhatsApp a 10, 5, 3, 1 y 0 días.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $daysOption = $this->option('days');
        $targetDaysList = $daysOption !== null && $daysOption !== ''
            ? array_map('intval', explode(',', $daysOption))
            : [10, 5, 3, 1, 0];

        $force = (bool) $this->option('force');

        $this->info("🔍 Analizando suscripciones para los hitos: " . implode(', ', $targetDaysList) . " días restantes...");

        $empresas = Empresa::withoutGlobalScopes()
            ->with(['pais', 'paisTelefono'])
            ->where('id', '!=', 1) // Excluir la empresa dueña del SaaS
            ->get();

        $enviados = 0;
        $omitidos = 0;
        $fallidos = 0;

        $whatsappService = new WhatsAppService(1);
        $whatsappService->setTimeout(10);

        foreach ($empresas as $empresa) {
            if ($empresa->isExemptFromSubscription()) {
                continue;
            }

            $sub = $empresa->getLatestSubscriptionRecord();
            if (! $sub || ! $sub->fecha_vencimiento) {
                continue;
            }

            $diasRestantes = $empresa->dias_restantes_suscripcion;

            // Determinar si aplica para notificación según los hitos configurados
            $aplicaParaNotificar = in_array($diasRestantes, $targetDaysList, true);

            if (! $aplicaParaNotificar && ! $force) {
                continue;
            }

            // Evitar enviar más de un recordatorio en el mismo día natural (salvo --force)
            if (! $force && $sub->last_reminder_sent_at && $sub->last_reminder_sent_at->isToday()) {
                $this->line("⏳ {$empresa->razon_social}: Ya se le envió recordatorio hoy. Omitiendo.");
                $omitidos++;
                continue;
            }

            // Resolver número de teléfono destino y código de país
            $telefono = $empresa->telefono;
            $rawCodigo = $empresa->paisTelefono?->codigo_telefonico
                ?? $empresa->pais?->codigo_telefonico
                ?? '52';
            $codigoPais = preg_replace('/[^0-9]/', '', $rawCodigo) ?: '52';

            // Si no tiene teléfono en la empresa, intentar obtener el del usuario administrador principal
            if (empty($telefono)) {
                $adminUser = $empresa->users()->first();
                $telefono = $adminUser?->phone ?? $adminUser?->telefono;
            }

            if (empty($telefono)) {
                $this->warn("⚠️  {$empresa->razon_social}: No posee teléfono de contacto registrado.");
                $fallidos++;
                continue;
            }

            // Formatear teléfono con código de país si es necesario
            $cleanPhone = preg_replace('/[^0-9]/', '', $telefono);
            if (! str_starts_with($cleanPhone, $codigoPais) && strlen($cleanPhone) <= 11) {
                $cleanPhone = ltrim($cleanPhone, '0');
                $cleanPhone = $codigoPais . $cleanPhone;
            }

            $fechaFormateada = $sub->fecha_vencimiento->format('d/m/Y');
            $nombrePlan = $sub->nombre_plan ?? 'Plan FixSale';
            $sucursales = $sub->max_sucursales ?? $empresa->max_sucursales ?? 1;

            $encabezado = match ($diasRestantes) {
                0 => '🚨 *¡ATENCIÓN URGENTE! SU SUSCRIPCIÓN VENCE HOY*',
                1 => '🚨 *URGENTE: SU SUSCRIPCIÓN VENCE MAÑANA (1 DÍA)*',
                3 => '⚠️ *IMPORTANTE: SU SUSCRIPCIÓN VENCE EN 3 DÍAS*',
                5 => '🔔 *RECORDATORIO: SU SUSCRIPCIÓN VENCE EN 5 DÍAS*',
                10 => '🔔 *AVISO: SU SUSCRIPCIÓN VENCE EN 10 DÍAS*',
                default => "🔔 *RECORDATORIO DE VENCIMIENTO FIXSALE ({$diasRestantes} DÍAS)*",
            };

            $diasTexto = match ($diasRestantes) {
                0 => '¡VENCE HOY!',
                1 => '1 día restante (¡Mañana!)',
                default => "{$diasRestantes} días restantes",
            };

            $mensaje = "{$encabezado}\n\n"
                . "Estimado/a *{$empresa->razon_social}*,\n\n"
                . "Le recordamos que su suscripción al plan *{$nombrePlan}* está próxima a su fecha de corte.\n\n"
                . "📅 *Fecha de vencimiento:* {$fechaFormateada}\n"
                . "⏳ *Tiempo restante:* {$diasTexto}\n"
                . "🏢 *Sucursales activas:* {$sucursales}\n\n"
                . "Para garantizar la continuidad ininterrumpida del sistema y sus sucursales, puede reportar su pago o renovar en línea desde su panel:\n"
                . "👉 " . url('/admin/monitoring/subscription') . "\n\n"
                . "Si ya realizó su pago, por favor ignore este mensaje.\n"
                . "_Equipo de Soporte FixSale_";

            try {
                $resultado = $whatsappService->sendMessage($cleanPhone, $mensaje, true);

                $sub->update([
                    'last_reminder_sent_at' => now(),
                    'reminder_sent_count' => ($sub->reminder_sent_count ?? 0) + 1,
                ]);

                Log::info("Notificación de vencimiento enviada a {$empresa->razon_social} ({$cleanPhone}) - Días restantes: {$diasRestantes}");
                $this->info("✅ Notificación enviada a {$empresa->razon_social} ({$cleanPhone}) - Días: {$diasRestantes}");
                $enviados++;
            } catch (\Throwable $e) {
                Log::error("Error enviando recordatorio WhatsApp a {$empresa->razon_social}: " . $e->getMessage());
                $this->error("❌ Error enviando a {$empresa->razon_social}: " . $e->getMessage());
                $fallidos++;
            }
        }

        $this->newLine();
        $this->info("📊 Resumen: {$enviados} enviados, {$omitidos} omitidos, {$fallidos} fallidos.");

        return Command::SUCCESS;
    }
}
