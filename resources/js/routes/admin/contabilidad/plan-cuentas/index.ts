import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/plan-cuentas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const planCuentas = {
    store: Object.assign(store, store),
}

export default planCuentas