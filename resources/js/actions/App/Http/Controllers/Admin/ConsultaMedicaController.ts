import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/consultas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::index
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:0
 * @route '/admin/consultas'
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
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
export const salaDeEspera = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: salaDeEspera.url(options),
    method: 'get',
})

salaDeEspera.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/sala-de-espera',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
salaDeEspera.url = (options?: RouteQueryOptions) => {
    return salaDeEspera.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
salaDeEspera.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: salaDeEspera.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
salaDeEspera.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: salaDeEspera.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
    const salaDeEsperaForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: salaDeEspera.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
        salaDeEsperaForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: salaDeEspera.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::salaDeEspera
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:22
 * @route '/admin/consultas/sala-de-espera'
 */
        salaDeEsperaForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: salaDeEspera.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    salaDeEspera.form = salaDeEsperaForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
export const enConsultorio = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enConsultorio.url(options),
    method: 'get',
})

enConsultorio.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/en-consultorio',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
enConsultorio.url = (options?: RouteQueryOptions) => {
    return enConsultorio.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
enConsultorio.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: enConsultorio.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
enConsultorio.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: enConsultorio.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
    const enConsultorioForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: enConsultorio.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
        enConsultorioForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: enConsultorio.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::enConsultorio
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:30
 * @route '/admin/consultas/en-consultorio'
 */
        enConsultorioForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: enConsultorio.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    enConsultorio.form = enConsultorioForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
export const finalizadas = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: finalizadas.url(options),
    method: 'get',
})

finalizadas.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/finalizadas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
finalizadas.url = (options?: RouteQueryOptions) => {
    return finalizadas.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
finalizadas.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: finalizadas.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
finalizadas.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: finalizadas.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
    const finalizadasForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: finalizadas.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
        finalizadasForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: finalizadas.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::finalizadas
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:38
 * @route '/admin/consultas/finalizadas'
 */
        finalizadasForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: finalizadas.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    finalizadas.form = finalizadasForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
const atencion705d762b46508d1733977318d2ee5620 = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencion705d762b46508d1733977318d2ee5620.url(args, options),
    method: 'get',
})

atencion705d762b46508d1733977318d2ee5620.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{cita}/atencion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion705d762b46508d1733977318d2ee5620.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return atencion705d762b46508d1733977318d2ee5620.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion705d762b46508d1733977318d2ee5620.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencion705d762b46508d1733977318d2ee5620.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion705d762b46508d1733977318d2ee5620.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: atencion705d762b46508d1733977318d2ee5620.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
    const atencion705d762b46508d1733977318d2ee5620Form = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: atencion705d762b46508d1733977318d2ee5620.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
        atencion705d762b46508d1733977318d2ee5620Form.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencion705d762b46508d1733977318d2ee5620.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
        atencion705d762b46508d1733977318d2ee5620Form.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencion705d762b46508d1733977318d2ee5620.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    atencion705d762b46508d1733977318d2ee5620.form = atencion705d762b46508d1733977318d2ee5620Form
    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
const atencione02d37f0cd7d5425f8f755653059768f = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencione02d37f0cd7d5425f8f755653059768f.url(args, options),
    method: 'get',
})

atencione02d37f0cd7d5425f8f755653059768f.definition = {
    methods: ["get","head"],
    url: '/admin/citas/{cita}/atencion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
atencione02d37f0cd7d5425f8f755653059768f.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return atencione02d37f0cd7d5425f8f755653059768f.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
atencione02d37f0cd7d5425f8f755653059768f.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencione02d37f0cd7d5425f8f755653059768f.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
atencione02d37f0cd7d5425f8f755653059768f.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: atencione02d37f0cd7d5425f8f755653059768f.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
    const atencione02d37f0cd7d5425f8f755653059768fForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: atencione02d37f0cd7d5425f8f755653059768f.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
        atencione02d37f0cd7d5425f8f755653059768fForm.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencione02d37f0cd7d5425f8f755653059768f.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/citas/{cita}/atencion'
 */
        atencione02d37f0cd7d5425f8f755653059768fForm.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencione02d37f0cd7d5425f8f755653059768f.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    atencione02d37f0cd7d5425f8f755653059768f.form = atencione02d37f0cd7d5425f8f755653059768fForm

/**
* Multiple routes resolve to \App\Http\Controllers\Admin\ConsultaMedicaController::atencion, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `atencion['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const atencion = {
    '/admin/consultas/{cita}/atencion': atencion705d762b46508d1733977318d2ee5620,
    '/admin/citas/{cita}/atencion': atencione02d37f0cd7d5425f8f755653059768f,
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
const store705d762b46508d1733977318d2ee5620 = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store705d762b46508d1733977318d2ee5620.url(args, options),
    method: 'post',
})

store705d762b46508d1733977318d2ee5620.definition = {
    methods: ["post"],
    url: '/admin/consultas/{cita}/atencion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
store705d762b46508d1733977318d2ee5620.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return store705d762b46508d1733977318d2ee5620.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
store705d762b46508d1733977318d2ee5620.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store705d762b46508d1733977318d2ee5620.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
    const store705d762b46508d1733977318d2ee5620Form = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store705d762b46508d1733977318d2ee5620.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
        store705d762b46508d1733977318d2ee5620Form.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store705d762b46508d1733977318d2ee5620.url(args, options),
            method: 'post',
        })
    
    store705d762b46508d1733977318d2ee5620.form = store705d762b46508d1733977318d2ee5620Form
    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/citas/{cita}/atencion'
 */
const storee02d37f0cd7d5425f8f755653059768f = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storee02d37f0cd7d5425f8f755653059768f.url(args, options),
    method: 'post',
})

storee02d37f0cd7d5425f8f755653059768f.definition = {
    methods: ["post"],
    url: '/admin/citas/{cita}/atencion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/citas/{cita}/atencion'
 */
storee02d37f0cd7d5425f8f755653059768f.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return storee02d37f0cd7d5425f8f755653059768f.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/citas/{cita}/atencion'
 */
storee02d37f0cd7d5425f8f755653059768f.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storee02d37f0cd7d5425f8f755653059768f.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/citas/{cita}/atencion'
 */
    const storee02d37f0cd7d5425f8f755653059768fForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storee02d37f0cd7d5425f8f755653059768f.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/citas/{cita}/atencion'
 */
        storee02d37f0cd7d5425f8f755653059768fForm.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storee02d37f0cd7d5425f8f755653059768f.url(args, options),
            method: 'post',
        })
    
    storee02d37f0cd7d5425f8f755653059768f.form = storee02d37f0cd7d5425f8f755653059768fForm

/**
* Multiple routes resolve to \App\Http\Controllers\Admin\ConsultaMedicaController::store, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `store['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const store = {
    '/admin/consultas/{cita}/atencion': store705d762b46508d1733977318d2ee5620,
    '/admin/citas/{cita}/atencion': storee02d37f0cd7d5425f8f755653059768f,
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeDiagnosticoCie10
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
export const storeDiagnosticoCie10 = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeDiagnosticoCie10.url(options),
    method: 'post',
})

storeDiagnosticoCie10.definition = {
    methods: ["post"],
    url: '/admin/consultas/cie10',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeDiagnosticoCie10
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
storeDiagnosticoCie10.url = (options?: RouteQueryOptions) => {
    return storeDiagnosticoCie10.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeDiagnosticoCie10
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
storeDiagnosticoCie10.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeDiagnosticoCie10.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeDiagnosticoCie10
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
    const storeDiagnosticoCie10Form = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeDiagnosticoCie10.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeDiagnosticoCie10
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:196
 * @route '/admin/consultas/cie10'
 */
        storeDiagnosticoCie10Form.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeDiagnosticoCie10.url(options),
            method: 'post',
        })
    
    storeDiagnosticoCie10.form = storeDiagnosticoCie10Form
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeEstudioCatalogo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
export const storeEstudioCatalogo = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEstudioCatalogo.url(options),
    method: 'post',
})

storeEstudioCatalogo.definition = {
    methods: ["post"],
    url: '/admin/consultas/estudios-catalogo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeEstudioCatalogo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
storeEstudioCatalogo.url = (options?: RouteQueryOptions) => {
    return storeEstudioCatalogo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeEstudioCatalogo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
storeEstudioCatalogo.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeEstudioCatalogo.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeEstudioCatalogo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
    const storeEstudioCatalogoForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeEstudioCatalogo.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::storeEstudioCatalogo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:231
 * @route '/admin/consultas/estudios-catalogo'
 */
        storeEstudioCatalogoForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeEstudioCatalogo.url(options),
            method: 'post',
        })
    
    storeEstudioCatalogo.form = storeEstudioCatalogoForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
export const imprimirInforme = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirInforme.url(args, options),
    method: 'get',
})

imprimirInforme.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/informe',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
imprimirInforme.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { consulta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { consulta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    consulta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        consulta: typeof args.consulta === 'object'
                ? args.consulta.id
                : args.consulta,
                }

    return imprimirInforme.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
imprimirInforme.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirInforme.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
imprimirInforme.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirInforme.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
    const imprimirInformeForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirInforme.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
        imprimirInformeForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirInforme.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirInforme
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
        imprimirInformeForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirInforme.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirInforme.form = imprimirInformeForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
export const imprimirReceta = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReceta.url(args, options),
    method: 'get',
})

imprimirReceta.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/receta',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
imprimirReceta.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { consulta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { consulta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    consulta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        consulta: typeof args.consulta === 'object'
                ? args.consulta.id
                : args.consulta,
                }

    return imprimirReceta.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
imprimirReceta.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReceta.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
imprimirReceta.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirReceta.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
    const imprimirRecetaForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirReceta.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
        imprimirRecetaForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReceta.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReceta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
        imprimirRecetaForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReceta.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirReceta.form = imprimirRecetaForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
export const imprimirEstudios = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirEstudios.url(args, options),
    method: 'get',
})

imprimirEstudios.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/estudios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
imprimirEstudios.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { consulta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { consulta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    consulta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        consulta: typeof args.consulta === 'object'
                ? args.consulta.id
                : args.consulta,
                }

    return imprimirEstudios.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
imprimirEstudios.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirEstudios.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
imprimirEstudios.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirEstudios.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
    const imprimirEstudiosForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirEstudios.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
        imprimirEstudiosForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirEstudios.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirEstudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
        imprimirEstudiosForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirEstudios.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirEstudios.form = imprimirEstudiosForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
export const imprimirReposo = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReposo.url(args, options),
    method: 'get',
})

imprimirReposo.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/reposo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
imprimirReposo.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { consulta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { consulta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    consulta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        consulta: typeof args.consulta === 'object'
                ? args.consulta.id
                : args.consulta,
                }

    return imprimirReposo.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
imprimirReposo.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirReposo.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
imprimirReposo.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirReposo.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
    const imprimirReposoForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirReposo.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
        imprimirReposoForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReposo.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirReposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
        imprimirReposoForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirReposo.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirReposo.form = imprimirReposoForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
export const imprimirConstancia = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirConstancia.url(args, options),
    method: 'get',
})

imprimirConstancia.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/constancia',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
imprimirConstancia.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { consulta: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { consulta: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    consulta: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        consulta: typeof args.consulta === 'object'
                ? args.consulta.id
                : args.consulta,
                }

    return imprimirConstancia.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
imprimirConstancia.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: imprimirConstancia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
imprimirConstancia.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: imprimirConstancia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
    const imprimirConstanciaForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: imprimirConstancia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
        imprimirConstanciaForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirConstancia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::imprimirConstancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
        imprimirConstanciaForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: imprimirConstancia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    imprimirConstancia.form = imprimirConstanciaForm
const ConsultaMedicaController = { index, salaDeEspera, enConsultorio, finalizadas, atencion, store, storeDiagnosticoCie10, storeEstudioCatalogo, imprimirInforme, imprimirReceta, imprimirEstudios, imprimirReposo, imprimirConstancia }

export default ConsultaMedicaController