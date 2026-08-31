import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:18
* @route '/superadministrador/dashboard0'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/superadministrador/dashboard0',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:18
* @route '/superadministrador/dashboard0'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:18
* @route '/superadministrador/dashboard0'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:18
* @route '/superadministrador/dashboard0'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

const SuperAdminDashboardController = { index }

export default SuperAdminDashboardController