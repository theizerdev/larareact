import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
export const publico = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})

publico.definition = {
    methods: ["get","head"],
    url: '/carnet-productor/{productor}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
publico.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return publico.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
publico.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
publico.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: publico.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
    const publicoForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: publico.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
        publicoForm.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::publico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
        publicoForm.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    publico.form = publicoForm