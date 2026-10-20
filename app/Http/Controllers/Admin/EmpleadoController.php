<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\EmployeeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class EmpleadoController extends Controller
{
    protected EmployeeService $employeeService;

    public function __construct(EmployeeService $employeeService)
    {
        $this->employeeService = $employeeService;
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;
        $sucursalId = $request->input('sucursal_id', $user?->sucursal_id);

        $filters = [
            'search' => $request->input('search'),
            'estado' => $request->input('estado'),
            'sucursal_id' => $sucursalId,
            'perPage' => (int) $request->input('perPage', 10),
        ];

        $empleados = $this->employeeService->list($filters, $empresaId, $sucursalId, $filters['perPage']);
        $stats = $this->employeeService->getStats($empresaId, $sucursalId);

        $sucursales = Sucursal::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->get(['id', 'nombre']);

        $roles = \App\Models\Role::on('landlord')
            ->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)->orWhereNull('empresa_id');
            })
            ->pluck('name')
            ->unique();

        if ($roles->isEmpty()) {
            $roles = collect(['Vendedor', 'Técnico', 'Administrador']);
        }

        if (!$roles->contains('Técnico y Vendedor')) {
            $roles->push('Técnico y Vendedor');
        }
        $roles = $roles->values();

        return inertia('admin/Empleados/Index', [
            'empleados' => $empleados,
            'stats' => $stats,
            'sucursales' => $sucursales,
            'roles' => $roles,
            'filters' => $request->only(['search', 'estado', 'sucursal_id', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'documento_tipo' => ['nullable', 'string', 'max:30'],
            'documento_numero' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:100'],
            'sueldo_base' => ['nullable', 'numeric', 'min:0'],
            'porcentaje_comision' => ['required', 'numeric', 'min:0', 'max:100'],
            'tipo_comision' => ['nullable', 'in:porcentaje,monto_fijo'],
            'comision_aplica_a' => ['nullable', 'in:subtotal,total'],
            'porcentaje_comision_reparacion' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_comision_reparacion' => ['nullable', 'in:porcentaje,monto_fijo'],
            'comision_reparacion_aplica_a' => ['nullable', 'in:mano_obra,total_orden'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'crear_usuario' => ['nullable', 'boolean'],
            'password' => ['nullable', 'string', 'min:6'],
            'rol' => ['nullable', 'string', 'max:50'],
            'estado' => ['nullable', 'boolean'],
            'fecha_ingreso' => ['nullable', 'date'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        $empresaId = auth()->user()?->empresa_id ?? 1;

        if (!empty($validated['email'])) {
            $userWithEmail = User::where('email', strtolower($validated['email']))->first();
            if ($userWithEmail && $userWithEmail->empresa_id !== $empresaId) {
                return back()->withErrors(['email' => __('Este correo ya se encuentra registrado por otro usuario en otra empresa.')]);
            }
        }

        $empleado = $this->employeeService->create($validated, $empresaId);

        $usuarioMsg = $empleado->user_id ? __('con su cuenta de usuario activada') : '';

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Empleado :nombre registrado exitosamente :usuarioMsg.", [
                'nombre' => $empleado->nombre_completo,
                'usuarioMsg' => $usuarioMsg,
            ]),
        ]);
    }

    public function update(Request $request, Empleado $empleado)
    {
        $validated = $request->validate([
            'nombres' => ['required', 'string', 'max:100'],
            'apellidos' => ['required', 'string', 'max:100'],
            'documento_tipo' => ['nullable', 'string', 'max:30'],
            'documento_numero' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'cargo' => ['nullable', 'string', 'max:100'],
            'sueldo_base' => ['nullable', 'numeric', 'min:0'],
            'porcentaje_comision' => ['required', 'numeric', 'min:0', 'max:100'],
            'tipo_comision' => ['nullable', 'in:porcentaje,monto_fijo'],
            'comision_aplica_a' => ['nullable', 'in:subtotal,total'],
            'porcentaje_comision_reparacion' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_comision_reparacion' => ['nullable', 'in:porcentaje,monto_fijo'],
            'comision_reparacion_aplica_a' => ['nullable', 'in:mano_obra,total_orden'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'crear_usuario' => ['nullable', 'boolean'],
            'password' => ['nullable', 'string', 'min:6'],
            'rol' => ['nullable', 'string', 'max:50'],
            'estado' => ['nullable', 'boolean'],
            'fecha_ingreso' => ['nullable', 'date'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->employeeService->update($empleado, $validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Datos del empleado :nombre actualizados exitosamente.", ['nombre' => $empleado->nombre_completo]),
        ]);
    }

    public function destroy(Empleado $empleado)
    {
        $nombre = $empleado->nombre_completo;
        $deleted = $this->employeeService->delete($empleado);

        if ($deleted) {
            return back()->with('notification', [
                'type' => 'success',
                'message' => __("Empleado :nombre eliminado correctamente.", ['nombre' => $nombre]),
            ]);
        }

        return back()->with('notification', [
            'type' => 'info',
            'message' => __("El empleado :nombre posee ventas asociadas, por lo que fue desactivado en lugar de eliminarse.", ['nombre' => $nombre]),
        ]);
    }

    public function toggleStatus(Empleado $empleado)
    {
        $nuevoEstado = $this->employeeService->toggleStatus($empleado);
        $estadoTexto = $nuevoEstado ? __('activado') : __('desactivado');

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Empleado :nombre :estado exitosamente.", [
                'nombre' => $empleado->nombre_completo,
                'estado' => $estadoTexto,
            ]),
        ]);
    }
}
