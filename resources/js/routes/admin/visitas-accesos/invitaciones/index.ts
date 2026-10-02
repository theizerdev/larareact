import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:455
 * @route '/admin/visitas-accesos/invitaciones'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/visitas-accesos/invitaciones',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:455
 * @route '/admin/visitas-accesos/invitaciones'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:455
 * @route '/admin/visitas-accesos/invitaciones'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:455
 * @route '/admin/visitas-accesos/invitaciones'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::store
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:455
 * @route '/admin/visitas-accesos/invitaciones'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::canjear
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:549
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/canjear'
 */
export const canjear = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: canjear.url(args, options),
    method: 'post',
})

canjear.definition = {
    methods: ["post"],
    url: '/admin/visitas-accesos/invitaciones/{invitacion}/canjear',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::canjear
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:549
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/canjear'
 */
canjear.url = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invitacion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { invitacion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    invitacion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invitacion: typeof args.invitacion === 'object'
                ? args.invitacion.id
                : args.invitacion,
                }

    return canjear.definition.url
            .replace('{invitacion}', parsedArgs.invitacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::canjear
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:549
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/canjear'
 */
canjear.post = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: canjear.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::canjear
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:549
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/canjear'
 */
    const canjearForm = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: canjear.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::canjear
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:549
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/canjear'
 */
        canjearForm.post = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: canjear.url(args, options),
            method: 'post',
        })
    
    canjear.form = canjearForm
/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::cancelar
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:628
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar'
 */
export const cancelar = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancelar.url(args, options),
    method: 'patch',
})

cancelar.definition = {
    methods: ["patch"],
    url: '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::cancelar
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:628
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar'
 */
cancelar.url = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { invitacion: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { invitacion: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    invitacion: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        invitacion: typeof args.invitacion === 'object'
                ? args.invitacion.id
                : args.invitacion,
                }

    return cancelar.definition.url
            .replace('{invitacion}', parsedArgs.invitacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::cancelar
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:628
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar'
 */
cancelar.patch = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancelar.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::cancelar
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:628
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar'
 */
    const cancelarForm = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelar.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\VisitaAccesoController::cancelar
 * @see app/Http/Controllers/Admin/VisitaAccesoController.php:628
 * @route '/admin/visitas-accesos/invitaciones/{invitacion}/cancelar'
 */
        cancelarForm.patch = (args: { invitacion: string | number | { id: string | number } } | [invitacion: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelar.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    cancelar.form = cancelarForm
const invitaciones = {
    store: Object.assign(store, store),
canjear: Object.assign(canjear, canjear),
cancelar: Object.assign(cancelar, cancelar),
}

export default invitaciones