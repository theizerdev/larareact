import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/citas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\CitaController::index
 * @see app/Http/Controllers/Admin/CitaController.php:30
 * @route '/admin/citas'
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
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
export const getSlots = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSlots.url(options),
    method: 'get',
})

getSlots.definition = {
    methods: ["get","head"],
    url: '/admin/citas/slots',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
getSlots.url = (options?: RouteQueryOptions) => {
    return getSlots.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
getSlots.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getSlots.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
getSlots.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getSlots.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
    const getSlotsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: getSlots.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
        getSlotsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getSlots.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\CitaController::getSlots
 * @see app/Http/Controllers/Admin/CitaController.php:149
 * @route '/admin/citas/slots'
 */
        getSlotsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: getSlots.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    getSlots.form = getSlotsForm
/**
* @see \App\Http\Controllers\Admin\CitaController::store
 * @see app/Http/Controllers/Admin/CitaController.php:167
 * @route '/admin/citas'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/citas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::store
 * @see app/Http/Controllers/Admin/CitaController.php:167
 * @route '/admin/citas'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::store
 * @see app/Http/Controllers/Admin/CitaController.php:167
 * @route '/admin/citas'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::store
 * @see app/Http/Controllers/Admin/CitaController.php:167
 * @route '/admin/citas'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::store
 * @see app/Http/Controllers/Admin/CitaController.php:167
 * @route '/admin/citas'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\CitaController::update
 * @see app/Http/Controllers/Admin/CitaController.php:221
 * @route '/admin/citas/{cita}'
 */
export const update = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/citas/{cita}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::update
 * @see app/Http/Controllers/Admin/CitaController.php:221
 * @route '/admin/citas/{cita}'
 */
update.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return update.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::update
 * @see app/Http/Controllers/Admin/CitaController.php:221
 * @route '/admin/citas/{cita}'
 */
update.put = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::update
 * @see app/Http/Controllers/Admin/CitaController.php:221
 * @route '/admin/citas/{cita}'
 */
    const updateForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::update
 * @see app/Http/Controllers/Admin/CitaController.php:221
 * @route '/admin/citas/{cita}'
 */
        updateForm.put = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\CitaController::move
 * @see app/Http/Controllers/Admin/CitaController.php:263
 * @route '/admin/citas/{cita}/mover'
 */
export const move = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: move.url(args, options),
    method: 'patch',
})

move.definition = {
    methods: ["patch"],
    url: '/admin/citas/{cita}/mover',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::move
 * @see app/Http/Controllers/Admin/CitaController.php:263
 * @route '/admin/citas/{cita}/mover'
 */
move.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return move.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::move
 * @see app/Http/Controllers/Admin/CitaController.php:263
 * @route '/admin/citas/{cita}/mover'
 */
move.patch = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: move.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::move
 * @see app/Http/Controllers/Admin/CitaController.php:263
 * @route '/admin/citas/{cita}/mover'
 */
    const moveForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: move.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::move
 * @see app/Http/Controllers/Admin/CitaController.php:263
 * @route '/admin/citas/{cita}/mover'
 */
        moveForm.patch = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: move.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    move.form = moveForm
/**
* @see \App\Http\Controllers\Admin\CitaController::updateEstado
 * @see app/Http/Controllers/Admin/CitaController.php:294
 * @route '/admin/citas/{cita}/estado'
 */
export const updateEstado = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateEstado.url(args, options),
    method: 'patch',
})

updateEstado.definition = {
    methods: ["patch"],
    url: '/admin/citas/{cita}/estado',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::updateEstado
 * @see app/Http/Controllers/Admin/CitaController.php:294
 * @route '/admin/citas/{cita}/estado'
 */
updateEstado.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return updateEstado.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::updateEstado
 * @see app/Http/Controllers/Admin/CitaController.php:294
 * @route '/admin/citas/{cita}/estado'
 */
updateEstado.patch = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateEstado.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::updateEstado
 * @see app/Http/Controllers/Admin/CitaController.php:294
 * @route '/admin/citas/{cita}/estado'
 */
    const updateEstadoForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateEstado.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::updateEstado
 * @see app/Http/Controllers/Admin/CitaController.php:294
 * @route '/admin/citas/{cita}/estado'
 */
        updateEstadoForm.patch = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateEstado.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateEstado.form = updateEstadoForm
/**
* @see \App\Http\Controllers\Admin\CitaController::destroy
 * @see app/Http/Controllers/Admin/CitaController.php:370
 * @route '/admin/citas/{cita}'
 */
export const destroy = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/citas/{cita}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::destroy
 * @see app/Http/Controllers/Admin/CitaController.php:370
 * @route '/admin/citas/{cita}'
 */
destroy.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return destroy.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::destroy
 * @see app/Http/Controllers/Admin/CitaController.php:370
 * @route '/admin/citas/{cita}'
 */
destroy.delete = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::destroy
 * @see app/Http/Controllers/Admin/CitaController.php:370
 * @route '/admin/citas/{cita}'
 */
    const destroyForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::destroy
 * @see app/Http/Controllers/Admin/CitaController.php:370
 * @route '/admin/citas/{cita}'
 */
        destroyForm.delete = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\Admin\CitaController::sendWhatsAppRecordatorio
 * @see app/Http/Controllers/Admin/CitaController.php:378
 * @route '/admin/citas/{cita}/send-whatsapp-reminder'
 */
export const sendWhatsAppRecordatorio = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppRecordatorio.url(args, options),
    method: 'post',
})

sendWhatsAppRecordatorio.definition = {
    methods: ["post"],
    url: '/admin/citas/{cita}/send-whatsapp-reminder',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CitaController::sendWhatsAppRecordatorio
 * @see app/Http/Controllers/Admin/CitaController.php:378
 * @route '/admin/citas/{cita}/send-whatsapp-reminder'
 */
sendWhatsAppRecordatorio.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return sendWhatsAppRecordatorio.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CitaController::sendWhatsAppRecordatorio
 * @see app/Http/Controllers/Admin/CitaController.php:378
 * @route '/admin/citas/{cita}/send-whatsapp-reminder'
 */
sendWhatsAppRecordatorio.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendWhatsAppRecordatorio.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\CitaController::sendWhatsAppRecordatorio
 * @see app/Http/Controllers/Admin/CitaController.php:378
 * @route '/admin/citas/{cita}/send-whatsapp-reminder'
 */
    const sendWhatsAppRecordatorioForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendWhatsAppRecordatorio.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CitaController::sendWhatsAppRecordatorio
 * @see app/Http/Controllers/Admin/CitaController.php:378
 * @route '/admin/citas/{cita}/send-whatsapp-reminder'
 */
        sendWhatsAppRecordatorioForm.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendWhatsAppRecordatorio.url(args, options),
            method: 'post',
        })
    
    sendWhatsAppRecordatorio.form = sendWhatsAppRecordatorioForm
const CitaController = { index, getSlots, store, update, move, updateEstado, destroy, sendWhatsAppRecordatorio }

export default CitaController