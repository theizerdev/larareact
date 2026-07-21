import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
export const wizard = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: wizard.url(args, options),
    method: 'get',
})

wizard.definition = {
    methods: ["get","head"],
    url: '/preregistro/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
wizard.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return wizard.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
wizard.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: wizard.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
wizard.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: wizard.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
    const wizardForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: wizard.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
        wizardForm.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: wizard.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ProveedorPreRegistroController::wizard
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:19
 * @route '/preregistro/{token}'
 */
        wizardForm.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: wizard.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    wizard.form = wizardForm
/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::submit
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:54
 * @route '/preregistro/{token}'
 */
export const submit = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/preregistro/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::submit
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:54
 * @route '/preregistro/{token}'
 */
submit.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return submit.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ProveedorPreRegistroController::submit
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:54
 * @route '/preregistro/{token}'
 */
submit.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ProveedorPreRegistroController::submit
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:54
 * @route '/preregistro/{token}'
 */
    const submitForm = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ProveedorPreRegistroController::submit
 * @see app/Http/Controllers/ProveedorPreRegistroController.php:54
 * @route '/preregistro/{token}'
 */
        submitForm.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
const preregistro = {
    wizard: Object.assign(wizard, wizard),
submit: Object.assign(submit, submit),
}

export default preregistro