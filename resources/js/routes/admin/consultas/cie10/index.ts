import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/consultas/cie10',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const cie10 = {
    store: Object.assign(store, store),
}

export default cie10