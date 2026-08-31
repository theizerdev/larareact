import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/asientos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:171
* @route '/admin/contabilidad/asientos'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const asientos = {
    store: Object.assign(store, store),
}

export default asientos