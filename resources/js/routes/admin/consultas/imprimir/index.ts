import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
export const informe = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: informe.url(args, options),
    method: 'get',
})

informe.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/informe',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
informe.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return informe.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
informe.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: informe.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
informe.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: informe.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
    const informeForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: informe.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
        informeForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: informe.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::informe
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:453
 * @route '/admin/consultas/{consulta}/imprimir/informe'
 */
        informeForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: informe.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    informe.form = informeForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
export const receta = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: receta.url(args, options),
    method: 'get',
})

receta.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/receta',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
receta.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return receta.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
receta.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: receta.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
receta.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: receta.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
    const recetaForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: receta.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
        recetaForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: receta.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::receta
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:514
 * @route '/admin/consultas/{consulta}/imprimir/receta'
 */
        recetaForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: receta.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    receta.form = recetaForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
export const estudios = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estudios.url(args, options),
    method: 'get',
})

estudios.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/estudios',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
estudios.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return estudios.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
estudios.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: estudios.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
estudios.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: estudios.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
    const estudiosForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: estudios.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
        estudiosForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estudios.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::estudios
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:554
 * @route '/admin/consultas/{consulta}/imprimir/estudios'
 */
        estudiosForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: estudios.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    estudios.form = estudiosForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
export const reposo = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reposo.url(args, options),
    method: 'get',
})

reposo.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/reposo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
reposo.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reposo.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
reposo.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reposo.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
reposo.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reposo.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
    const reposoForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: reposo.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
        reposoForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reposo.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::reposo
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:596
 * @route '/admin/consultas/{consulta}/imprimir/reposo'
 */
        reposoForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: reposo.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    reposo.form = reposoForm
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
export const constancia = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: constancia.url(args, options),
    method: 'get',
})

constancia.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{consulta}/imprimir/constancia',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
constancia.url = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return constancia.definition.url
            .replace('{consulta}', parsedArgs.consulta.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
constancia.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: constancia.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
constancia.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: constancia.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
    const constanciaForm = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: constancia.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
        constanciaForm.get = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: constancia.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::constancia
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:638
 * @route '/admin/consultas/{consulta}/imprimir/constancia'
 */
        constanciaForm.head = (args: { consulta: number | { id: number } } | [consulta: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: constancia.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    constancia.form = constanciaForm
const imprimir = {
    informe: Object.assign(informe, informe),
receta: Object.assign(receta, receta),
estudios: Object.assign(estudios, estudios),
reposo: Object.assign(reposo, reposo),
constancia: Object.assign(constancia, constancia),
}

export default imprimir