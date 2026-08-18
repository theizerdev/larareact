import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/pacientes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PacienteController::index
 * @see app/Http/Controllers/Admin/PacienteController.php:18
 * @route '/admin/pacientes'
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
* @see \App\Http\Controllers\Admin\PacienteController::store
 * @see app/Http/Controllers/Admin/PacienteController.php:97
 * @route '/admin/pacientes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/pacientes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::store
 * @see app/Http/Controllers/Admin/PacienteController.php:97
 * @route '/admin/pacientes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::store
 * @see app/Http/Controllers/Admin/PacienteController.php:97
 * @route '/admin/pacientes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::store
 * @see app/Http/Controllers/Admin/PacienteController.php:97
 * @route '/admin/pacientes'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::store
 * @see app/Http/Controllers/Admin/PacienteController.php:97
 * @route '/admin/pacientes'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\PacienteController::update
 * @see app/Http/Controllers/Admin/PacienteController.php:159
 * @route '/admin/pacientes/{paciente}'
 */
export const update = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/pacientes/{paciente}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::update
 * @see app/Http/Controllers/Admin/PacienteController.php:159
 * @route '/admin/pacientes/{paciente}'
 */
update.url = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { paciente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { paciente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    paciente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        paciente: typeof args.paciente === 'object'
                ? args.paciente.id
                : args.paciente,
                }

    return update.definition.url
            .replace('{paciente}', parsedArgs.paciente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::update
 * @see app/Http/Controllers/Admin/PacienteController.php:159
 * @route '/admin/pacientes/{paciente}'
 */
update.put = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::update
 * @see app/Http/Controllers/Admin/PacienteController.php:159
 * @route '/admin/pacientes/{paciente}'
 */
    const updateForm = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::update
 * @see app/Http/Controllers/Admin/PacienteController.php:159
 * @route '/admin/pacientes/{paciente}'
 */
        updateForm.put = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\PacienteController::toggleStatus
 * @see app/Http/Controllers/Admin/PacienteController.php:210
 * @route '/admin/pacientes/{paciente}/toggle-status'
 */
export const toggleStatus = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/pacientes/{paciente}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::toggleStatus
 * @see app/Http/Controllers/Admin/PacienteController.php:210
 * @route '/admin/pacientes/{paciente}/toggle-status'
 */
toggleStatus.url = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { paciente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { paciente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    paciente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        paciente: typeof args.paciente === 'object'
                ? args.paciente.id
                : args.paciente,
                }

    return toggleStatus.definition.url
            .replace('{paciente}', parsedArgs.paciente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::toggleStatus
 * @see app/Http/Controllers/Admin/PacienteController.php:210
 * @route '/admin/pacientes/{paciente}/toggle-status'
 */
toggleStatus.patch = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::toggleStatus
 * @see app/Http/Controllers/Admin/PacienteController.php:210
 * @route '/admin/pacientes/{paciente}/toggle-status'
 */
    const toggleStatusForm = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::toggleStatus
 * @see app/Http/Controllers/Admin/PacienteController.php:210
 * @route '/admin/pacientes/{paciente}/toggle-status'
 */
        toggleStatusForm.patch = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\PacienteController::sendWhatsAppWelcome
 * @see app/Http/Controllers/Admin/PacienteController.php:230
 * @route '/admin/pacientes/{paciente}/send-whatsapp-welcome'
 */
export const sendWhatsAppWelcome = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppWelcome.url(args, options),
    method: 'post',
})

sendWhatsAppWelcome.definition = {
    methods: ["post"],
    url: '/admin/pacientes/{paciente}/send-whatsapp-welcome',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::sendWhatsAppWelcome
 * @see app/Http/Controllers/Admin/PacienteController.php:230
 * @route '/admin/pacientes/{paciente}/send-whatsapp-welcome'
 */
sendWhatsAppWelcome.url = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { paciente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { paciente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    paciente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        paciente: typeof args.paciente === 'object'
                ? args.paciente.id
                : args.paciente,
                }

    return sendWhatsAppWelcome.definition.url
            .replace('{paciente}', parsedArgs.paciente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::sendWhatsAppWelcome
 * @see app/Http/Controllers/Admin/PacienteController.php:230
 * @route '/admin/pacientes/{paciente}/send-whatsapp-welcome'
 */
sendWhatsAppWelcome.post = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppWelcome.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::sendWhatsAppWelcome
 * @see app/Http/Controllers/Admin/PacienteController.php:230
 * @route '/admin/pacientes/{paciente}/send-whatsapp-welcome'
 */
    const sendWhatsAppWelcomeForm = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendWhatsAppWelcome.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::sendWhatsAppWelcome
 * @see app/Http/Controllers/Admin/PacienteController.php:230
 * @route '/admin/pacientes/{paciente}/send-whatsapp-welcome'
 */
        sendWhatsAppWelcomeForm.post = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendWhatsAppWelcome.url(args, options),
            method: 'post',
        })
    
    sendWhatsAppWelcome.form = sendWhatsAppWelcomeForm
/**
* @see \App\Http\Controllers\Admin\PacienteController::destroy
 * @see app/Http/Controllers/Admin/PacienteController.php:220
 * @route '/admin/pacientes/{paciente}'
 */
export const destroy = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/pacientes/{paciente}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PacienteController::destroy
 * @see app/Http/Controllers/Admin/PacienteController.php:220
 * @route '/admin/pacientes/{paciente}'
 */
destroy.url = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { paciente: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { paciente: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    paciente: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        paciente: typeof args.paciente === 'object'
                ? args.paciente.id
                : args.paciente,
                }

    return destroy.definition.url
            .replace('{paciente}', parsedArgs.paciente.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PacienteController::destroy
 * @see app/Http/Controllers/Admin/PacienteController.php:220
 * @route '/admin/pacientes/{paciente}'
 */
destroy.delete = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\PacienteController::destroy
 * @see app/Http/Controllers/Admin/PacienteController.php:220
 * @route '/admin/pacientes/{paciente}'
 */
    const destroyForm = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PacienteController::destroy
 * @see app/Http/Controllers/Admin/PacienteController.php:220
 * @route '/admin/pacientes/{paciente}'
 */
        destroyForm.delete = (args: { paciente: number | { id: number } } | [paciente: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const PacienteController = { index, store, update, toggleStatus, sendWhatsAppWelcome, destroy }

export default PacienteController