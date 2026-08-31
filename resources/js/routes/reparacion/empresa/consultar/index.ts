import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
export const presupuesto = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presupuesto.url(args, options),
    method: 'post',
})

presupuesto.definition = {
    methods: ["post"],
    url: '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
presupuesto.url = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            empresa: args[0],
            numero_orden: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        empresa: args.empresa,
        numero_orden: args.numero_orden,
    }

    return presupuesto.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace('{numero_orden}', parsedArgs.numero_orden.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
presupuesto.post = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presupuesto.url(args, options),
    method: 'post',
})

const consultar = {
    presupuesto: Object.assign(presupuesto, presupuesto),
}

export default consultar