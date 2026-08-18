import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import atencionB38d10 from './atencion'
import cie10 from './cie10'
import estudiosCatalogo from './estudios-catalogo'
import imprimir from './imprimir'
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
export const atencion = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencion.url(args, options),
    method: 'get',
})

atencion.definition = {
    methods: ["get","head"],
    url: '/admin/consultas/{cita}/atencion',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return atencion.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: atencion.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
atencion.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: atencion.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
    const atencionForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: atencion.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
        atencionForm.get = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencion.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::atencion
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:133
 * @route '/admin/consultas/{cita}/atencion'
 */
        atencionForm.head = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: atencion.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    atencion.form = atencionForm
const consultas = {
    index: Object.assign(index, index),
salaDeEspera: Object.assign(salaDeEspera, salaDeEspera),
enConsultorio: Object.assign(enConsultorio, enConsultorio),
finalizadas: Object.assign(finalizadas, finalizadas),
atencion: Object.assign(atencion, atencionB38d10),
cie10: Object.assign(cie10, cie10),
estudiosCatalogo: Object.assign(estudiosCatalogo, estudiosCatalogo),
imprimir: Object.assign(imprimir, imprimir),
}

export default consultas