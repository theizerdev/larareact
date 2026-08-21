import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
export const carnetPublico = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnetPublico.url(args, options),
    method: 'get',
})

carnetPublico.definition = {
    methods: ["get","head"],
    url: '/carnet-empleado/{empleado}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
carnetPublico.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return carnetPublico.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
carnetPublico.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnetPublico.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
carnetPublico.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnetPublico.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
    const carnetPublicoForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnetPublico.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
        carnetPublicoForm.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnetPublico.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnetPublico
 * @see app/Http/Controllers/Admin/EmpleadoController.php:131
 * @route '/carnet-empleado/{empleado}'
 */
        carnetPublicoForm.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/empleados',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::index
 * @see app/Http/Controllers/Admin/EmpleadoController.php:22
 * @route '/admin/empleados'
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
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
export const carnet = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})

carnet.definition = {
    methods: ["get","head"],
    url: '/admin/empleados/{empleado}/carnet',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
carnet.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return carnet.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
carnet.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: carnet.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
carnet.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: carnet.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
    const carnetForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: carnet.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
        carnetForm.get = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: carnet.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::carnet
 * @see app/Http/Controllers/Admin/EmpleadoController.php:77
 * @route '/admin/empleados/{empleado}/carnet'
 */
        carnetForm.head = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::enviarCarnetWhatsApp
 * @see app/Http/Controllers/Admin/EmpleadoController.php:140
 * @route '/admin/empleados/{empleado}/enviar-carnet'
 */
export const enviarCarnetWhatsApp = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviarCarnetWhatsApp.url(args, options),
    method: 'post',
})

enviarCarnetWhatsApp.definition = {
    methods: ["post"],
    url: '/admin/empleados/{empleado}/enviar-carnet',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::enviarCarnetWhatsApp
 * @see app/Http/Controllers/Admin/EmpleadoController.php:140
 * @route '/admin/empleados/{empleado}/enviar-carnet'
 */
enviarCarnetWhatsApp.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return enviarCarnetWhatsApp.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::enviarCarnetWhatsApp
 * @see app/Http/Controllers/Admin/EmpleadoController.php:140
 * @route '/admin/empleados/{empleado}/enviar-carnet'
 */
enviarCarnetWhatsApp.post = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enviarCarnetWhatsApp.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::enviarCarnetWhatsApp
 * @see app/Http/Controllers/Admin/EmpleadoController.php:140
 * @route '/admin/empleados/{empleado}/enviar-carnet'
 */
    const enviarCarnetWhatsAppForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: enviarCarnetWhatsApp.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::enviarCarnetWhatsApp
 * @see app/Http/Controllers/Admin/EmpleadoController.php:140
 * @route '/admin/empleados/{empleado}/enviar-carnet'
 */
        enviarCarnetWhatsAppForm.post = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: enviarCarnetWhatsApp.url(args, options),
            method: 'post',
        })
    
    enviarCarnetWhatsApp.form = enviarCarnetWhatsAppForm
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
 * @see app/Http/Controllers/Admin/EmpleadoController.php:86
 * @route '/admin/empleados'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/empleados',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
 * @see app/Http/Controllers/Admin/EmpleadoController.php:86
 * @route '/admin/empleados'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
 * @see app/Http/Controllers/Admin/EmpleadoController.php:86
 * @route '/admin/empleados'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
 * @see app/Http/Controllers/Admin/EmpleadoController.php:86
 * @route '/admin/empleados'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
 * @see app/Http/Controllers/Admin/EmpleadoController.php:86
 * @route '/admin/empleados'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::generatePreRegistro
 * @see app/Http/Controllers/Admin/EmpleadoController.php:362
 * @route '/admin/empleados/pre-registro'
 */
export const generatePreRegistro = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

generatePreRegistro.definition = {
    methods: ["post"],
    url: '/admin/empleados/pre-registro',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::generatePreRegistro
 * @see app/Http/Controllers/Admin/EmpleadoController.php:362
 * @route '/admin/empleados/pre-registro'
 */
generatePreRegistro.url = (options?: RouteQueryOptions) => {
    return generatePreRegistro.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::generatePreRegistro
 * @see app/Http/Controllers/Admin/EmpleadoController.php:362
 * @route '/admin/empleados/pre-registro'
 */
generatePreRegistro.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generatePreRegistro.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::generatePreRegistro
 * @see app/Http/Controllers/Admin/EmpleadoController.php:362
 * @route '/admin/empleados/pre-registro'
 */
    const generatePreRegistroForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generatePreRegistro.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::generatePreRegistro
 * @see app/Http/Controllers/Admin/EmpleadoController.php:362
 * @route '/admin/empleados/pre-registro'
 */
        generatePreRegistroForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generatePreRegistro.url(options),
            method: 'post',
        })
    
    generatePreRegistro.form = generatePreRegistroForm
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
 * @see app/Http/Controllers/Admin/EmpleadoController.php:208
 * @route '/admin/empleados/{empleado}'
 */
export const update = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/empleados/{empleado}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
 * @see app/Http/Controllers/Admin/EmpleadoController.php:208
 * @route '/admin/empleados/{empleado}'
 */
update.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return update.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
 * @see app/Http/Controllers/Admin/EmpleadoController.php:208
 * @route '/admin/empleados/{empleado}'
 */
update.put = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
 * @see app/Http/Controllers/Admin/EmpleadoController.php:208
 * @route '/admin/empleados/{empleado}'
 */
    const updateForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
 * @see app/Http/Controllers/Admin/EmpleadoController.php:208
 * @route '/admin/empleados/{empleado}'
 */
        updateForm.put = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpleadoController.php:332
 * @route '/admin/empleados/{empleado}/toggle-status'
 */
export const toggleStatus = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/empleados/{empleado}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpleadoController.php:332
 * @route '/admin/empleados/{empleado}/toggle-status'
 */
toggleStatus.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return toggleStatus.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpleadoController.php:332
 * @route '/admin/empleados/{empleado}/toggle-status'
 */
toggleStatus.patch = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpleadoController.php:332
 * @route '/admin/empleados/{empleado}/toggle-status'
 */
    const toggleStatusForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
 * @see app/Http/Controllers/Admin/EmpleadoController.php:332
 * @route '/admin/empleados/{empleado}/toggle-status'
 */
        toggleStatusForm.patch = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
 * @see app/Http/Controllers/Admin/EmpleadoController.php:342
 * @route '/admin/empleados/{empleado}'
 */
export const destroy = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/empleados/{empleado}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
 * @see app/Http/Controllers/Admin/EmpleadoController.php:342
 * @route '/admin/empleados/{empleado}'
 */
destroy.url = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empleado: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empleado: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empleado: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empleado: typeof args.empleado === 'object'
                ? args.empleado.id
                : args.empleado,
                }

    return destroy.definition.url
            .replace('{empleado}', parsedArgs.empleado.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
 * @see app/Http/Controllers/Admin/EmpleadoController.php:342
 * @route '/admin/empleados/{empleado}'
 */
destroy.delete = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
 * @see app/Http/Controllers/Admin/EmpleadoController.php:342
 * @route '/admin/empleados/{empleado}'
 */
    const destroyForm = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
 * @see app/Http/Controllers/Admin/EmpleadoController.php:342
 * @route '/admin/empleados/{empleado}'
 */
        destroyForm.delete = (args: { empleado: string | number | { id: string | number } } | [empleado: string | number | { id: string | number } ] | string | number | { id: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const EmpleadoController = { carnetPublico, index, carnet, enviarCarnetWhatsApp, store, generatePreRegistro, update, toggleStatus, destroy }

export default EmpleadoController