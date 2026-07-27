<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Empresa;
use App\Models\Pais;
use App\Services\CashRegisterService;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) {
            return '$';
        }

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

        $activeRegister = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        return inertia('admin/PointOfSale/CashRegisters/Index', [
            'cajas' => $cajas,
            'activeRegister' => $activeRegister,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request, CashRegisterService $service)
    {
        $existingOpen = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->exists();

        if ($existingOpen) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ya tiene una caja abierta actualmente.'),
            ]);
        }

        $validated = $request->validate([
            'opening_amount' => 'required|numeric|min:0',
        ]);

        $service->openRegister(auth()->id(), (float) $validated['opening_amount']);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Caja aperturada exitosamente.'),
        ]);
    }

    public function show(CashRegister $caja)
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

        return inertia('admin/PointOfSale/CashRegisters/Show', [
            'caja' => $caja,
            'summary' => [
                'inflows' => $inflows,
                'outflows' => $outflows,
                'current_balance' => $currentBalance,
                'currency_symbol' => $this->getCurrencySymbol(),
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
            'amount' => 'required|numeric|gt:0',
            'description' => 'nullable|string|max:255',
        ]);

        $service->addMovement(
            $caja,
            $validated['type'],
            (float) $validated['amount'],
            $validated['description'] ?? null,
            auth()->id()
        );

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Movimiento registrado exitosamente.'),
        ]);
    }

    public function close(CashRegister $caja, CashRegisterService $service)
    {
        if ($caja->status !== 'open') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('La caja ya se encuentra cerrada.'),
            ]);
        }

        $service->closeRegister($caja);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Caja cerrada exitosamente.'),
        ]);
    }
}
