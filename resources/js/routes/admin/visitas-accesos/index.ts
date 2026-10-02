import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import garita from './garita'
import invitaciones from './invitaciones'
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/visitas-accesos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::index
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:30
 * @route '/admin/visitas-accesos'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
export const buscarEntidades = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarEntidades.url(options),
    method: 'get',
})

buscarEntidades.definition = {
    methods: ["get","head"],
    url: '/admin/visitas-accesos/buscar-entidades',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
buscarEntidades.url = (options?: RouteQueryOptions) => {
    return buscarEntidades.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
buscarEntidades.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: buscarEntidades.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
buscarEntidades.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: buscarEntidades.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
    const buscarEntidadesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: buscarEntidades.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
        buscarEntidadesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarEntidades.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::buscarEntidades
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:175
 * @route '/admin/visitas-accesos/buscar-entidades'
 */
        buscarEntidadesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: buscarEntidades.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    buscarEntidades.form = buscarEntidadesForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:256
 * @route '/admin/visitas-accesos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/visitas-accesos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:256
 * @route '/admin/visitas-accesos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:256
 * @route '/admin/visitas-accesos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:256
 * @route '/admin/visitas-accesos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:256
 * @route '/admin/visitas-accesos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::solicitarAutorizacionWhatsapp
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:381
 * @route '/admin/visitas-accesos/solicitar-autorizacion-whatsapp'
 */
export const solicitarAutorizacionWhatsapp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: solicitarAutorizacionWhatsapp.url(options),
    method: 'post',
})

solicitarAutorizacionWhatsapp.definition = {
    methods: ["post"],
    url: '/admin/visitas-accesos/solicitar-autorizacion-whatsapp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::solicitarAutorizacionWhatsapp
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:381
 * @route '/admin/visitas-accesos/solicitar-autorizacion-whatsapp'
 */
solicitarAutorizacionWhatsapp.url = (options?: RouteQueryOptions) => {
    return solicitarAutorizacionWhatsapp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::solicitarAutorizacionWhatsapp
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:381
 * @route '/admin/visitas-accesos/solicitar-autorizacion-whatsapp'
 */
solicitarAutorizacionWhatsapp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: solicitarAutorizacionWhatsapp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::solicitarAutorizacionWhatsapp
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:381
 * @route '/admin/visitas-accesos/solicitar-autorizacion-whatsapp'
 */
    const solicitarAutorizacionWhatsappForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: solicitarAutorizacionWhatsapp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::solicitarAutorizacionWhatsapp
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:381
 * @route '/admin/visitas-accesos/solicitar-autorizacion-whatsapp'
 */
        solicitarAutorizacionWhatsappForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: solicitarAutorizacionWhatsapp.url(options),
            method: 'post',
        })
    
    solicitarAutorizacionWhatsapp.form = solicitarAutorizacionWhatsappForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::marcarSalida
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:337
 * @route '/admin/visitas-accesos/{visitaAcceso}/marcar-salida'
 */
export const marcarSalida = (args: { visitaAcceso: string | number | { id: string | number } } | [visitaAcceso: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: marcarSalida.url(args, options),
    method: 'patch',
})

marcarSalida.definition = {
    methods: ["patch"],
    url: '/admin/visitas-accesos/{visitaAcceso}/marcar-salida',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::marcarSalida
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:337
 * @route '/admin/visitas-accesos/{visitaAcceso}/marcar-salida'
 */
marcarSalida.url = (args: { visitaAcceso: string | number | { id: string | number } } | [visitaAcceso: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { visitaAcceso: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { visitaAcceso: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    visitaAcceso: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        visitaAcceso: typeof args.visitaAcceso === 'object'
                ? args.visitaAcceso.id
                : args.visitaAcceso,
                }

    return marcarSalida.definition.url
            .replace('{visitaAcceso}', parsedArgs.visitaAcceso.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::marcarSalida
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:337
 * @route '/admin/visitas-accesos/{visitaAcceso}/marcar-salida'
 */
marcarSalida.patch = (args: { visitaAcceso: string | number | { id: string | number } } | [visitaAcceso: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: marcarSalida.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::marcarSalida
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:337
 * @route '/admin/visitas-accesos/{visitaAcceso}/marcar-salida'
 */
    const marcarSalidaForm = (args: { visitaAcceso: string | number | { id: string | number } } | [visitaAcceso: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: marcarSalida.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::marcarSalida
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:337
 * @route '/admin/visitas-accesos/{visitaAcceso}/marcar-salida'
 */
        marcarSalidaForm.patch = (args: { visitaAcceso: string | number | { id: string | number } } | [visitaAcceso: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: marcarSalida.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    marcarSalida.form = marcarSalidaForm
const visitasAccesos = {
    garita: Object.assign(garita, garita),
index: Object.assign(index, index),
buscarEntidades: Object.assign(buscarEntidades, buscarEntidades),
store: Object.assign(store, store),
invitaciones: Object.assign(invitaciones, invitaciones),
solicitarAutorizacionWhatsapp: Object.assign(solicitarAutorizacionWhatsapp, solicitarAutorizacionWhatsapp),
marcarSalida: Object.assign(marcarSalida, marcarSalida),
}

export default visitasAccesos