import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
export const presupuesto = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presupuesto.url(args, options),
    method: 'post',
})

presupuesto.definition = {
    methods: ["post"],
    url: '/reparacion/consultar/{numero_orden}/presupuesto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
presupuesto.url = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { numero_orden: args }
    }

    if (Array.isArray(args)) {
        args = {
            numero_orden: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        numero_orden: args.numero_orden,
    }

    return presupuesto.definition.url
            .replace('{numero_orden}', parsedArgs.numero_orden.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::presupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
presupuesto.post = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presupuesto.url(args, options),
    method: 'post',
})

const consultar = {
    presupuesto: Object.assign(presupuesto, presupuesto),
}

export default consultar