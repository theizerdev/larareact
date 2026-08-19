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
     * El middleware ivms acepta un máximo de 200 registros por página (valida
     * y rechaza con 422 cualquier limit mayor) y no soporta ningún filtro por
     * query param — los ignora todos, solo respeta limit/offset. Por eso el
     * filtrado de estos 5 módulos se hace acá: se trae hasta este tope de
     * registros (los más recientes primero) y se filtra/pagina en PHP.
     */
    private const MAX_FETCH_ITEMS = 1000;

    private const FETCH_PAGE_SIZE = 200;

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
     * True si $needle es vacío/null (sin filtro aplicado) o si aparece dentro
     * de $haystack sin importar mayúsculas/minúsculas.
     */
    private function containsCi(?string $haystack, ?string $needle): bool
    {
        if ($needle === null || $needle === '') {
            return true;
        }

        return $haystack !== null && stripos($haystack, $needle) !== false;
    }

    /**
     * True si $needle es vacío/null, o si aparece en cualquiera de $haystacks.
     */
    private function matchesAny(array $haystacks, ?string $needle): bool
    {
        if ($needle === null || $needle === '') {
            return true;
        }

        foreach ($haystacks as $haystack) {
            if ($haystack !== null && stripos($haystack, $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Trae hasta self::MAX_FETCH_ITEMS registros del middleware, paginando
     * internamente en bloques de self::FETCH_PAGE_SIZE (su máximo permitido).
     */
    private function fetchAll(callable $fetcher): array
    {
        $items = [];
        $offset = 0;

        while (count($items) < self::MAX_FETCH_ITEMS) {
            $result = $fetcher(['limit' => self::FETCH_PAGE_SIZE, 'offset' => $offset]);

            if (! $result['success']) {
                return $result;
            }

            $batch = $result['data']['items'] ?? [];
            $items = array_merge($items, $batch);
            $total = $result['data']['total'] ?? count($items);
            $offset += self::FETCH_PAGE_SIZE;

            if (count($batch) < self::FETCH_PAGE_SIZE || $offset >= $total) {
                break;
            }
        }

        return ['success' => true, 'data' => ['items' => $items], 'error' => null];
    }

    /**
     * Trae todo lo disponible del middleware (fetchAll), aplica $matcher
     * localmente para filtrar y pagina el resultado ya filtrado.
     */
    private function renderFilteredList(Request $request, string $view, ?callable $fetcher, callable $matcher)
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(5, (int) $request->input('perPage', 15)));

        $paginatorOptions = ['path' => $request->url(), 'query' => $request->query()];

        if (! $fetcher) {
            return inertia($view, [
                'items' => new LengthAwarePaginator([], 0, $perPage, $page, $paginatorOptions),
                'filters' => $request->query(),
                'error' => __('The Access Control middleware is not configured or is inactive. Please configure it in Settings > Integrations.'),
            ]);
        }

        $result = $this->fetchAll($fetcher);

        if (! $result['success']) {
            return inertia($view, [
                'items' => new LengthAwarePaginator([], 0, $perPage, $page, $paginatorOptions),
                'filters' => $request->query(),
                'error' => $result['error'],
            ]);
        }

        $filtered = array_values(array_filter($result['data']['items'], $matcher));
        $pageItems = array_slice($filtered, ($page - 1) * $perPage, $perPage);

        return inertia($view, [
            'items' => new LengthAwarePaginator($pageItems, count($filtered), $perPage, $page, $paginatorOptions),
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

        $search = $request->input('search');
        $fullName = $request->input('full_name');
        $employeeNo = $request->input('employee_no');
        $userType = $request->input('user_type');
        $includeSystemAccounts = $request->boolean('include_system_accounts');
        $includeDeleted = $request->boolean('include_deleted');

        return $this->renderFilteredList(
            $request,
            'admin/control-acceso/empleados',
            $service ? fn (array $q) => $service->listEmployees($q) : null,
            function (array $item) use ($search, $fullName, $employeeNo, $userType, $includeSystemAccounts, $includeDeleted) {
                if (! $includeDeleted && ! empty($item['deleted_at'])) {
                    return false;
                }
                if (! $includeSystemAccounts && ($item['is_system_account'] ?? false)) {
                    return false;
                }
                if (! $this->containsCi($item['full_name'] ?? null, $fullName)) {
                    return false;
                }
                if (! $this->containsCi($item['employee_no'] ?? null, $employeeNo)) {
                    return false;
                }
                if (! $this->containsCi($item['user_type'] ?? null, $userType)) {
                    return false;
                }

                return $this->matchesAny([
                    $item['full_name'] ?? null,
                    $item['employee_no'] ?? null,
                    $item['user_type'] ?? null,
                    $item['email'] ?? null,
                ], $search);
            }
        );
    }

    /**
     * Directorio de vehículos (detectados por cámaras ANPR + registrados manualmente).
     */
    public function vehiculos(Request $request)
    {
        $service = $this->resolveService($request);

        $search = $request->input('search');
        $employeeNo = $request->input('employee_no');
        $plateNumber = $request->input('plate_number');
        $brandCode = $request->input('brand_code');
        $isRegistered = $request->has('is_registered') ? $request->boolean('is_registered') : null;

        return $this->renderFilteredList(
            $request,
            'admin/control-acceso/vehiculos',
            $service ? fn (array $q) => $service->listVehicleDirectory($q) : null,
            function (array $item) use ($search, $employeeNo, $plateNumber, $brandCode, $isRegistered) {
                if ($isRegistered !== null && (bool) ($item['is_registered'] ?? false) !== $isRegistered) {
                    return false;
                }
                if (! $this->containsCi($item['plate_number'] ?? null, $plateNumber)) {
                    return false;
                }
                if (! $this->containsCi($item['employee_no'] ?? null, $employeeNo)) {
                    return false;
                }
                if (! ($this->containsCi($item['brand'] ?? null, $brandCode) || $this->containsCi($item['detected_brand_code'] ?? null, $brandCode))) {
                    return false;
                }

                return $this->matchesAny([
                    $item['plate_number'] ?? null,
                    $item['brand'] ?? null,
                    $item['detected_brand_code'] ?? null,
                    $item['employee_no'] ?? null,
                ], $search);
            }
        );
    }

    /**
     * Tarjetas de acceso registradas en el ivms.
     */
    public function tarjetas(Request $request)
    {
        $service = $this->resolveService($request);

        $search = $request->input('search');
        $employeeNo = $request->input('employee_no');
        $cardNo = $request->input('card_no');
        $includeDeleted = $request->boolean('include_deleted');

        return $this->renderFilteredList(
            $request,
            'admin/control-acceso/tarjetas',
            $service ? fn (array $q) => $service->listAccessCards($q) : null,
            function (array $item) use ($search, $employeeNo, $cardNo, $includeDeleted) {
                if (! $includeDeleted && ! empty($item['deleted_at'])) {
                    return false;
                }
                if (! $this->containsCi($item['card_no'] ?? null, $cardNo)) {
                    return false;
                }
                if (! $this->containsCi($item['employee_no'] ?? null, $employeeNo)) {
                    return false;
                }

                return $this->matchesAny([
                    $item['card_no'] ?? null,
                    $item['employee_no'] ?? null,
                    $item['card_type'] ?? null,
                ], $search);
            }
        );
    }

    /**
     * Eventos de acceso peatonal (bitácora de auditoría, solo lectura).
     */
    public function eventosPeatonales(Request $request)
    {
        $service = $this->resolveService($request);

        $search = $request->input('search');
        $employeeNo = $request->input('employee_no');
        $personName = $request->input('person_name');
        $cardNo = $request->input('card_no');
        $onlyIdentityMatches = $request->boolean('only_identity_matches');

        return $this->renderFilteredList(
            $request,
            'admin/control-acceso/eventos-peatonales',
            $service ? fn (array $q) => $service->listAccessEvents($q) : null,
            function (array $item) use ($search, $employeeNo, $personName, $cardNo, $onlyIdentityMatches) {
                if ($onlyIdentityMatches && ! ($item['is_identity_match'] ?? false)) {
                    return false;
                }
                if (! $this->containsCi($item['person_name'] ?? null, $personName)) {
                    return false;
                }
                if (! $this->containsCi($item['card_no'] ?? null, $cardNo)) {
                    return false;
                }
                if (! $this->containsCi($item['employee_no'] ?? null, $employeeNo)) {
                    return false;
                }

                return $this->matchesAny([
                    $item['person_name'] ?? null,
                    $item['employee_no'] ?? null,
                    $item['card_no'] ?? null,
                    $item['verify_mode'] ?? null,
                ], $search);
            }
        );
    }

    /**
     * Eventos de lectura de placas vehiculares / ANPR (bitácora de auditoría, solo lectura).
     * Se enriquece cada evento cruzando la placa contra el directorio de vehículos
     * (/vehicles/directory) para mostrar si el vehículo está dado de alta, a qué
     * empleado pertenece y sus datos registrados (marca, tipo, color).
     */
    public function eventosVehiculares(Request $request)
    {
        $service = $this->resolveService($request);

        $search = $request->input('search');
        $plateNumber = $request->input('plate_number');
        $brandCode = $request->input('brand_code');
        $cameraIp = $request->input('camera_ip');
        $listType = $request->input('list_type');
        $direction = $request->input('direction');
        $isRegistered = $request->has('is_registered') ? $request->boolean('is_registered') : null;

        $fetcher = null;

        if ($service) {
            $directory = $this->buildVehicleDirectoryIndex($service);

            $fetcher = function (array $q) use ($service, $directory) {
                $result = $service->listPlateEvents($q);

                if (! $result['success']) {
                    return $result;
                }

                $result['data']['items'] = array_map(
                    fn (array $event) => $this->enrichPlateEvent($event, $directory),
                    $result['data']['items'] ?? []
                );

                return $result;
            };
        }

        return $this->renderFilteredList(
            $request,
            'admin/control-acceso/eventos-vehiculares',
            $fetcher,
            function (array $item) use ($search, $plateNumber, $brandCode, $cameraIp, $listType, $direction, $isRegistered) {
                if ($isRegistered !== null && (bool) ($item['is_registered'] ?? false) !== $isRegistered) {
                    return false;
                }
                if (! $this->containsCi($item['plate_number'] ?? null, $plateNumber)) {
                    return false;
                }
                if (! ($this->containsCi($item['brand_code'] ?? null, $brandCode) || $this->containsCi($item['registered_brand'] ?? null, $brandCode))) {
                    return false;
                }
                if (! $this->containsCi($item['camera_ip'] ?? null, $cameraIp)) {
                    return false;
                }
                if (! $this->containsCi($item['list_type'] ?? null, $listType)) {
                    return false;
                }
                if (! $this->containsCi($item['direction'] ?? null, $direction)) {
                    return false;
                }

                return $this->matchesAny([
                    $item['plate_number'] ?? null,
                    $item['brand_code'] ?? null,
                    $item['registered_brand'] ?? null,
                    $item['camera_ip'] ?? null,
                    $item['list_type'] ?? null,
                    $item['direction'] ?? null,
                    $item['employee_no'] ?? null,
                ], $search);
            }
        );
    }

    /**
     * Trae el directorio completo de vehículos y lo indexa por placa (mayúsculas)
     * para poder enriquecer los eventos de placa en memoria sin una consulta por fila.
     *
     * @return array<string, array>
     */
    private function buildVehicleDirectoryIndex(ControlAccesoService $service): array
    {
        $result = $this->fetchAll(fn (array $q) => $service->listVehicleDirectory($q));

        if (! $result['success']) {
            return [];
        }

        $index = [];

        foreach ($result['data']['items'] ?? [] as $vehicle) {
            $plate = strtoupper((string) ($vehicle['plate_number'] ?? ''));

            if ($plate !== '') {
                $index[$plate] = $vehicle;
            }
        }

        return $index;
    }

    /**
     * Añade al evento de placa los datos de alta del vehículo (si existe en el
     * directorio): si está registrado, a qué empleado pertenece y sus datos
     * declarados (que pueden diferir de lo detectado por la cámara ANPR).
     */
    private function enrichPlateEvent(array $event, array $directory): array
    {
        $plate = strtoupper((string) ($event['plate_number'] ?? ''));
        $vehicle = $directory[$plate] ?? null;

        $event['is_registered'] = (bool) ($vehicle['is_registered'] ?? false);
        $event['employee_no'] = $vehicle['employee_no'] ?? null;
        $event['registered_brand'] = $vehicle['brand'] ?? null;
        $event['registered_vehicle_type'] = $vehicle['vehicle_type'] ?? null;
        $event['registered_vehicle_color'] = $vehicle['vehicle_color'] ?? null;

        return $event;
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
