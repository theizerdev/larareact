import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
export const show = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/pase-digital/{uuid}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
show.url = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { uuid: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    uuid: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        uuid: args.uuid,
                }

    return show.definition.url
            .replace('{uuid}', parsedArgs.uuid.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
show.get = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
show.head = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
    const showForm = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
        showForm.get = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::show
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:634
 * @route '/pase-digital/{uuid}'
 */
        showForm.head = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::datosAcceso
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:652
 * @route '/pase-digital/{uuid}/datos-acceso'
 */
export const datosAcceso = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: datosAcceso.url(args, options),
    method: 'post',
})

datosAcceso.definition = {
    methods: ["post"],
    url: '/pase-digital/{uuid}/datos-acceso',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::datosAcceso
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:652
 * @route '/pase-digital/{uuid}/datos-acceso'
 */
datosAcceso.url = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { uuid: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    uuid: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        uuid: args.uuid,
                }

    return datosAcceso.definition.url
            .replace('{uuid}', parsedArgs.uuid.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::datosAcceso
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:652
 * @route '/pase-digital/{uuid}/datos-acceso'
 */
datosAcceso.post = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: datosAcceso.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::datosAcceso
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:652
 * @route '/pase-digital/{uuid}/datos-acceso'
 */
    const datosAccesoForm = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: datosAcceso.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::datosAcceso
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:652
 * @route '/pase-digital/{uuid}/datos-acceso'
 */
        datosAccesoForm.post = (args: { uuid: string | number } | [uuid: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: datosAcceso.url(args, options),
            method: 'post',
        })
    
    datosAcceso.form = datosAccesoForm
const paseDigitalVisita = {
    show: Object.assign(show, show),
datosAcceso: Object.assign(datosAcceso, datosAcceso),
}

export default paseDigitalVisita