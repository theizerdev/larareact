import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/garita',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:738
 * @route '/garita'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const garita = {
    show: Object.assign(show, show),
}

export default garita