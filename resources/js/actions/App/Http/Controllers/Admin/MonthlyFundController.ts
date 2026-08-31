import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:40
* @route '/admin/fondo-mensual'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/fondo-mensual',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:40
* @route '/admin/fondo-mensual'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:40
* @route '/admin/fondo-mensual'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:40
* @route '/admin/fondo-mensual'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::closeMonth
* @see app/Http/Controllers/Admin/MonthlyFundController.php:226
* @route '/admin/fondo-mensual/cerrar'
*/
export const closeMonth = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: closeMonth.url(options),
    method: 'post',
})

closeMonth.definition = {
    methods: ["post"],
    url: '/admin/fondo-mensual/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::closeMonth
* @see app/Http/Controllers/Admin/MonthlyFundController.php:226
* @route '/admin/fondo-mensual/cerrar'
*/
closeMonth.url = (options?: RouteQueryOptions) => {
    return closeMonth.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::closeMonth
* @see app/Http/Controllers/Admin/MonthlyFundController.php:226
* @route '/admin/fondo-mensual/cerrar'
*/
closeMonth.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: closeMonth.url(options),
    method: 'post',
})

const MonthlyFundController = { index, closeMonth }

export default MonthlyFundController