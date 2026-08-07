<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\InventoryMovement;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\OrdenReparacion;
use App\Models\OrdenReparacionHistorial;
use App\Models\OrdenReparacionItem;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReparacionController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';
        $empresa = $user->empresa ?? ($user->empresa_id ? Empresa::find($user->empresa_id) : null);
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
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $search = $request->input('search');
        $status = $request->input('status');
        $tecnicoId = $request->input('tecnico_id');

        $query = OrdenReparacion::with(['cliente', 'marca', 'modelo', 'tecnico'])
            ->where('empresa_id', $empresaId);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_orden', 'like', "%{$search}%")
                  ->orWhere('cliente_nombre', 'like', "%{$search}%")
                  ->orWhere('imei_serie', 'like', "%{$search}%")
                  ->orWhere('marca_nombre', 'like', "%{$search}%")
                  ->orWhere('modelo_nombre', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('estado_orden', $status);
        }

        if ($tecnicoId) {
            $query->where('tecnico_id', $tecnicoId);
        }

        $ordenes = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Conteo por Estados para Tablero / Filtros
        $counts = OrdenReparacion::where('empresa_id', $empresaId)
            ->select('estado_orden', DB::raw('count(*) as total'))
            ->groupBy('estado_orden')
            ->pluck('total', 'estado_orden')
            ->toArray();

        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);

        return Inertia::render('admin/Reparaciones/Index', [
            'ordenes' => $ordenes,
            'counts' => $counts,
            'tecnicos' => $tecnicos,
            'currencySymbol' => $this->getCurrencySymbol(),
            'filters' => $request->only(['search', 'status', 'tecnico_id']),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $clientes = Cliente::where('empresa_id', $empresaId)->orderBy('nombre')->get(['id', 'nombre', 'telefono', 'email']);
        $marcas = Marca::with('modelos')->where('empresa_id', $empresaId)->orderBy('nombre')->get();
        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);

        return Inertia::render('admin/Reparaciones/Create', [
            'clientes' => $clientes,
            'marcas' => $marcas,
            'tecnicos' => $tecnicos,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'nullable|exists:clientes,id',
            'cliente_nombre' => 'required|string|max:255',
            'cliente_telefono' => 'nullable|string|max:50',
            'tipo_dispositivo' => 'required|in:smartphone,laptop,cpu,consola,otro',
            'marca_id' => 'nullable|exists:marcas,id',
            'marca_nombre' => 'required|string|max:255',
            'modelo_id' => 'nullable|exists:modelos,id',
            'modelo_nombre' => 'required|string|max:255',
            'color' => 'nullable|string|max:100',
            'imei_serie' => 'nullable|string|max:100',
            'contrasena_patron' => 'nullable|string|max:255',
            'descripcion_falla' => 'required|string',
            'observaciones_fisicas' => 'nullable|string',
            'inspeccion_fisica' => 'nullable|array',
            'estado_equipo' => 'nullable|array',
            'accesorios' => 'nullable|array',
            'tecnico_id' => 'nullable|exists:users,id',
            'costo_estimado' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
            'garantia_dias' => 'nullable|integer|min:0',
            'fecha_prometida' => 'nullable|date',
            'evidencias_fotos' => 'nullable|array',
        ]);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        // Generar Correlativo Folio
        $lastOrder = OrdenReparacion::where('empresa_id', $empresaId)->max('id') ?? 0;
        $numeroOrden = 'REP-' . str_pad($lastOrder + 1, 6, '0', STR_PAD_LEFT);

        $costoEstimado = (float) $validated['costo_estimado'];
        $anticipo = (float) ($validated['anticipo'] ?? 0);
        $saldoRestante = max(0, $costoEstimado - $anticipo);

        $ordenData = array_merge($validated, [
            'empresa_id' => $empresaId,
            'sucursal_id' => $user->sucursal_id,
            'numero_orden' => $numeroOrden,
            'estado_orden' => 'recibido',
            'costo_estimado' => $costoEstimado,
            'anticipo' => $anticipo,
            'saldo_restante' => $saldoRestante,
            'fecha_recepcion' => now(),
        ]);

        $orden = OrdenReparacion::create($ordenData);

        // Registro de Historial inicial
        OrdenReparacionHistorial::create([
            'orden_id' => $orden->id,
            'user_id' => $user->id,
            'estado_anterior' => null,
            'estado_nuevo' => 'recibido',
            'comentario' => 'Orden de recepción registrada.',
        ]);

        return redirect()->route('admin.reparaciones.show', $orden->id)->with('notification', [
            'type' => 'success',
            'message' => "Orden de Reparación {$numeroOrden} creada exitosamente.",
        ]);
    }

    public function show(OrdenReparacion $reparacion)
    {
        $reparacion->load(['cliente', 'marca', 'modelo', 'tecnico', 'items.producto', 'historial.user', 'sale']);

        $user = auth()->user();
        $empresaId = $user->empresa_id;

        $productosRepuestos = Producto::where('empresa_id', $empresaId)
            ->where('stock', '>', 0)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre', 'precio_venta', 'precio_costo', 'stock']);

        $tecnicos = User::where('empresa_id', $empresaId)->get(['id', 'name']);

        return Inertia::render('admin/Reparaciones/Show', [
            'orden' => $reparacion,
            'productosRepuestos' => $productosRepuestos,
            'tecnicos' => $tecnicos,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function updateEstado(Request $request, OrdenReparacion $reparacion)
    {
        $validated = $request->validate([
            'estado_orden' => 'required|in:recibido,en_diagnostico,presupuestado,en_reparacion,esperando_repuesto,reparado,entregado,cancelado',
            'comentario' => 'nullable|string',
            'tecnico_id' => 'nullable|exists:users,id',
        ]);

        $estadoAnterior = $reparacion->estado_orden;
        $nuevoEstado = $validated['estado_orden'];

        $updateData = ['estado_orden' => $nuevoEstado];
        if (isset($validated['tecnico_id'])) {
            $updateData['tecnico_id'] = $validated['tecnico_id'];
        }

        if ($nuevoEstado === 'entregado' && !$reparacion->fecha_entrega) {
            $updateData['fecha_entrega'] = now();
        }

        $reparacion->update($updateData);

        OrdenReparacionHistorial::create([
            'orden_id' => $reparacion->id,
            'user_id' => auth()->id(),
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $nuevoEstado,
            'comentario' => $validated['comentario'] ?? "Cambio de estado a " . ucfirst(str_replace('_', ' ', $nuevoEstado)),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Estado actualizado a " . ucfirst(str_replace('_', ' ', $nuevoEstado)),
        ]);
    }

    public function addItem(Request $request, OrdenReparacion $reparacion)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'cantidad' => 'required|integer|min:1',
        ]);

        $producto = Producto::find($validated['producto_id']);

        if ($producto->stock < $validated['cantidad']) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => "Stock insuficiente del repuesto {$producto->nombre}. Disponible: {$producto->stock}.",
            ]);
        }

        $precioVenta = (float) $producto->precio_venta;
        $precioCosto = (float) ($producto->precio_costo ?? 0);
        $cant = (int) $validated['cantidad'];
        $subtotal = $precioVenta * $cant;

        OrdenReparacionItem::create([
            'orden_id' => $reparacion->id,
            'producto_id' => $producto->id,
            'descripcion' => $producto->nombre,
            'cantidad' => $cant,
            'precio_costo' => $precioCosto,
            'precio_venta' => $precioVenta,
            'subtotal' => $subtotal,
        ]);

        // Descontar inventario
        $producto->decrement('stock', $cant);

        // Recalcular Totales
        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Repuesto {$producto->nombre} asignado a la reparación.",
        ]);
    }

    public function removeItem(OrdenReparacion $reparacion, OrdenReparacionItem $item)
    {
        if ($item->producto_id) {
            $producto = Producto::find($item->producto_id);
            if ($producto) {
                $producto->increment('stock', $item->cantidad);
            }
        }

        $item->delete();

        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Repuesto eliminado de la reparación.",
        ]);
    }

    public function updateCostos(Request $request, OrdenReparacion $reparacion)
    {
        $validated = $request->validate([
            'costo_mano_obra' => 'required|numeric|min:0',
            'anticipo' => 'nullable|numeric|min:0',
        ]);

        $reparacion->costo_mano_obra = (float) $validated['costo_mano_obra'];
        if (isset($validated['anticipo'])) {
            $reparacion->anticipo = (float) $validated['anticipo'];
        }

        $this->recalcularTotales($reparacion);

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Costos actualizados correctamente.",
        ]);
    }

    private function recalcularTotales(OrdenReparacion $reparacion)
    {
        $costoRepuestos = (float) $reparacion->items()->sum('subtotal');
        $costoManoObra = (float) $reparacion->costo_mano_obra;
        $totalEstimado = $costoRepuestos + $costoManoObra;
        $anticipo = (float) $reparacion->anticipo;
        $saldo = max(0, $totalEstimado - $anticipo);

        $reparacion->update([
            'costo_repuestos' => $costoRepuestos,
            'costo_estimado' => $totalEstimado,
            'saldo_restante' => $saldo,
        ]);
    }
}
