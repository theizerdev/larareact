import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/superadministrador/dashboard0',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::dashboard
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: dashboard.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

dashboard.form = dashboardForm

const superadmin = {
    dashboard: Object.assign(dashboard, dashboard),
}

export default superadmin