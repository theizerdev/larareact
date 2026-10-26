import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
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
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::index
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:20
* @route '/superadministrador/dashboard0'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
export const refreshStripeBalance = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: refreshStripeBalance.url(options),
    method: 'get',
})

refreshStripeBalance.definition = {
    methods: ["get","head"],
    url: '/admin/superadministrador/stripe-balance/refresh',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshStripeBalance.url = (options?: RouteQueryOptions) => {
    return refreshStripeBalance.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshStripeBalance.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: refreshStripeBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshStripeBalance.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: refreshStripeBalance.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
const refreshStripeBalanceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshStripeBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshStripeBalanceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshStripeBalance.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SuperAdminDashboardController::refreshStripeBalance
* @see app/Http/Controllers/Admin/SuperAdminDashboardController.php:291
* @route '/admin/superadministrador/stripe-balance/refresh'
*/
refreshStripeBalanceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: refreshStripeBalance.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

refreshStripeBalance.form = refreshStripeBalanceForm

const SuperAdminDashboardController = { index, refreshStripeBalance }

export default SuperAdminDashboardController