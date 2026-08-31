import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults, validateParameters } from './../../wayfinder'
import empresa from './empresa'
/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
export const reportePdf = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePdf.url(args, options),
    method: 'get',
})

reportePdf.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacion}/reporte-pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return reportePdf.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.get = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePdf.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.head = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportePdf.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
export const consultar = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

consultar.definition = {
    methods: ["get","head"],
    url: '/reparaciones/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
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
* @route '/reparaciones/consultar/{numero_orden?}'
*/
consultar.get = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: consultar.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::consultar
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
consultar.head = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: consultar.url(args, options),
    method: 'head',
})

const reparaciones = {
    reportePdf: Object.assign(reportePdf, reportePdf),
    empresa: Object.assign(empresa, empresa),
    consultar: Object.assign(consultar, consultar),
}

export default reparaciones