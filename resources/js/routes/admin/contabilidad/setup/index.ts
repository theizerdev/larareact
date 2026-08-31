import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/contabilidad/setup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ContabilidadController::store
* @see app/Http/Controllers/Admin/ContabilidadController.php:49
* @route '/admin/contabilidad/setup'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const setup = {
    store: Object.assign(store, store),
}

export default setup