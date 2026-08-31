<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BiotimeDispositivo;
use App\Models\BiotimeEmpleado;
use App\Models\BiotimeMarcaje;
use App\Models\Empleado;
use App\Services\BioTimeService;
use App\Services\BioTimeSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Pantallas de solo lectura del espejo de BioTime PRO.
 *
 * El scope multiempresa se aplica a mano (los modelos biotime_* no usan el
 * trait Multitenantable a propósito): cada consulta filtra por empresa_id.
 */
class BioTimeController extends Controller
{
    private function empresaId(Request $request): ?int
    {
        return $request->user()?->empresa_id;
    }

    /* ------------------------------------------------------------------ */
    /*  Relojes checadores                                                 */
    /* ------------------------------------------------------------------ */

    public function dispositivos(Request $request)
    {
        $empresaId = $this->empresaId($request);

        $dispositivos = BiotimeDispositivo::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('alias')
            ->get();

        return Inertia::render('admin/biotime/Dispositivos', [
            'dispositivos' => $dispositivos,
            'last_sync_at' => $request->user()?->empresa?->biotime_last_sync_at?->toIso8601String(),
            'biotime_active' => (bool) $request->user()?->empresa?->biotime_active,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Empleados de BioTime + vínculo con empleados de Shigoto            */
    /* ------------------------------------------------------------------ */

    public function empleados(Request $request)
    {
        $empresaId = $this->empresaId($request);

        $empleados = BiotimeEmpleado::query()
            ->with('empleado:id,nombres,apellidos,documento_identidad')
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('emp_code', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('national', 'like', "%{$search}%");
                });
            })
            ->when($request->link_status, fn ($q, $s) => $q->where('link_status', $s))
            ->orderBy('first_name')
            ->paginate($request->perPage ?? 25)
            ->withQueryString();

        $stats = [
            'total' => BiotimeEmpleado::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))->count(),
            'vinculados' => BiotimeEmpleado::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))->whereNotNull('empleado_id')->count(),
            'sin_vincular' => BiotimeEmpleado::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))->whereNull('empleado_id')->count(),
        ];

        return Inertia::render('admin/biotime/Empleados', [
            'empleados' => $empleados,
            'stats' => $stats,
            'filters' => $request->only('search', 'link_status', 'perPage'),
            // Catálogo para el selector de vínculo manual.
            'empleados_shigoto' => Empleado::query()
                ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento_identidad'])
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'label' => trim($e->nombres.' '.$e->apellidos).' — '.$e->documento_identidad,
                ]),
        ]);
    }

    public function vincular(Request $request, BiotimeEmpleado $biotimeEmpleado): RedirectResponse
    {
        $this->authorizeEmpresa($request, $biotimeEmpleado->empresa_id);

        $validated = $request->validate([
            'empleado_id' => 'nullable|integer|exists:empleados,id',
        ]);

        $biotimeEmpleado->update([
            'empleado_id' => $validated['empleado_id'] ?? null,
            'link_status' => empty($validated['empleado_id']) ? 'unmatched' : 'manual',
        ]);

        // Propaga el vínculo a los marcajes ya espejados de este empleado.
        BiotimeMarcaje::where('biotime_empleado_id', $biotimeEmpleado->id)
            ->update(['empleado_id' => $validated['empleado_id'] ?? null]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Employee link updated.'),
        ]);
    }

    public function autoVincular(Request $request): RedirectResponse
    {
        $empresa = $request->user()?->empresa;

        if (! $empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => __('No active company associated with your user.')]);
        }

        $linked = BioTimeSyncService::for($empresa)->resolveLinks($empresa);

        // Refresca el empleado_id de los marcajes cuyos biotime_empleados quedaron vinculados.
        BiotimeMarcaje::query()
            ->where('empresa_id', $empresa->id)
            ->whereNull('empleado_id')
            ->whereHas('biotimeEmpleado', fn ($q) => $q->whereNotNull('empleado_id'))
            ->with('biotimeEmpleado:id,empleado_id')
            ->chunkById(500, function ($marcajes) {
                foreach ($marcajes as $m) {
                    $m->update(['empleado_id' => $m->biotimeEmpleado->empleado_id]);
                }
            });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __(':count employees linked automatically.', ['count' => $linked]),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Marcajes (bitácora espejo)                                         */
    /* ------------------------------------------------------------------ */

    public function marcajes(Request $request)
    {
        $empresaId = $this->empresaId($request);

        $base = BiotimeMarcaje::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('emp_code', 'like', "%{$search}%")
                        ->orWhereHas('biotimeEmpleado', function ($be) use ($search) {
                            $be->where('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->dispositivo, fn ($q, $d) => $q->where('dispositivo_sn', $d))
            ->when($request->punch_state, fn ($q, $s) => $q->where('punch_state', $s))
            ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('punch_time', '>=', $f))
            ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('punch_time', '<=', $f));

        $stats = [
            'total' => (clone $base)->count(),
            'entradas' => (clone $base)->where('punch_state', '0')->count(),
            'salidas' => (clone $base)->where('punch_state', '1')->count(),
            'otros' => (clone $base)->whereNotIn('punch_state', ['0', '1'])->count(),
        ];

        $marcajes = (clone $base)
            ->with('biotimeEmpleado:id,emp_code,first_name,last_name')
            ->orderByDesc('punch_time')
            ->paginate($request->perPage ?? 50)
            ->withQueryString();

        return Inertia::render('admin/biotime/Marcajes', [
            'marcajes' => $marcajes,
            'stats' => $stats,
            'filters' => $request->only('search', 'dispositivo', 'punch_state', 'fecha_inicio', 'fecha_fin', 'perPage'),
            'dispositivos' => BiotimeDispositivo::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->orderBy('alias')->get(['sn', 'alias']),
            'punch_states' => BiotimeMarcaje::PUNCH_STATES,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Sincronizar ahora                                                  */
    /* ------------------------------------------------------------------ */

    public function syncNow(Request $request): RedirectResponse
    {
        $empresa = $request->user()?->empresa;

        if (! $empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => __('No active company associated with your user.')]);
        }

        if (! $empresa->biotime_active) {
            return back()->with('notification', ['type' => 'error', 'message' => __('Enable and configure BioTime first.')]);
        }

        $lock = Cache::lock('biotime:sync:'.$empresa->id, 600);

        if (! $lock->get()) {
            return back()->with('notification', [
                'type' => 'info',
                'message' => __('A BioTime sync is already running. Please wait.'),
            ]);
        }

        try {
            $validated = $request->validate([
                'only' => 'sometimes|string',
            ]);

            // El botón corre SÍNCRONO dentro del request web, así que se mantiene
            // acotado y rápido: nunca `--full`, y los marcajes se limitan a la
            // ventana de los últimos 2 días. El backfill histórico y la
            // sincronización completa periódica van por `php artisan biotime:sync`
            // (scheduler / línea de comandos).
            $options = [
                '--empresa' => $empresa->id,
                '--since' => now()->subDays(2)->format('Y-m-d H:i:s'),
            ];
            if (! empty($validated['only'])) {
                $options['--only'] = $validated['only'];
            }

            $exit = Artisan::call('biotime:sync', $options);
        } finally {
            $lock->release();
        }

        return back()->with('notification', [
            'type' => $exit === 0 ? 'success' : 'error',
            'message' => $exit === 0
                ? __('BioTime sync finished. :out', ['out' => trim(Artisan::output())])
                : __('BioTime sync finished with errors. Check the biotime log.'),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Foto de empleado (proxy + caché a disco)                           */
    /* ------------------------------------------------------------------ */

    public function fotoEmpleado(Request $request, BiotimeEmpleado $biotimeEmpleado): Response
    {
        $this->authorizeEmpresa($request, $biotimeEmpleado->empresa_id);

        if ($biotimeEmpleado->photo_path && Storage::disk('public')->exists($biotimeEmpleado->photo_path)) {
            return response(Storage::disk('public')->get($biotimeEmpleado->photo_path), 200)
                ->header('Content-Type', 'image/jpeg');
        }

        $empresa = $request->user()?->empresa;
        if (! $empresa) {
            abort(404);
        }

        $photo = (new BioTimeService($empresa))->getEmployeePhoto($biotimeEmpleado->emp_code);

        if (! $photo['success'] || ! $photo['body']) {
            abort(404);
        }

        $path = 'biotime/empleados/'.$biotimeEmpleado->emp_code.'.jpg';
        Storage::disk('public')->put($path, $photo['body']);
        $biotimeEmpleado->forceFill(['photo_path' => $path, 'photo_synced_at' => now()])->save();

        return response($photo['body'], 200)->header('Content-Type', $photo['content_type'] ?? 'image/jpeg');
    }

    /* ------------------------------------------------------------------ */

    private function authorizeEmpresa(Request $request, ?int $empresaId): void
    {
        $userEmpresaId = $request->user()?->empresa_id;

        // Si el usuario está acotado a una empresa, sólo puede tocar filas de esa empresa.
        if ($userEmpresaId && $empresaId && $userEmpresaId !== $empresaId) {
            abort(403);
        }
    }
}
