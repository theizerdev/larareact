import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:98
* @route '/admin/contabilidad/plan-cuentas'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const planCuentas = {
    store: Object.assign(store, store),
}

export default planCuentas