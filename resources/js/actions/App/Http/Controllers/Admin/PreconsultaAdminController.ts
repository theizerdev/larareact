import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::generarLinkCita
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:93
 * @route '/admin/citas/{cita}/generar-preconsulta'
 */
export const generarLinkCita = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generarLinkCita.url(args, options),
    method: 'post',
})

generarLinkCita.definition = {
    methods: ["post"],
    url: '/admin/citas/{cita}/generar-preconsulta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::generarLinkCita
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:93
 * @route '/admin/citas/{cita}/generar-preconsulta'
 */
generarLinkCita.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return generarLinkCita.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::generarLinkCita
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:93
 * @route '/admin/citas/{cita}/generar-preconsulta'
 */
generarLinkCita.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generarLinkCita.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::generarLinkCita
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:93
 * @route '/admin/citas/{cita}/generar-preconsulta'
 */
    const generarLinkCitaForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generarLinkCita.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::generarLinkCita
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:93
 * @route '/admin/citas/{cita}/generar-preconsulta'
 */
        generarLinkCitaForm.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generarLinkCita.url(args, options),
            method: 'post',
        })
    
    generarLinkCita.form = generarLinkCitaForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/plantillas-preconsulta',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::index
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:26
 * @route '/admin/plantillas-preconsulta'
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
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/plantillas-preconsulta/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::create
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::store
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:46
 * @route '/admin/plantillas-preconsulta'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/plantillas-preconsulta',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::store
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:46
 * @route '/admin/plantillas-preconsulta'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::store
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:46
 * @route '/admin/plantillas-preconsulta'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::store
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:46
 * @route '/admin/plantillas-preconsulta'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::store
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:46
 * @route '/admin/plantillas-preconsulta'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
export const show = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/plantillas-preconsulta/{plantillas_preconsultum}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
show.url = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plantillas_preconsultum: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    plantillas_preconsultum: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plantillas_preconsultum: args.plantillas_preconsultum,
                }

    return show.definition.url
            .replace('{plantillas_preconsultum}', parsedArgs.plantillas_preconsultum.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
show.get = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
show.head = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
    const showForm = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
        showForm.get = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::show
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
        showForm.head = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
export const edit = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
edit.url = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plantillas_preconsultum: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    plantillas_preconsultum: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plantillas_preconsultum: args.plantillas_preconsultum,
                }

    return edit.definition.url
            .replace('{plantillas_preconsultum}', parsedArgs.plantillas_preconsultum.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
edit.get = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
edit.head = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
    const editForm = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
        editForm.get = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::edit
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:0
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}/edit'
 */
        editForm.head = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
export const update = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/plantillas-preconsulta/{plantillas_preconsultum}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
update.url = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plantillas_preconsultum: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    plantillas_preconsultum: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plantillas_preconsultum: args.plantillas_preconsultum,
                }

    return update.definition.url
            .replace('{plantillas_preconsultum}', parsedArgs.plantillas_preconsultum.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
update.put = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
update.patch = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
    const updateForm = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
        updateForm.put = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::update
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:65
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
        updateForm.patch = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::destroy
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:84
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
export const destroy = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/plantillas-preconsulta/{plantillas_preconsultum}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::destroy
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:84
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
destroy.url = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { plantillas_preconsultum: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    plantillas_preconsultum: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        plantillas_preconsultum: args.plantillas_preconsultum,
                }

    return destroy.definition.url
            .replace('{plantillas_preconsultum}', parsedArgs.plantillas_preconsultum.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::destroy
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:84
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
destroy.delete = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::destroy
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:84
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
    const destroyForm = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\PreconsultaAdminController::destroy
 * @see app/Http/Controllers/Admin/PreconsultaAdminController.php:84
 * @route '/admin/plantillas-preconsulta/{plantillas_preconsultum}'
 */
        destroyForm.delete = (args: { plantillas_preconsultum: string | number } | [plantillas_preconsultum: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const PreconsultaAdminController = { generarLinkCita, index, create, store, show, edit, update, destroy }

export default PreconsultaAdminController