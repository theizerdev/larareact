<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ControlAccesoService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Pagination\LengthAwarePaginator;

class ControlAccesoController extends Controller
{
    /**
     * Resuelve el servicio de Control de Acceso para la empresa del usuario,
     * únicamente si la integración está activa y correctamente configurada.
     */
    private function resolveService(Request $request): ?ControlAccesoService
    {
        $empresa = $request->user()->empresa;

        if (! $empresa || ! $empresa->control_acceso_active) {
            return null;
        }

        $service = new ControlAccesoService($empresa);

        return $service->isConfigured() ? $service : null;
    }

    /**
     * Ejecuta un listado paginado (limit/offset) contra el middleware ivms y arma la vista Inertia.
     */
    private function renderList(Request $request, string $view, ?callable $fetcher, array $extraFilters = [])
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(5, (int) $request->input('perPage', 15)));
        $offset = ($page - 1) * $perPage;

        $paginatorOptions = ['path' => $request->url(), 'query' => $request->query()];

        if (! $fetcher) {
            return inertia($view, [
                'items' => new LengthAwarePaginator([], 0, $perPage, $page, $paginatorOptions),
                'filters' => $request->query(),
                'error' => __('The Access Control middleware is not configured or is inactive. Please configure it in Settings > Integrations.'),
            ]);
        }

        $query = array_merge($extraFilters, ['limit' => $perPage, 'offset' => $offset]);
        $result = $fetcher($query);

        if (! $result['success']) {
            return inertia($view, [
                'items' => new LengthAwarePaginator([], 0, $perPage, $page, $paginatorOptions),
                'filters' => $request->query(),
                'error' => $result['error'],
            ]);
        }

        $items = $result['data']['items'] ?? [];
        $total = $result['data']['total'] ?? count($items);

        return inertia($view, [
            'items' => new LengthAwarePaginator($items, $total, $perPage, $page, $paginatorOptions),
            'filters' => $request->query(),
            'error' => null,
        ]);
    }

    /**
     * Empleados registrados en el ivms.
     */
    public function empleados(Request $request)
    {
        $service = $this->resolveService($request);

        return $this->renderList(
            $request,
            'admin/control-acceso/empleados',
            $service ? fn (array $q) => $service->listEmployees($q) : null,
            array_filter([
                'search' => $request->input('search') ?: null,
                'employee_no' => $request->input('employee_no') ?: null,
                'full_name' => $request->input('full_name') ?: null,
                'user_type' => $request->input('user_type') ?: null,
                'include_system_accounts' => $request->boolean('include_system_accounts') ? 'true' : null,
                'include_deleted' => $request->boolean('include_deleted') ? 'true' : null,
            ])
        );
    }

    /**
     * Vehículos registrados en el ivms.
     */
    public function vehiculos(Request $request)
    {
        $service = $this->resolveService($request);

        return $this->renderList(
            $request,
            'admin/control-acceso/vehiculos',
            $service ? fn (array $q) => $service->listVehicleDirectory($q) : null,
            array_filter([
                'search' => $request->input('search') ?: null,
                'employee_no' => $request->input('employee_no') ?: null,
                'plate_number' => $request->input('plate_number') ?: null,
                'brand_code' => $request->input('brand_code') ?: null,
                'is_registered' => $request->has('is_registered') ? ($request->boolean('is_registered') ? 'true' : 'false') : null,
            ])
        );
    }

    /**
     * Tarjetas de acceso registradas en el ivms.
     */
    public function tarjetas(Request $request)
    {
        $service = $this->resolveService($request);

        return $this->renderList(
            $request,
            'admin/control-acceso/tarjetas',
            $service ? fn (array $q) => $service->listAccessCards($q) : null,
            array_filter([
                'search' => $request->input('search') ?: null,
                'employee_no' => $request->input('employee_no') ?: null,
                'card_no' => $request->input('card_no') ?: null,
                'include_deleted' => $request->boolean('include_deleted') ? 'true' : null,
            ])
        );
    }

    /**
     * Eventos de acceso peatonal (bitácora de auditoría, solo lectura).
     */
    public function eventosPeatonales(Request $request)
    {
        $service = $this->resolveService($request);

        return $this->renderList(
            $request,
            'admin/control-acceso/eventos-peatonales',
            $service ? fn (array $q) => $service->listAccessEvents($q) : null,
            array_filter([
                'search' => $request->input('search') ?: null,
                'employee_no' => $request->input('employee_no') ?: null,
                'person_name' => $request->input('person_name') ?: null,
                'card_no' => $request->input('card_no') ?: null,
                'include_system_events' => $request->boolean('include_system_events') ? 'true' : null,
                'only_identity_matches' => $request->boolean('only_identity_matches') ? 'true' : null,
            ])
        );
    }

    /**
     * Eventos de lectura de placas vehiculares / ANPR (bitácora de auditoría, solo lectura).
     */
    public function eventosVehiculares(Request $request)
    {
        $service = $this->resolveService($request);

        return $this->renderList(
            $request,
            'admin/control-acceso/eventos-vehiculares',
            $service ? fn (array $q) => $service->listPlateEvents($q) : null,
            array_filter([
                'search' => $request->input('search') ?: null,
                'plate_number' => $request->input('plate_number') ?: null,
                'brand_code' => $request->input('brand_code') ?: null,
                'camera_ip' => $request->input('camera_ip') ?: null,
                'list_type' => $request->input('list_type') ?: null,
                'direction' => $request->input('direction') ?: null,
            ])
        );
    }

    /**
     * Proxy de la foto de un evento de acceso peatonal (evita exponer credenciales al navegador).
     */
    public function eventoPeatonalFoto(Request $request, int $eventId): Response
    {
        $service = $this->resolveService($request);

        if (! $service) {
            abort(404);
        }

        $photo = $service->getAccessEventPhoto($eventId);

        if (! $photo['success']) {
            abort(404);
        }

        return response($photo['body'], 200)->header('Content-Type', $photo['content_type']);
    }

    /**
     * Proxy de una foto de un evento de placa vehicular (evita exponer credenciales al navegador).
     */
    public function eventoVehicularFoto(Request $request, int $eventId, int $index): Response
    {
        $service = $this->resolveService($request);

        if (! $service) {
            abort(404);
        }

        $photo = $service->getPlateEventPhoto($eventId, $index);

        if (! $photo['success']) {
            abort(404);
        }

        return response($photo['body'], 200)->header('Content-Type', $photo['content_type']);
    }
}
