<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Credito;
use App\Models\Cuota;
use App\Models\InventarioEquipo;
use App\Models\PlanFinanciamiento;
use App\Models\Sucursal;
use App\Services\CalculadoraCreditoService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreditoController extends Controller
{
    protected CalculadoraCreditoService $calculadora;

    public function __construct(CalculadoraCreditoService $calculadora)
    {
        $this->calculadora = $calculadora;
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $estado = $request->input('estado');
        $sucursalId = $request->input('sucursal_id');
        $perPage = $request->input('perPage', 10);

        $query = Credito::with([
            'cliente',
            'equipo.modelo.marca',
            'plan',
            'sucursal',
            'vendedor',
        ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('codigo_credito', 'like', "%{$search}%")
                    ->orWhereHas('cliente', function ($c) use ($search) {
                        $c->where('nombres', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%")
                            ->orWhere('numero_documento', 'like', "%{$search}%")
                            ->orWhere('telefono_principal', 'like', "%{$search}%");
                    })
                    ->orWhereHas('equipo', function ($e) use ($search) {
                        $e->where('imei_1', 'like', "%{$search}%")
                            ->orWhereHas('modelo', function ($m) use ($search) {
                                $m->where('nombre', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($estado) {
            $query->where('estado', $estado);
        }

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        $creditos = $query->latest()->paginate($perPage)->withQueryString();

        $stats = [
            'total_creditos' => Credito::count(),
            'activos' => Credito::where('estado', 'activo')->count(),
            'cartera_activa_monto' => (float) Credito::whereIn('estado', ['activo', 'en_mora'])->sum('saldo_pendiente'),
            'en_mora' => Credito::where('estado', 'en_mora')->count(),
            'liquidados' => Credito::where('estado', 'liquidado')->count(),
        ];

        $sucursales = Sucursal::where('status', true)->get(['id', 'nombre']);

        return inertia('admin/Creditos/Index', [
            'creditos' => $creditos,
            'stats' => $stats,
            'sucursales' => $sucursales,
            'filters' => $request->only(['search', 'estado', 'sucursal_id', 'perPage']),
        ]);
    }

    public function create()
    {
        $clientes = Cliente::where('estado_crediticio', '!=', 'bloqueado')
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'tipo_documento', 'numero_documento', 'telefono_principal', 'limite_credito', 'estado_crediticio']);

        $equipos = InventarioEquipo::with(['modelo.marca', 'sucursal'])
            ->where('estado', 'disponible')
            ->orderBy('created_at', 'desc')
            ->get();

        $planes = PlanFinanciamiento::where('activo', true)->get();
        $sucursales = Sucursal::where('status', true)->get(['id', 'nombre']);

        return inertia('admin/Creditos/Create', [
            'clientes' => $clientes,
            'equipos' => $equipos,
            'planes' => $planes,
            'sucursales' => $sucursales,
        ]);
    }

    public function simular(Request $request)
    {
        $validated = $request->validate([
            'precio_equipo' => 'required|numeric|min:1',
            'monto_inicial' => 'required|numeric|min:0',
            'plan_id' => 'required|exists:planes_financiamiento,id',
            'fecha_inicio' => 'nullable|date',
        ]);

        $plan = PlanFinanciamiento::findOrFail($validated['plan_id']);

        try {
            $proyeccion = $this->calculadora->simular(
                (float) $validated['precio_equipo'],
                (float) $validated['monto_inicial'],
                $plan,
                $validated['fecha_inicio'] ?? now()
            );

            return response()->json([
                'success' => true,
                'proyeccion' => $proyeccion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'inventario_equipo_id' => 'required|exists:inventario_equipos,id',
            'plan_financiamiento_id' => 'required|exists:planes_financiamiento,id',
            'sucursal_id' => 'required|exists:sucursales,id',
            'monto_inicial' => 'required|numeric|min:0',
            'metodo_pago_inicial' => 'required|string',
            'referencia_pago_inicial' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'notas' => 'nullable|string',
        ]);

        $equipo = InventarioEquipo::findOrFail($validated['inventario_equipo_id']);
        if ($equipo->estado !== 'disponible') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('El equipo seleccionado no se encuentra disponible para venta.'),
            ]);
        }

        $cliente = Cliente::findOrFail($validated['cliente_id']);
        if ($cliente->estado_crediticio === 'bloqueado') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('El cliente se encuentra bloqueado para operaciones a crédito.'),
            ]);
        }

        $plan = PlanFinanciamiento::findOrFail($validated['plan_financiamiento_id']);

        try {
            $simulacion = $this->calculadora->simular(
                (float) $equipo->precio_financiado,
                (float) $validated['monto_inicial'],
                $plan,
                $validated['fecha_inicio']
            );

            $credito = DB::transaction(function () use ($validated, $equipo, $plan, $simulacion) {
                $user = auth()->user();
                $empresaId = $user->empresa_id ?? 1;

                $nuevoCredito = Credito::create([
                    'codigo_credito' => CalculadoraCreditoService::generarCodigoCredito($empresaId),
                    'empresa_id' => $empresaId,
                    'sucursal_id' => $validated['sucursal_id'],
                    'cliente_id' => $validated['cliente_id'],
                    'inventario_equipo_id' => $equipo->id,
                    'plan_financiamiento_id' => $plan->id,
                    'user_id' => auth()->id(),
                    'fecha_inicio' => $validated['fecha_inicio'],
                    'precio_equipo' => $simulacion['precio_equipo'],
                    'monto_inicial' => $simulacion['monto_inicial'],
                    'metodo_pago_inicial' => $validated['metodo_pago_inicial'],
                    'referencia_pago_inicial' => $validated['referencia_pago_inicial'] ?? null,
                    'monto_financiado' => $simulacion['monto_financiado'],
                    'porcentaje_interes' => $simulacion['porcentaje_interes'],
                    'interes_total' => $simulacion['interes_total'],
                    'total_credito' => $simulacion['total_credito'],
                    'saldo_pendiente' => $simulacion['total_credito'],
                    'estado' => 'activo',
                    'notas' => $validated['notas'] ?? null,
                ]);

                // Crear el cronograma de cuotas
                foreach ($simulacion['cuotas'] as $cuotaData) {
                    $nuevoCredito->cuotas()->create([
                        'numero_cuota' => $cuotaData['numero_cuota'],
                        'fecha_vencimiento' => $cuotaData['fecha_vencimiento'],
                        'monto_capital' => $cuotaData['monto_capital'],
                        'monto_interes' => $cuotaData['monto_interes'],
                        'monto_cuota' => $cuotaData['monto_cuota'],
                        'monto_mora' => 0,
                        'monto_pagado' => 0,
                        'saldo_cuota' => $cuotaData['monto_cuota'],
                        'estado' => 'pendiente',
                    ]);
                }

                // Marcar equipo como vendido a crédito
                $equipo->update(['estado' => 'vendido_credito']);

                return $nuevoCredito;
            });

            return redirect()->route('admin.creditos.show', $credito->id)->with('notification', [
                'type' => 'success',
                'message' => __("¡Venta a crédito {$credito->codigo_credito} registrada con éxito!"),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al registrar venta a crédito: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al procesar la venta: ') . $e->getMessage(),
            ]);
        }
    }

    public function show(Credito $credito)
    {
        $credito->load([
            'cliente',
            'equipo.modelo.marca',
            'plan',
            'sucursal',
            'vendedor',
            'cuotas' => function ($q) {
                $q->orderBy('numero_cuota');
            },
        ]);

        return inertia('admin/Creditos/Show', [
            'credito' => $credito,
        ]);
    }

    public function pagarCuota(Request $request, Cuota $cuota)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|string',
            'referencia_pago' => 'nullable|string',
            'fecha_pago' => 'required|date',
            'notas' => 'nullable|string',
        ]);

        $credito = $cuota->credito;
        if (!in_array($credito->estado, ['activo', 'en_mora'])) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Este crédito no se encuentra en estado cobrable.'),
            ]);
        }

        try {
            DB::transaction(function () use ($cuota, $credito, $validated) {
                $montoPago = (float) $validated['monto'];
                $nuevoPagado = round((float) $cuota->monto_pagado + $montoPago, 2);
                $nuevoSaldo = max(0, round((float) $cuota->monto_cuota - $nuevoPagado, 2));

                $cuota->update([
                    'monto_pagado' => $nuevoPagado,
                    'saldo_cuota' => $nuevoSaldo,
                    'estado' => $nuevoSaldo <= 0 ? 'pagada' : 'parcial',
                    'fecha_pago' => $validated['fecha_pago'],
                    'metodo_pago' => $validated['metodo_pago'],
                    'referencia_pago' => $validated['referencia_pago'] ?? null,
                    'notas' => $validated['notas'] ?? null,
                ]);

                // Actualizar saldo del crédito
                $totalPendiente = (float) $credito->cuotas()->sum('saldo_cuota');
                $credito->saldo_pendiente = $totalPendiente;

                if ($totalPendiente <= 0) {
                    $credito->estado = 'liquidado';
                } elseif ($credito->cuotas()->where('estado', 'vencida')->exists()) {
                    $credito->estado = 'en_mora';
                } else {
                    $credito->estado = 'activo';
                }

                $credito->save();
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => __("Pago de la cuota #{$cuota->numero_cuota} registrado con éxito."),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al registrar pago de cuota {$cuota->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al procesar el pago.'),
            ]);
        }
    }
}

