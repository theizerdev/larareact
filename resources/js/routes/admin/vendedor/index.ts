import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::dashboard
 * @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
 * @route '/admin/vendedor/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/admin/vendedor/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::dashboard
 * @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
 * @route '/admin/vendedor/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::dashboard
 * @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
 * @route '/admin/vendedor/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::dashboard
 * @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
 * @route '/admin/vendedor/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})
const vendedor = {
    dashboard: Object.assign(dashboard, dashboard),
}

export default vendedor