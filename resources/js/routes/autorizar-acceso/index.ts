import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
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
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::post
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
export const post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: post.url(args, options),
    method: 'post',
})

post.definition = {
    methods: ["post"],
    url: '/autorizar-acceso/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::post
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
post.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return post.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::post
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
post.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: post.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::post
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
    const postForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: post.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::post
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:52
 * @route '/autorizar-acceso/{token}'
 */
        postForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: post.url(args, options),
            method: 'post',
        })
    
    post.form = postForm
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
export const check = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: check.url(args, options),
    method: 'get',
})

check.definition = {
    methods: ["get","head"],
    url: '/api/autorizar-acceso/{token}/check',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
check.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return check.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
check.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: check.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
check.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: check.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
    const checkForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: check.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
        checkForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: check.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VisitaAccesoAutorizacionController::check
 * @see app/Http/Controllers/VisitaAccesoAutorizacionController.php:79
 * @route '/api/autorizar-acceso/{token}/check'
 */
        checkForm.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: check.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    check.form = checkForm
const autorizarAcceso = {
    show: Object.assign(show, show),
post: Object.assign(post, post),
check: Object.assign(check, check),
}

export default autorizarAcceso