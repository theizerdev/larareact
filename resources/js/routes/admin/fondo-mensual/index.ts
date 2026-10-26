import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
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
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::index
* @see app/Http/Controllers/Admin/MonthlyFundController.php:41
* @route '/admin/fondo-mensual'
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
* @see \App\Http\Controllers\Admin\MonthlyFundController::cerrar
* @see app/Http/Controllers/Admin/MonthlyFundController.php:251
* @route '/admin/fondo-mensual/cerrar'
*/
export const cerrar = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

cerrar.definition = {
    methods: ["post"],
    url: '/admin/fondo-mensual/cerrar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::cerrar
* @see app/Http/Controllers/Admin/MonthlyFundController.php:251
* @route '/admin/fondo-mensual/cerrar'
*/
cerrar.url = (options?: RouteQueryOptions) => {
    return cerrar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::cerrar
* @see app/Http/Controllers/Admin/MonthlyFundController.php:251
* @route '/admin/fondo-mensual/cerrar'
*/
cerrar.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cerrar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::cerrar
* @see app/Http/Controllers/Admin/MonthlyFundController.php:251
* @route '/admin/fondo-mensual/cerrar'
*/
const cerrarForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cerrar.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\MonthlyFundController::cerrar
* @see app/Http/Controllers/Admin/MonthlyFundController.php:251
* @route '/admin/fondo-mensual/cerrar'
*/
cerrarForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cerrar.url(options),
    method: 'post',
})

cerrar.form = cerrarForm

const fondoMensual = {
    index: Object.assign(index, index),
    cerrar: Object.assign(cerrar, cerrar),
}

export default fondoMensual