import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults, validateParameters } from './../../../wayfinder'
import consultar6b5ae4 from './consultar'
/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
export const consultar = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

consultar.definition = {
    methods: ["get","head"],
    url: '/reparacion/{empresa}/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
consultar.url = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            empresa: args[0],
            numero_orden: args[1],
        }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
        "numero_orden",
    ])

    const parsedArgs = {
        empresa: args.empresa,
        numero_orden: args.numero_orden,
    }

    return consultar.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
consultar.get = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
consultar.head = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: consultar.url(args, options),
    method: 'head',
})

const empresa = {
    consultar: Object.assign(consultar, consultar6b5ae4),
}

export default empresa