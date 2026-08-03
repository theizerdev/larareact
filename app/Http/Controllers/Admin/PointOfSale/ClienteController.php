<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\CreditPayment;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\CashRegisterService;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';

        $empresa = $user->empresa;
        if (!$empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        $query = Cliente::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $clientes = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/PointOfSale/Clientes/Index', [
            'clientes' => $clientes,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:500',
            'limite_credito' => 'nullable|numeric|min:0',
        ]);

        Cliente::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Cliente registrado exitosamente.'),
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'direccion' => 'nullable|string|max:500',
            'limite_credito' => 'nullable|numeric|min:0',
            'estado' => 'boolean',
        ]);

        $cliente->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Cliente actualizado exitosamente.'),
        ]);
    }

    public function destroy(Cliente $cliente)
    {
        $cliente->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Cliente eliminado exitosamente.'),
        ]);
    }

    public function show(Cliente $cliente)
    {
        $cliente->load([
            'sales' => function ($q) {
                $q->where('es_credito', true)->orderBy('created_at', 'desc')->with('items');
            },
            'creditPayments' => function ($q) {
                $q->orderBy('created_at', 'desc')->with('receiver');
            },
        ]);

        return inertia('admin/PointOfSale/Clientes/Show', [
            'cliente' => $cliente,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function registrarAbono(Request $request, Cliente $cliente, CashRegisterService $cashService)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'metodo_pago' => 'required|string|max:50',
            'monto' => 'required|numeric|gt:0',
            'nota' => 'nullable|string|max:500',
        ]);

        $sale = $cliente->sales()->where('id', $validated['sale_id'])->firstOrFail();

        // Cannot pay more than remaining balance
        $maxPayable = (float) $sale->saldo_credito;
        $monto = min((float) $validated['monto'], $maxPayable);

        if ($monto <= 0) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Esta venta ya está saldada.'),
            ]);
        }

        CreditPayment::create([
            'sale_id' => $sale->id,
            'cliente_id' => $cliente->id,
            'metodo_pago' => $validated['metodo_pago'],
            'monto' => $monto,
            'nota' => $validated['nota'] ?? null,
            'received_by' => auth()->id(),
        ]);

        // Update sale balance
        $sale->decrement('saldo_credito', $monto);

        // Update client balance
        $cliente->decrement('saldo_pendiente', $monto);

        // Register inflow in active cash register
        $cashRegister = CashRegister::getActiveRegister();

        if ($cashRegister && $monto > 0) {
            $cashService->addMovement(
                $cashRegister,
                'inflow',
                'venta',
                $validated['metodo_pago'],
                $monto,
                "Abono crédito {$sale->codigo_ticket} - {$cliente->nombre}",
                auth()->id()
            );
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Abono registrado exitosamente.'),
        ]);
    }
}
