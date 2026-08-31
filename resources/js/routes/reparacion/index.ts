import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults, validateParameters } from './../../wayfinder'
import empresa from './empresa'
import consultar6b5ae4 from './consultar'
/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
export const consultar = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

consultar.definition = {
    methods: ["get","head"],
    url: '/reparacion/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
consultar.url = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { numero_orden: args }
    }

    if (Array.isArray(args)) {
        args = {
            numero_orden: args[0],
        }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
        "numero_orden",
    ])

    const parsedArgs = {
        numero_orden: args?.numero_orden,
    }

    return consultar.definition.url
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
consultar.get = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
consultar.head = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: consultar.url(args, options),
    method: 'head',
})

const reparacion = {
    empresa: Object.assign(empresa, empresa),
    consultar: Object.assign(consultar, consultar6b5ae4),
}

export default reparacion