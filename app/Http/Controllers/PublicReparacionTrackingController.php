<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\Pais;
use App\Services\Tenancy\TenantManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicReparacionTrackingController extends Controller
{
    /**
     * Display public tracking portal scoped to a specific empresa: /reparacion/{empresa}/consultar/{numero_orden?}
     */
    public function show(Request $request, $empresaParam = null, ?string $numeroOrden = null): Response
    {
        $targetEmpresa = null;
        if ($empresaParam) {
            if (is_numeric($empresaParam)) {
                $targetEmpresa = Empresa::find($empresaParam);
            } else {
                $targetEmpresa = Empresa::where('id', $empresaParam)
                    ->orWhere('slug', $empresaParam)
                    ->first();
            }
        }

        if (!$targetEmpresa) {
            $targetEmpresa = Empresa::first();
        }

        return $this->processTracking($request, $targetEmpresa, $numeroOrden);
    }

    /**
     * Fallback route for backwards compatibility: /reparacion/consultar/{numero_orden?}
     */
    public function showFallback(Request $request, ?string $numeroOrden = null): Response
    {
        $empresaId = $request->input('empresa') ?: $request->input('empresa_id');
        $targetEmpresa = $empresaId ? Empresa::find($empresaId) : null;

        return $this->processTracking($request, $targetEmpresa, $numeroOrden);
    }

    /**
     * Internal processor for tracking views.
     */
    protected function processTracking(Request $request, ?Empresa $targetEmpresa, ?string $numeroOrden = null): Response
    {
        $queryCode = trim((string) ($numeroOrden ?: $request->input('orden') ?: $request->input('q') ?: ''));

        $ordenData = null;
        $notFound = false;
        $currencySymbol = '$';

        if (!empty($queryCode)) {
            // Normalizar código (incluyendo apóstrofes de escáner en español)
            $cleanCode = strtoupper(preg_replace('/\s+/', '', str_replace(["'", "´", "`"], '-', $queryCode)));

            $findOrden = function () use ($cleanCode, $queryCode, $targetEmpresa) {
                $query = OrdenReparacion::query();

                if ($targetEmpresa) {
                    $query->where('empresa_id', $targetEmpresa->id);
                }

                return $query->where(function ($q) use ($cleanCode, $queryCode) {
                    $q->where('numero_orden', $cleanCode)
                      ->orWhere('numero_orden', 'REP-' . str_pad(preg_replace('/[^0-9]/', '', $cleanCode), 6, '0', STR_PAD_LEFT))
                      ->orWhere('imei_serie', $cleanCode)
                      ->orWhere('imei_serie', $queryCode);
                })
                ->with([
                    'sucursal',
                    'marca',
                    'modelo',
                    'items.servicio',
                    'historial' => fn ($q) => $q->orderBy('created_at', 'desc'),
                ])
                ->first();
            };

            $orden = $targetEmpresa ? TenantManager::executeInTenant($targetEmpresa, $findOrden) : $findOrden();

            if ($orden) {
                // Actualizar empresa objetivo si venía de fallback
                if (!$targetEmpresa && $orden->empresa) {
                    $targetEmpresa = $orden->empresa;
                }

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

                $empresa = $orden->empresa ?: $targetEmpresa;
                $sucursal = $orden->sucursal;

                $ordenData = [
                    'id' => $orden->id,
                    'empresa_id' => $orden->empresa_id,
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
                        'id' => $empresa?->id,
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

        // Si no hay empresa objetivo aún, cargar la primera registrada
        if (!$targetEmpresa) {
            $targetEmpresa = Empresa::first();
        }

        if ($targetEmpresa && $targetEmpresa->pais_id && $currencySymbol === '$') {
            $pais = Pais::find($targetEmpresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                $currencySymbol = $pais->simbolo_moneda;
            }
        }

        return Inertia::render('public/ReparacionTracking', [
            'orden' => $ordenData,
            'empresaId' => $targetEmpresa?->id,
            'searchedCode' => $queryCode,
            'notFound' => $notFound,
            'currencySymbol' => $currencySymbol,
            'defaultEmpresa' => $targetEmpresa ? [
                'id' => $targetEmpresa->id,
                'nombre' => $targetEmpresa->nombre_comercial ?: $targetEmpresa->razon_social,
                'logo' => $targetEmpresa->logo ?: $targetEmpresa->logo_mini,
                'telefono' => $targetEmpresa->telefono,
                'whatsapp_phone' => $targetEmpresa->whatsapp_phone ?: $targetEmpresa->telefono,
                'direccion' => $targetEmpresa->direccion,
            ] : null,
        ]);
    }

    /**
     * Responder presupuesto para ruta por empresa: /reparacion/{empresa}/consultar/{numero_orden}/presupuesto
     */
    public function responderPresupuesto(Request $request, $empresaParam, string $numeroOrden)
    {
        return $this->handleDecisionPresupuesto($request, $numeroOrden, $empresaParam);
    }

    /**
     * Responder presupuesto para ruta de fallback: /reparacion/consultar/{numero_orden}/presupuesto
     */
    public function responderPresupuestoFallback(Request $request, string $numeroOrden)
    {
        return $this->handleDecisionPresupuesto($request, $numeroOrden, null);
    }

    /**
     * Procesar aprobación o rechazo de presupuesto.
     */
    protected function handleDecisionPresupuesto(Request $request, string $numeroOrden, $empresaParam = null)
    {
        $validated = $request->validate([
            'decision' => 'required|in:aprobar,rechazar',
            'motivo' => 'nullable|string|max:500',
        ]);

        $targetEmpresaId = null;
        if ($empresaParam) {
            $targetEmpresaId = is_numeric($empresaParam) ? (int)$empresaParam : Empresa::where('id', $empresaParam)->orWhere('slug', $empresaParam)->value('id');
        }

        $processDecision = function () use ($numeroOrden, $targetEmpresaId, $validated) {
            $query = OrdenReparacion::where('numero_orden', strtoupper(trim($numeroOrden)));

            if ($targetEmpresaId) {
                $query->where('empresa_id', $targetEmpresaId);
            }

            $orden = $query->firstOrFail();

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
        };

        return $targetEmpresaId ? TenantManager::executeInTenant($targetEmpresaId, $processDecision) : $processDecision();
    }
}
