<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\CashRegisterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashRegisterController extends Controller
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

    public function getBcvRate(\App\Services\BcvRateService $bcvService)
    {
        $rate = $bcvService->getRate();
        if ($rate) {
            return response()->json([
                'success' => true,
                'rate' => $rate,
                'message' => __('Tasa del BCV obtenida correctamente.'),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => __('No se pudo obtener la tasa oficial del BCV en este momento.'),
        ], 422);
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = CashRegister::with('user')->withCount('movements');

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $cajas = $query->orderBy('opened_at', 'desc')->paginate($perPage)->withQueryString();

        $activeRegister = CashRegister::getActiveRegister();

        return inertia('admin/PointOfSale/CashRegisters/Index', [
            'cajas' => $cajas,
            'activeRegister' => $activeRegister,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request, CashRegisterService $service)
    {
        $existingOpen = CashRegister::hasOpenRegister();

        if ($existingOpen) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ya existe una caja abierta para su empresa y sucursal actualmente.'),
            ]);
        }

        $validated = $request->validate([
            'opening_amount' => 'required|numeric|min:0',
            'valor_dolar' => 'nullable|numeric|gt:0',
        ]);

        $service->openRegister(auth()->id(), (float) $validated['opening_amount']);

        if (!empty($validated['valor_dolar'])) {
            $user = auth()->user();
            if ($user && $user->empresa_id) {
                $empresa = Empresa::find($user->empresa_id);
                if ($empresa) {
                    $empresa->update(['valor_dolar' => (float) $validated['valor_dolar']]);
                }
            }
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Caja aperturada exitosamente con tipo de cambio configurado.'),
        ]);
    }

    public function show(CashRegister $caja, CashRegisterService $service)
    {
        $caja->load([
            'user',
            'movements' => function ($query) {
                $query->orderBy('created_at', 'desc')->with('creator');
            }
        ]);

        $inflows = (float) $caja->movements()->where('type', 'inflow')->sum('amount');
        $outflows = (float) $caja->movements()->where('type', 'outflow')->sum('amount');
        $openingAmount = (float) $caja->opening_amount;
        $currentBalance = $openingAmount + $inflows - $outflows;

        $byPaymentMethod = $service->getPaymentMethodBreakdown($caja);

        // Group by Concept
        $byConceptRaw = $caja->movements()
            ->select('concepto', 'type', DB::raw('SUM(amount) as total'))
            ->groupBy('concepto', 'type')
            ->get();

        $byConcept = [];
        foreach ($byConceptRaw as $item) {
            $concept = $item->concepto;
            if (!isset($byConcept[$concept])) {
                $byConcept[$concept] = ['inflow' => 0.0, 'outflow' => 0.0, 'net' => 0.0];
            }
            $byConcept[$concept][$item->type] = (float) $item->total;
        }
        foreach ($byConcept as $concept => $values) {
            $byConcept[$concept]['net'] = $values['inflow'] - $values['outflow'];
        }

        $empresa = auth()->user()?->empresa;
        $valorDolar = (float) ($empresa?->valor_dolar ?? 20.0);

        return inertia('admin/PointOfSale/CashRegisters/Show', [
            'caja' => $caja,
            'valorDolar' => $valorDolar,
            'summary' => [
                'inflows' => $inflows,
                'outflows' => $outflows,
                'current_balance' => $currentBalance,
                'currency_symbol' => $this->getCurrencySymbol(),
                'valor_dolar' => $valorDolar,
                'by_payment_method' => $byPaymentMethod,
                'by_concept' => $byConcept,
            ],
        ]);
    }

    public function addMovement(Request $request, CashRegister $caja, CashRegisterService $service)
    {
        if ($caja->status !== 'open') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se pueden registrar movimientos en una caja cerrada.'),
            ]);
        }

        $validated = $request->validate([
            'type' => 'required|in:inflow,outflow',
            'concepto' => 'required|string|max:100',
            'metodo_pago' => 'required|string|max:100',
            'amount' => 'required|numeric|gt:0',
            'description' => 'nullable|string|max:255',
        ]);

        $service->addMovement(
            $caja,
            $validated['type'],
            $validated['concepto'],
            $validated['metodo_pago'],
            (float) $validated['amount'],
            $validated['description'] ?? null,
            auth()->id()
        );

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Movimiento registrado exitosamente.'),
        ]);
    }

    public function close(Request $request, CashRegister $caja, CashRegisterService $service)
    {
        if ($caja->status !== 'open') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('La caja ya se encuentra cerrada.'),
            ]);
        }

        $validated = $request->validate([
            'counted_amount' => 'nullable|numeric|min:0',
        ]);

        $countedAmount = isset($validated['counted_amount']) ? (float) $validated['counted_amount'] : null;

        $service->closeRegister($caja, $countedAmount);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Caja cerrada exitosamente.'),
        ]);
    }
}
