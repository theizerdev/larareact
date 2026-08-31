import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults, validateParameters } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
const showa3c6757cd98b401fcaccf1faa45f7861 = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showa3c6757cd98b401fcaccf1faa45f7861.url(args, options),
    method: 'get',
})

showa3c6757cd98b401fcaccf1faa45f7861.definition = {
    methods: ["get","head"],
    url: '/reparacion/{empresa}/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
showa3c6757cd98b401fcaccf1faa45f7861.url = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions) => {
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

    return showa3c6757cd98b401fcaccf1faa45f7861.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
showa3c6757cd98b401fcaccf1faa45f7861.get = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showa3c6757cd98b401fcaccf1faa45f7861.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparacion/{empresa}/consultar/{numero_orden?}'
*/
showa3c6757cd98b401fcaccf1faa45f7861.head = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showa3c6757cd98b401fcaccf1faa45f7861.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparaciones/{empresa}/consultar/{numero_orden?}'
*/
const showbe6c17884d0a9fe40b755ecf1cbac3d8 = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showbe6c17884d0a9fe40b755ecf1cbac3d8.url(args, options),
    method: 'get',
})

showbe6c17884d0a9fe40b755ecf1cbac3d8.definition = {
    methods: ["get","head"],
    url: '/reparaciones/{empresa}/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparaciones/{empresa}/consultar/{numero_orden?}'
*/
showbe6c17884d0a9fe40b755ecf1cbac3d8.url = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions) => {
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

    return showbe6c17884d0a9fe40b755ecf1cbac3d8.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparaciones/{empresa}/consultar/{numero_orden?}'
*/
showbe6c17884d0a9fe40b755ecf1cbac3d8.get = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showbe6c17884d0a9fe40b755ecf1cbac3d8.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::show
* @see app/Http/Controllers/PublicReparacionTrackingController.php:19
* @route '/reparaciones/{empresa}/consultar/{numero_orden?}'
*/
showbe6c17884d0a9fe40b755ecf1cbac3d8.head = (args: { empresa: string | number, numero_orden?: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showbe6c17884d0a9fe40b755ecf1cbac3d8.url(args, options),
    method: 'head',
})

/**
* Multiple routes resolve to \App\Http\Controllers\PublicReparacionTrackingController::show, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `show['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const show = {
    '/reparacion/{empresa}/consultar/{numero_orden?}': showa3c6757cd98b401fcaccf1faa45f7861,
    '/reparaciones/{empresa}/consultar/{numero_orden?}': showbe6c17884d0a9fe40b755ecf1cbac3d8,
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
export const responderPresupuesto = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: responderPresupuesto.url(args, options),
    method: 'post',
})

responderPresupuesto.definition = {
    methods: ["post"],
    url: '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
responderPresupuesto.url = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions) => {
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

    return responderPresupuesto.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace('{numero_orden}', parsedArgs.numero_orden.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuesto
* @see app/Http/Controllers/PublicReparacionTrackingController.php:210
* @route '/reparacion/{empresa}/consultar/{numero_orden}/presupuesto'
*/
responderPresupuesto.post = (args: { empresa: string | number, numero_orden: string | number } | [empresa: string | number, numero_orden: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: responderPresupuesto.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
const showFallbackf726ee58b0d66d093efbb59c77a8c649 = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showFallbackf726ee58b0d66d093efbb59c77a8c649.url(args, options),
    method: 'get',
})

showFallbackf726ee58b0d66d093efbb59c77a8c649.definition = {
    methods: ["get","head"],
    url: '/reparacion/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
showFallbackf726ee58b0d66d093efbb59c77a8c649.url = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showFallbackf726ee58b0d66d093efbb59c77a8c649.definition.url
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
showFallbackf726ee58b0d66d093efbb59c77a8c649.get = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showFallbackf726ee58b0d66d093efbb59c77a8c649.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparacion/consultar/{numero_orden?}'
*/
showFallbackf726ee58b0d66d093efbb59c77a8c649.head = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showFallbackf726ee58b0d66d093efbb59c77a8c649.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
const showFallback6b29b06e7b0f6891321ddcb280edd4b6 = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showFallback6b29b06e7b0f6891321ddcb280edd4b6.url(args, options),
    method: 'get',
})

showFallback6b29b06e7b0f6891321ddcb280edd4b6.definition = {
    methods: ["get","head"],
    url: '/reparaciones/consultar/{numero_orden?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
showFallback6b29b06e7b0f6891321ddcb280edd4b6.url = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return showFallback6b29b06e7b0f6891321ddcb280edd4b6.definition.url
            .replace('{numero_orden?}', parsedArgs.numero_orden?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
showFallback6b29b06e7b0f6891321ddcb280edd4b6.get = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showFallback6b29b06e7b0f6891321ddcb280edd4b6.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::showFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:42
* @route '/reparaciones/consultar/{numero_orden?}'
*/
showFallback6b29b06e7b0f6891321ddcb280edd4b6.head = (args?: { numero_orden?: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showFallback6b29b06e7b0f6891321ddcb280edd4b6.url(args, options),
    method: 'head',
})

/**
* Multiple routes resolve to \App\Http\Controllers\PublicReparacionTrackingController::showFallback, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `showFallback['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const showFallback = {
    '/reparacion/consultar/{numero_orden?}': showFallbackf726ee58b0d66d093efbb59c77a8c649,
    '/reparaciones/consultar/{numero_orden?}': showFallback6b29b06e7b0f6891321ddcb280edd4b6,
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuestoFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
export const responderPresupuestoFallback = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: responderPresupuestoFallback.url(args, options),
    method: 'post',
})

responderPresupuestoFallback.definition = {
    methods: ["post"],
    url: '/reparacion/consultar/{numero_orden}/presupuesto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuestoFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
responderPresupuestoFallback.url = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return responderPresupuestoFallback.definition.url
            .replace('{numero_orden}', parsedArgs.numero_orden.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicReparacionTrackingController::responderPresupuestoFallback
* @see app/Http/Controllers/PublicReparacionTrackingController.php:218
* @route '/reparacion/consultar/{numero_orden}/presupuesto'
*/
responderPresupuestoFallback.post = (args: { numero_orden: string | number } | [numero_orden: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: responderPresupuestoFallback.url(args, options),
    method: 'post',
})

const PublicReparacionTrackingController = { show, responderPresupuesto, showFallback, responderPresupuestoFallback }

export default PublicReparacionTrackingController