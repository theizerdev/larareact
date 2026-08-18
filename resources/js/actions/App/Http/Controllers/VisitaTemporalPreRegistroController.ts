import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
export const showWizard = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showWizard.url(args, options),
    method: 'get',
})

showWizard.definition = {
    methods: ["get","head"],
    url: '/preregistro-visita/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
showWizard.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showWizard.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
showWizard.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showWizard.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
showWizard.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showWizard.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
    const showWizardForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showWizard.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
        showWizardForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showWizard.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::showWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:18
 * @route '/preregistro-visita/{token}'
 */
        showWizardForm.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showWizard.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showWizard.form = showWizardForm
/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::submitWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:63
 * @route '/preregistro-visita/{token}'
 */
export const submitWizard = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitWizard.url(args, options),
    method: 'post',
})

submitWizard.definition = {
    methods: ["post"],
    url: '/preregistro-visita/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::submitWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:63
 * @route '/preregistro-visita/{token}'
 */
submitWizard.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return submitWizard.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::submitWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:63
 * @route '/preregistro-visita/{token}'
 */
submitWizard.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitWizard.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::submitWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:63
 * @route '/preregistro-visita/{token}'
 */
    const submitWizardForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submitWizard.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::submitWizard
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:63
 * @route '/preregistro-visita/{token}'
 */
        submitWizardForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submitWizard.url(args, options),
            method: 'post',
        })
    
    submitWizard.form = submitWizardForm
/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::storeTipoServicio
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
export const storeTipoServicio = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTipoServicio.url(args, options),
    method: 'post',
})

storeTipoServicio.definition = {
    methods: ["post"],
    url: '/preregistro-visita/{token}/tipo-servicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::storeTipoServicio
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
storeTipoServicio.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return storeTipoServicio.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::storeTipoServicio
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
storeTipoServicio.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTipoServicio.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::storeTipoServicio
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
    const storeTipoServicioForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeTipoServicio.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\VisitaTemporalPreRegistroController::storeTipoServicio
 * @see app/Http/Controllers/VisitaTemporalPreRegistroController.php:173
 * @route '/preregistro-visita/{token}/tipo-servicio'
 */
        storeTipoServicioForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeTipoServicio.url(args, options),
            method: 'post',
        })
    
    storeTipoServicio.form = storeTipoServicioForm
const VisitaTemporalPreRegistroController = { showWizard, submitWizard, storeTipoServicio }

export default VisitaTemporalPreRegistroController