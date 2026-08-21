import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:411
 * @route '/admin/tipo-servicios'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/tipo-servicios',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:411
 * @route '/admin/tipo-servicios'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:411
 * @route '/admin/tipo-servicios'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:411
 * @route '/admin/tipo-servicios'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaTemporalController::store
 * @see app/Http/Controllers/Admin/VisitaTemporalController.php:411
 * @route '/admin/tipo-servicios'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const tipoServicios = {
    store: Object.assign(store, store),
}

export default tipoServicios