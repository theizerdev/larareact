import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
 */
export const showWizard = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showWizard.url(args, options),
    method: 'get',
})

showWizard.definition = {
    methods: ["get","head"],
    url: '/preregistro-empleado/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
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
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
 */
showWizard.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showWizard.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
 */
showWizard.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showWizard.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
 */
    const showWizardForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showWizard.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
 */
        showWizardForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showWizard.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::showWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:18
 * @route '/preregistro-empleado/{token}'
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
* @see \App\Http\Controllers\EmpleadoPreRegistroController::submitWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:55
 * @route '/preregistro-empleado/{token}'
 */
export const submitWizard = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitWizard.url(args, options),
    method: 'post',
})

submitWizard.definition = {
    methods: ["post"],
    url: '/preregistro-empleado/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::submitWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:55
 * @route '/preregistro-empleado/{token}'
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
* @see \App\Http\Controllers\EmpleadoPreRegistroController::submitWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:55
 * @route '/preregistro-empleado/{token}'
 */
submitWizard.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitWizard.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::submitWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:55
 * @route '/preregistro-empleado/{token}'
 */
    const submitWizardForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submitWizard.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EmpleadoPreRegistroController::submitWizard
 * @see app/Http/Controllers/EmpleadoPreRegistroController.php:55
 * @route '/preregistro-empleado/{token}'
 */
        submitWizardForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submitWizard.url(args, options),
            method: 'post',
        })
    
    submitWizard.form = submitWizardForm
const EmpleadoPreRegistroController = { showWizard, submitWizard }

export default EmpleadoPreRegistroController