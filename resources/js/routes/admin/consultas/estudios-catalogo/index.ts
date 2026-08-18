import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/consultas/estudios-catalogo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const estudiosCatalogo = {
    store: Object.assign(store, store),
}

export default estudiosCatalogo