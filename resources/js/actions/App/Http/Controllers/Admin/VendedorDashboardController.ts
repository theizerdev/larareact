import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/vendedor/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\VendedorDashboardController::index
* @see app/Http/Controllers/Admin/VendedorDashboardController.php:23
* @route '/admin/vendedor/dashboard'
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

const VendedorDashboardController = { index }

export default VendedorDashboardController