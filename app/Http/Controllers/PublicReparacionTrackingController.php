<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\Pais;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicReparacionTrackingController extends Controller
{
    /**
     * Display public tracking portal or search for a specific repair order.
     */
    public function show(Request $request, ?string $numeroOrden = null): Response
    {
        $queryCode = trim((string) ($numeroOrden ?: $request->input('orden') ?: $request->input('q') ?: ''));

        $ordenData = null;
        $notFound = false;
        $currencySymbol = '$';

        if (!empty($queryCode)) {
            // Normalizar código (incluyendo apóstrofes de escáner en español)
            $cleanCode = strtoupper(preg_replace('/\s+/', '', str_replace(["'", "´", "`"], '-', $queryCode)));

            $orden = OrdenReparacion::where('numero_orden', $cleanCode)
                ->orWhere('numero_orden', 'REP-' . str_pad(preg_replace('/[^0-9]/', '', $cleanCode), 6, '0', STR_PAD_LEFT))
                ->orWhere('imei_serie', $cleanCode)
                ->orWhere('imei_serie', $queryCode)
                ->with([
                    'empresa',
                    'sucursal',
                    'marca',
                    'modelo',
                    'items.servicio',
                    'historial' => fn ($q) => $q->orderBy('created_at', 'desc'),
                ])
                ->first();

            if ($orden) {
                // Símbolo de moneda de la empresa de la orden
                if ($orden->empresa && $orden->empresa->pais_id) {
                    $pais = Pais::find($orden->empresa->pais_id);
                    if ($pais && !empty($pais->simbolo_moneda)) {
                        $currencySymbol = $pais->simbolo_moneda;
                    }
                }

                // Enmascarar datos privados del cliente
                $clienteNombre = $orden->cliente_nombre ?: ($orden->cliente?->nombre ?: 'Cliente');
                $partesNombre = explode(' ', trim($clienteNombre));
                $nombreEnmascarado = implode(' ', array_map(function ($p) {
                    if (mb_strlen($p) <= 2) return $p;
                    return mb_substr($p, 0, 2) . str_repeat('*', max(2, mb_strlen($p) - 2));
                }, $partesNombre));

                $telefono = $orden->cliente_telefono ?: ($orden->cliente?->telefono ?: '');
                $telefonoEnmascarado = !empty($telefono) && strlen($telefono) > 4
                    ? str_repeat('*', strlen($telefono) - 4) . substr($telefono, -4)
                    : $telefono;

                $imei = $orden->imei_serie ?: '';
                $imeiEnmascarado = !empty($imei) && strlen($imei) > 4
                    ? str_repeat('*', strlen($imei) - 4) . substr($imei, -4)
                    : $imei;

                $empresa = $orden->empresa;
                $sucursal = $orden->sucursal;

                $ordenData = [
                    'id' => $orden->id,
                    'numero_orden' => $orden->numero_orden,
                    'estado_orden' => $orden->estado_orden,
                    'tipo_dispositivo' => $orden->tipo_dispositivo ?: 'Dispositivo',
                    'marca_nombre' => $orden->marca?->nombre ?: ($orden->marca_nombre ?: 'Marca no especificada'),
                    'modelo_nombre' => $orden->modelo?->nombre_comercial ?: ($orden->modelo_nombre ?: 'Modelo no especificado'),
                    'color' => $orden->color,
                    'imei_enmascarado' => $imeiEnmascarado,
                    'descripcion_falla' => $orden->descripcion_falla,
                    'observaciones_fisicas' => $orden->observaciones_fisicas,
                    'costo_estimado' => (float) $orden->costo_estimado,
                    'anticipo' => (float) $orden->anticipo,
                    'saldo_restante' => (float) $orden->saldo_restante,
                    'garantia_dias' => (int) ($orden->garantia_dias ?: 30),
                    'fecha_recepcion' => $orden->fecha_recepcion?->toIso8601String(),
                    'fecha_prometida' => $orden->fecha_prometida?->toIso8601String(),
                    'fecha_entrega' => $orden->fecha_entrega?->toIso8601String(),
                    'cliente_nombre_enmascarado' => $nombreEnmascarado,
                    'cliente_telefono_enmascarado' => $telefonoEnmascarado,
                    'servicios' => $orden->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'descripcion' => $item->descripcion ?: ($item->servicio?->nombre ?: ($item->producto?->nombre ?: 'Servicio Técnico')),
                            'precio' => (float) $item->subtotal,
                            'tipo' => $item->tipo_item,
                        ];
                    }),
                    'historial' => $orden->historial->map(function ($h) {
                        return [
                            'id' => $h->id,
                            'estado_nuevo' => $h->estado_nuevo,
                            'comentario' => $h->comentario,
                            'created_at' => $h->created_at?->toIso8601String(),
                        ];
                    }),
                    'empresa' => [
                        'nombre' => $empresa?->nombre_comercial ?: ($empresa?->razon_social ?: 'Servicio Técnico Especializado'),
                        'razon_social' => $empresa?->razon_social,
                        'logo' => $empresa?->logo ?: $empresa?->logo_mini,
                        'direccion' => $sucursal?->direccion ?: ($empresa?->direccion ?: ''),
                        'telefono' => $sucursal?->telefono ?: ($empresa?->telefono ?: ''),
                        'whatsapp_phone' => $empresa?->whatsapp_phone ?: ($empresa?->telefono ?: ''),
                        'email' => $empresa?->email ?: '',
                    ],
                ];
            } else {
                $notFound = true;
            }
        }

        // Si no hay empresa de orden, cargar empresa por defecto para la cabecera
        $defaultEmpresa = Empresa::first();

        return Inertia::render('public/ReparacionTracking', [
            'orden' => $ordenData,
            'searchedCode' => $queryCode,
            'notFound' => $notFound,
            'currencySymbol' => $currencySymbol,
            'defaultEmpresa' => $defaultEmpresa ? [
                'nombre' => $defaultEmpresa->nombre_comercial ?: $defaultEmpresa->razon_social,
                'logo' => $defaultEmpresa->logo ?: $defaultEmpresa->logo_mini,
                'telefono' => $defaultEmpresa->telefono,
                'whatsapp_phone' => $defaultEmpresa->whatsapp_phone ?: $defaultEmpresa->telefono,
                'direccion' => $defaultEmpresa->direccion,
            ] : null,
        ]);
    }

    /**
     * Permite al cliente aprobar o rechazar el presupuesto en línea.
     */
    public function responderPresupuesto(Request $request, string $numeroOrden)
    {
        $validated = $request->validate([
            'decision' => 'required|in:aprobar,rechazar',
            'motivo' => 'nullable|string|max:500',
        ]);

        $orden = OrdenReparacion::where('numero_orden', strtoupper(trim($numeroOrden)))->firstOrFail();

        if ($validated['decision'] === 'aprobar') {
            $orden->update([
                'estado_orden' => 'en_reparacion',
            ]);

            OrdenReparacionHistorial::create([
                'orden_id' => $orden->id,
                'user_id' => null,
                'estado_anterior' => $orden->getOriginal('estado_orden') ?: 'presupuestado',
                'estado_nuevo' => 'en_reparacion',
                'comentario' => __('Presupuesto APROBADO por el cliente a través del portal de seguimiento web.'),
            ]);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('¡Excelente! Has aprobado el presupuesto. Nuestro equipo técnico continuará con la reparación.'),
            ]);
        }

        // Rechazar
        $orden->update([
            'estado_orden' => 'cancelado',
        ]);

        $motivoTexto = !empty($validated['motivo']) ? " Motivo: " . $validated['motivo'] : '';

        OrdenReparacionHistorial::create([
            'orden_id' => $orden->id,
            'user_id' => null,
            'estado_anterior' => $orden->getOriginal('estado_orden') ?: 'presupuestado',
            'estado_nuevo' => 'cancelado',
            'comentario' => __('Presupuesto RECHAZADO por el cliente desde el portal web.') . $motivoTexto,
        ]);

        return back()->with('notification', [
            'type' => 'warning',
            'message' => __('Has rechazado el presupuesto. Tu equipo se encuentra listo para retiro o revisión adicional en taller.'),
        ]);
    }
}
