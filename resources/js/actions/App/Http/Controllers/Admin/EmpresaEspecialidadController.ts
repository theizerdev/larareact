import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
export const edit = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/empresas/{empresa}/especialidades',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
edit.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empresa: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empresa: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empresa: typeof args.empresa === 'object'
                ? args.empresa.id
                : args.empresa,
                }

    return edit.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
edit.get = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
edit.head = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
    const editForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
        editForm.get = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::edit
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:18
 * @route '/admin/empresas/{empresa}/especialidades'
 */
        editForm.head = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::update
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:53
 * @route '/admin/empresas/{empresa}/especialidades'
 */
export const update = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/empresas/{empresa}/especialidades',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::update
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:53
 * @route '/admin/empresas/{empresa}/especialidades'
 */
update.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { empresa: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    empresa: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        empresa: typeof args.empresa === 'object'
                ? args.empresa.id
                : args.empresa,
                }

    return update.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::update
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:53
 * @route '/admin/empresas/{empresa}/especialidades'
 */
update.put = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::update
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:53
 * @route '/admin/empresas/{empresa}/especialidades'
 */
    const updateForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EmpresaEspecialidadController::update
 * @see app/Http/Controllers/Admin/EmpresaEspecialidadController.php:53
 * @route '/admin/empresas/{empresa}/especialidades'
 */
        updateForm.put = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const EmpresaEspecialidadController = { edit, update }

export default EmpresaEspecialidadController