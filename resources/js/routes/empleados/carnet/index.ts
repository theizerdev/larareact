import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
export const publico = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})

publico.definition = {
    methods: ["get","head"],
    url: '/carnet-empleado/{empleado}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
publico.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return publico.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
publico.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
publico.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: publico.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
    const publicoForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: publico.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
        publicoForm.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::publico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
        publicoForm.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    publico.form = publicoForm
const carnet = {
    publico: Object.assign(publico, publico),
}

export default carnet