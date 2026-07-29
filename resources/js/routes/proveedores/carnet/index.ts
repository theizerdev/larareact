import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
export const publico = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})

publico.definition = {
    methods: ["get","head"],
    url: '/carnet-proveedor/{proveedor}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
publico.url = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { proveedor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { proveedor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    proveedor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        proveedor: typeof args.proveedor === 'object'
                ? args.proveedor.id
                : args.proveedor,
                }

    return publico.definition.url
            .replace('{proveedor}', parsedArgs.proveedor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
publico.get = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: publico.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
publico.head = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: publico.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
    const publicoForm = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: publico.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
        publicoForm.get = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProveedorController::publico
 * @see app/Http/Controllers/Admin/ProveedorController.php:176
 * @route '/carnet-proveedor/{proveedor}'
 */
        publicoForm.head = (args: { proveedor: string | number | { id: string | number } } | [proveedor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: publico.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    publico.form = publicoForm