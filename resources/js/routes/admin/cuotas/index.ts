import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CreditoController::pagar
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
export const pagar = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(args, options),
    method: 'post',
})

pagar.definition = {
    methods: ["post"],
    url: '/admin/cuotas/{cuota}/pagar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditoController::pagar
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
pagar.url = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cuota: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cuota: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cuota: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cuota: typeof args.cuota === 'object'
                ? args.cuota.id
                : args.cuota,
                }

    return pagar.definition.url
            .replace('{cuota}', parsedArgs.cuota.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditoController::pagar
 * @see app/Http/Controllers/Admin/CreditoController.php:260
 * @route '/admin/cuotas/{cuota}/pagar'
 */
pagar.post = (args: { cuota: number | { id: number } } | [cuota: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pagar.url(args, options),
    method: 'post',
})
const cuotas = {
    pagar: Object.assign(pagar, pagar),
}

export default cuotas