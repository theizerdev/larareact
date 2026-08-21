import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::store
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
export const store = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/preregistro-visita/{token}/tipo-servicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::store
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
store.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { token: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    token: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        token: args.token,
                }

    return store.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::store
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
store.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::store
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
    const storeForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::store
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
        storeForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const tipoServicio = {
    store: Object.assign(store, store),
}

export default tipoServicio