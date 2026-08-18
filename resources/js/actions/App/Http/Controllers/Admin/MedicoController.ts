import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/medicos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\MedicoController::index
 * @see app/Http/Controllers/Admin/MedicoController.php:23
 * @route '/admin/medicos'
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
* @see \App\Http\Controllers\Admin\MedicoController::store
 * @see app/Http/Controllers/Admin/MedicoController.php:122
 * @route '/admin/medicos'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/medicos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::store
 * @see app/Http/Controllers/Admin/MedicoController.php:122
 * @route '/admin/medicos'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::store
 * @see app/Http/Controllers/Admin/MedicoController.php:122
 * @route '/admin/medicos'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::store
 * @see app/Http/Controllers/Admin/MedicoController.php:122
 * @route '/admin/medicos'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::store
 * @see app/Http/Controllers/Admin/MedicoController.php:122
 * @route '/admin/medicos'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\MedicoController::update
 * @see app/Http/Controllers/Admin/MedicoController.php:196
 * @route '/admin/medicos/{medico}'
 */
export const update = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/medicos/{medico}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::update
 * @see app/Http/Controllers/Admin/MedicoController.php:196
 * @route '/admin/medicos/{medico}'
 */
update.url = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { medico: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { medico: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    medico: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        medico: typeof args.medico === 'object'
                ? args.medico.id
                : args.medico,
                }

    return update.definition.url
            .replace('{medico}', parsedArgs.medico.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::update
 * @see app/Http/Controllers/Admin/MedicoController.php:196
 * @route '/admin/medicos/{medico}'
 */
update.put = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::update
 * @see app/Http/Controllers/Admin/MedicoController.php:196
 * @route '/admin/medicos/{medico}'
 */
    const updateForm = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::update
 * @see app/Http/Controllers/Admin/MedicoController.php:196
 * @route '/admin/medicos/{medico}'
 */
        updateForm.put = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\MedicoController::toggleStatus
 * @see app/Http/Controllers/Admin/MedicoController.php:228
 * @route '/admin/medicos/{medico}/toggle-status'
 */
export const toggleStatus = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/medicos/{medico}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::toggleStatus
 * @see app/Http/Controllers/Admin/MedicoController.php:228
 * @route '/admin/medicos/{medico}/toggle-status'
 */
toggleStatus.url = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { medico: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { medico: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    medico: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        medico: typeof args.medico === 'object'
                ? args.medico.id
                : args.medico,
                }

    return toggleStatus.definition.url
            .replace('{medico}', parsedArgs.medico.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::toggleStatus
 * @see app/Http/Controllers/Admin/MedicoController.php:228
 * @route '/admin/medicos/{medico}/toggle-status'
 */
toggleStatus.patch = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::toggleStatus
 * @see app/Http/Controllers/Admin/MedicoController.php:228
 * @route '/admin/medicos/{medico}/toggle-status'
 */
    const toggleStatusForm = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::toggleStatus
 * @see app/Http/Controllers/Admin/MedicoController.php:228
 * @route '/admin/medicos/{medico}/toggle-status'
 */
        toggleStatusForm.patch = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
/**
* @see \App\Http\Controllers\Admin\MedicoController::sendWhatsAppCredentials
 * @see app/Http/Controllers/Admin/MedicoController.php:248
 * @route '/admin/medicos/{medico}/send-whatsapp-credentials'
 */
export const sendWhatsAppCredentials = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppCredentials.url(args, options),
    method: 'post',
})

sendWhatsAppCredentials.definition = {
    methods: ["post"],
    url: '/admin/medicos/{medico}/send-whatsapp-credentials',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::sendWhatsAppCredentials
 * @see app/Http/Controllers/Admin/MedicoController.php:248
 * @route '/admin/medicos/{medico}/send-whatsapp-credentials'
 */
sendWhatsAppCredentials.url = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { medico: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { medico: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    medico: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        medico: typeof args.medico === 'object'
                ? args.medico.id
                : args.medico,
                }

    return sendWhatsAppCredentials.definition.url
            .replace('{medico}', parsedArgs.medico.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::sendWhatsAppCredentials
 * @see app/Http/Controllers/Admin/MedicoController.php:248
 * @route '/admin/medicos/{medico}/send-whatsapp-credentials'
 */
sendWhatsAppCredentials.post = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppCredentials.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::sendWhatsAppCredentials
 * @see app/Http/Controllers/Admin/MedicoController.php:248
 * @route '/admin/medicos/{medico}/send-whatsapp-credentials'
 */
    const sendWhatsAppCredentialsForm = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendWhatsAppCredentials.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::sendWhatsAppCredentials
 * @see app/Http/Controllers/Admin/MedicoController.php:248
 * @route '/admin/medicos/{medico}/send-whatsapp-credentials'
 */
        sendWhatsAppCredentialsForm.post = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendWhatsAppCredentials.url(args, options),
            method: 'post',
        })
    
    sendWhatsAppCredentials.form = sendWhatsAppCredentialsForm
/**
* @see \App\Http\Controllers\Admin\MedicoController::destroy
 * @see app/Http/Controllers/Admin/MedicoController.php:238
 * @route '/admin/medicos/{medico}'
 */
export const destroy = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/medicos/{medico}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\MedicoController::destroy
 * @see app/Http/Controllers/Admin/MedicoController.php:238
 * @route '/admin/medicos/{medico}'
 */
destroy.url = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { medico: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { medico: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    medico: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        medico: typeof args.medico === 'object'
                ? args.medico.id
                : args.medico,
                }

    return destroy.definition.url
            .replace('{medico}', parsedArgs.medico.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MedicoController::destroy
 * @see app/Http/Controllers/Admin/MedicoController.php:238
 * @route '/admin/medicos/{medico}'
 */
destroy.delete = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\MedicoController::destroy
 * @see app/Http/Controllers/Admin/MedicoController.php:238
 * @route '/admin/medicos/{medico}'
 */
    const destroyForm = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MedicoController::destroy
 * @see app/Http/Controllers/Admin/MedicoController.php:238
 * @route '/admin/medicos/{medico}'
 */
        destroyForm.delete = (args: { medico: number | { id: number } } | [medico: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const MedicoController = { index, store, update, toggleStatus, sendWhatsAppCredentials, destroy }

export default MedicoController