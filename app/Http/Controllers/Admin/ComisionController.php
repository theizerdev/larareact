<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\ComisionPago;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Services\CommissionService;
use App\Services\EmployeeService;
use Illuminate\Http\Request;

class ComisionController extends Controller
{
    protected CommissionService $commissionService;
    protected EmployeeService $employeeService;

    public function __construct(CommissionService $commissionService, EmployeeService $employeeService)
    {
        $this->commissionService = $commissionService;
        $this->employeeService = $employeeService;
    }

    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';

        $empresa = $user->empresa;
        if (!$empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        $pais = $empresa?->pais ?? $empresa?->paisTelefono ?? ($empresa?->pais_id ? Pais::find($empresa->pais_id) : null);
        if ($pais && !empty($pais->simbolo_moneda)) {
            return $pais->simbolo_moneda;
        }

        return '$';
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;
        $sucursalId = $request->input('sucursal_id', $user?->sucursal_id);

        $isVendedor = $user && ($user->hasRole('Vendedor') || $user->hasRole('vendedor') || $user->hasRole('Seller'));
        $isAdmin = $user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Admin'));

        $empleadoIdFilter = $request->input('empleado_id');
        if ($isVendedor && !$isAdmin) {
            $currentEmp = $user->empleado ?? Empleado::where('user_id', $user->id)->first();
            $empleadoIdFilter = $currentEmp?->id ?? -1;
        }

        $filters = [
            'empleado_id' => $empleadoIdFilter,
            'estado' => $request->input('estado'),
            'from' => $request->input('from'),
            'to' => $request->input('to'),
            'search' => $request->input('search'),
            'sucursal_id' => $sucursalId,
            'perPage' => (int) $request->input('perPage', 15),
        ];

        $data = $this->commissionService->getCommissionsDashboard($filters, $empresaId, $sucursalId);

        $empleadosList = $this->employeeService->getActiveEmployees($empresaId, $sucursalId);
        if ($isVendedor && !$isAdmin) {
            $empleadosList = $empleadosList->where('id', $empleadoIdFilter)->values();
        }

        $sucursales = Sucursal::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->get(['id', 'nombre']);

        $activeRegister = CashRegister::getActiveRegister();

        $empresa = $user?->empresa;

        return inertia('admin/Comisiones/Index', [
            'stats' => $data['stats'],
            'empleados_resumen' => $data['empleados_resumen'],
            'ventas' => $data['ventas'],
            'reparaciones' => $data['reparaciones'],
            'pagos_recientes' => $data['pagos_recientes'],
            'empleados_list' => $empleadosList,
            'sucursales' => $sucursales,
            'canPay' => $isAdmin || $user?->can('comisiones.pay'),
            'activeRegister' => $activeRegister ? [
                'id' => $activeRegister->id,
                'status' => $activeRegister->status,
                'opened_at' => $activeRegister->opened_at,
            ] : null,
            'currencySymbol' => $this->getCurrencySymbol(),
            'empresa' => $empresa ? [
                'razon_social' => $empresa->razon_social ?? $empresa->nombre ?? $empresa->nombre_comercial,
                'documento' => $empresa->documento,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'direccion' => $empresa->direccion,
                'logo' => $empresa->logo ? (str_starts_with($empresa->logo, '/') || str_starts_with($empresa->logo, 'http') ? $empresa->logo : "/storage/{$empresa->logo}") : ($empresa->logo_mini ? (str_starts_with($empresa->logo_mini, '/') || str_starts_with($empresa->logo_mini, 'http') ? $empresa->logo_mini : "/storage/{$empresa->logo_mini}") : '/image/logo/5.png'),
            ] : null,
            'filters' => $request->only(['empleado_id', 'estado', 'from', 'to', 'search', 'sucursal_id', 'perPage']),
        ]);
    }

    /**
     * Obtener ventas y reparaciones pendientes para un colaborador (AJAX para el modal de liquidación).
     */
    public function pendingSales(Empleado $empleado)
    {
        $items = $this->commissionService->getPendingItemsForEmployee($empleado);
        return response()->json([
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'porcentaje_comision' => $empleado->porcentaje_comision,
                'porcentaje_comision_reparacion' => $empleado->porcentaje_comision_reparacion,
            ],
            'sales' => $items['ventas'],
            'reparaciones' => $items['reparaciones'],
            'total_comision' => $items['total_pendiente'],
            'total_comision_ventas' => round((float) $items['ventas']->sum('comision_monto'), 2),
            'total_comision_reparaciones' => round((float) $items['reparaciones']->sum('comision_monto'), 2),
        ]);
    }

    /**
     * Liquidar y registrar pago de comisiones (Ventas + Reparaciones de Taller).
     */
    public function pagar(Request $request)
    {
        $user = auth()->user();
        $isVendedor = $user && ($user->hasRole('Vendedor') || $user->hasRole('vendedor') || $user->hasRole('Seller'));
        $isAdmin = $user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Admin'));

        if ($isVendedor && !$isAdmin && !$user?->can('comisiones.pay')) {
            abort(403, 'No tienes permisos para registrar liquidaciones de comisiones.');
        }
        $validated = $request->validate([
            'empleado_id' => ['required', 'exists:empleados,id'],
            'sale_ids' => ['nullable', 'array'],
            'sale_ids.*' => ['integer', 'exists:sales,id'],
            'reparacion_ids' => ['nullable', 'array'],
            'reparacion_ids.*' => ['integer', 'exists:ordenes_reparacion,id'],
            'metodo_pago' => ['required', 'string', 'max:50'],
            'cash_register_id' => ['nullable', 'exists:cash_registers,id'],
            'registrar_egreso_caja' => ['nullable', 'boolean'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $empleado = Empleado::findOrFail($validated['empleado_id']);

        $pago = $this->commissionService->liquidateCommissions(
            $empleado,
            $validated['sale_ids'] ?? [],
            $validated['reparacion_ids'] ?? [],
            $validated['metodo_pago'],
            $validated['cash_register_id'] ?? null,
            $validated['notas'] ?? null,
            auth()->id(),
            (bool) ($validated['registrar_egreso_caja'] ?? true)
        );

        $ticketData = $this->commissionService->getTicketData($pago);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Pago de comisiones :recibo registrado con éxito (:monto).", [
                'recibo' => $pago->codigo_recibo,
                'monto' => $this->getCurrencySymbol() . number_format($pago->monto_total, 2),
            ]),
            'comision_pago' => $ticketData,
        ]);
    }

    /**
     * Obtener ticket de comprobante de liquidación.
     */
    public function ticket(ComisionPago $comisionPago)
    {
        $ticketData = $this->commissionService->getTicketData($comisionPago);
        return response()->json($ticketData);
    }
}
