import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
export const refreshBalance = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: refreshBalance.url(options),
    method: 'get',
})

refreshBalance.definition = {
    methods: ["get","head"],
    url: '/admin/superadministrador/stripe-balance/refresh',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshBalance.url = (options?: RouteQueryOptions) => {
    return refreshBalance.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshBalance.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: refreshBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshBalance.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: refreshBalance.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
const refreshBalanceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshBalanceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshBalanceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshBalance.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

refreshBalance.form = refreshBalanceForm

const stripe = {
    refreshBalance: Object.assign(refreshBalance, refreshBalance),
}

export default stripe