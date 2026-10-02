import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
export const carnetPublico = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnetPublico.url(args, options),
    method: 'get',
})

carnetPublico.definition = {
    methods: ["get","head"],
    url: '/carnet-productor/{productor}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
carnetPublico.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return carnetPublico.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
carnetPublico.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnetPublico.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
carnetPublico.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnetPublico.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
    const carnetPublicoForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnetPublico.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
        carnetPublicoForm.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnetPublico.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnetPublico
 * @see app/Http/Controllers/Admin/ProductorController.php:100
 * @route '/carnet-productor/{productor}'
 */
        carnetPublicoForm.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnetPublico.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    carnetPublico.form = carnetPublicoForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
export const carnet = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})

carnet.definition = {
    methods: ["get","head"],
    url: '/admin/productores/{productor}/carnet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return carnet.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
carnet.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnet.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
    const carnetForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnet.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
        carnetForm.get = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::carnet
 * @see app/Http/Controllers/Admin/ProductorController.php:91
 * @route '/admin/productores/{productor}/carnet'
 */
        carnetForm.head = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    carnet.form = carnetForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsApp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
export const sendCarnetWhatsApp = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsApp.url(args, options),
    method: 'post',
})

sendCarnetWhatsApp.definition = {
    methods: ["post"],
    url: '/admin/productores/{productor}/send-carnet-whatsapp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsApp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
sendCarnetWhatsApp.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return sendCarnetWhatsApp.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsApp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
sendCarnetWhatsApp.post = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendCarnetWhatsApp.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsApp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
    const sendCarnetWhatsAppForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendCarnetWhatsApp.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::sendCarnetWhatsApp
 * @see app/Http/Controllers/Admin/ProductorController.php:109
 * @route '/admin/productores/{productor}/send-carnet-whatsapp'
 */
        sendCarnetWhatsAppForm.post = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendCarnetWhatsApp.url(args, options),
            method: 'post',
        })
    
    sendCarnetWhatsApp.form = sendCarnetWhatsAppForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/productores',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ProductorController::index
 * @see app/Http/Controllers/Admin/ProductorController.php:17
 * @route '/admin/productores'
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
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/productores',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::store
 * @see app/Http/Controllers/Admin/ProductorController.php:73
 * @route '/admin/productores'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
export const generatePreRegistro = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

generatePreRegistro.definition = {
    methods: ["post"],
    url: '/admin/productores/pre-registro',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
generatePreRegistro.url = (options?: RouteQueryOptions) => {
    return generatePreRegistro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
generatePreRegistro.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
    const generatePreRegistroForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generatePreRegistro.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::generatePreRegistro
 * @see app/Http/Controllers/Admin/ProductorController.php:210
 * @route '/admin/productores/pre-registro'
 */
        generatePreRegistroForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generatePreRegistro.url(options),
            method: 'post',
        })
    
    generatePreRegistro.form = generatePreRegistroForm
/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
export const update = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/productores/{productor}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
update.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return update.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
update.put = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
    const updateForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::update
 * @see app/Http/Controllers/Admin/ProductorController.php:173
 * @route '/admin/productores/{productor}'
 */
        updateForm.put = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
export const toggleStatus = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/productores/{productor}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
toggleStatus.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return toggleStatus.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
toggleStatus.patch = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
    const toggleStatusForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::toggleStatus
 * @see app/Http/Controllers/Admin/ProductorController.php:197
 * @route '/admin/productores/{productor}/toggle-status'
 */
        toggleStatusForm.patch = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
export const destroy = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/productores/{productor}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
destroy.url = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { productor: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { productor: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    productor: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        productor: typeof args.productor === 'object'
                ? args.productor.id
                : args.productor,
                }

    return destroy.definition.url
            .replace('{productor}', parsedArgs.productor.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
destroy.delete = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
    const destroyForm = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ProductorController::destroy
 * @see app/Http/Controllers/Admin/ProductorController.php:190
 * @route '/admin/productores/{productor}'
 */
        destroyForm.delete = (args: { productor: string | number | { id: string | number } } | [productor: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ProductorController = { carnetPublico, carnet, sendCarnetWhatsApp, index, store, generatePreRegistro, update, toggleStatus, destroy }

export default ProductorController