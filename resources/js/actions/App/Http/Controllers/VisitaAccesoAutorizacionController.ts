import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
export const show = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/autorizar-acceso/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
show.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
show.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
show.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
    const showForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
        showForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::show
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:14
 * @route '/autorizar-acceso/{token}'
 */
        showForm.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::autorizar
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
export const autorizar = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: autorizar.url(args, options),
    method: 'post',
})

autorizar.definition = {
    methods: ["post"],
    url: '/autorizar-acceso/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::autorizar
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
autorizar.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return autorizar.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::autorizar
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
autorizar.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: autorizar.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::autorizar
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
    const autorizarForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: autorizar.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::autorizar
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
        autorizarForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: autorizar.url(args, options),
            method: 'post',
        })
    
    autorizar.form = autorizarForm
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
export const checkStatus = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkStatus.url(args, options),
    method: 'get',
})

checkStatus.definition = {
    methods: ["get","head"],
    url: '/api/autorizar-acceso/{token}/check',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
checkStatus.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return checkStatus.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
checkStatus.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkStatus.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
checkStatus.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkStatus.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
    const checkStatusForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: checkStatus.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
        checkStatusForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkStatus.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::checkStatus
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
        checkStatusForm.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    checkStatus.form = checkStatusForm
const VisitaAccesoAutorizacionController = { show, autorizar, checkStatus }

export default VisitaAccesoAutorizacionController