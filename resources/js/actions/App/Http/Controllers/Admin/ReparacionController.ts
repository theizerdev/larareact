import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
export const reportePdf = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePdf.url(args, options),
    method: 'get',
})

reportePdf.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacion}/reporte-pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return reportePdf.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.get = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportePdf.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::reportePdf
* @see app/Http/Controllers/Admin/ReparacionController.php:677
* @route '/admin/reparaciones/{reparacion}/reporte-pdf'
*/
reportePdf.head = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportePdf.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeCliente
* @see app/Http/Controllers/Admin/ReparacionController.php:216
* @route '/admin/reparaciones/quick-cliente'
*/
export const storeCliente = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCliente.url(options),
    method: 'post',
})

storeCliente.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/quick-cliente',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeCliente
* @see app/Http/Controllers/Admin/ReparacionController.php:216
* @route '/admin/reparaciones/quick-cliente'
*/
storeCliente.url = (options?: RouteQueryOptions) => {
    return storeCliente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeCliente
* @see app/Http/Controllers/Admin/ReparacionController.php:216
* @route '/admin/reparaciones/quick-cliente'
*/
storeCliente.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeCliente.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeMarca
* @see app/Http/Controllers/Admin/ReparacionController.php:1040
* @route '/admin/reparaciones/quick-marca'
*/
export const storeMarca = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeMarca.url(options),
    method: 'post',
})

storeMarca.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/quick-marca',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeMarca
* @see app/Http/Controllers/Admin/ReparacionController.php:1040
* @route '/admin/reparaciones/quick-marca'
*/
storeMarca.url = (options?: RouteQueryOptions) => {
    return storeMarca.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeMarca
* @see app/Http/Controllers/Admin/ReparacionController.php:1040
* @route '/admin/reparaciones/quick-marca'
*/
storeMarca.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeMarca.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeModelo
* @see app/Http/Controllers/Admin/ReparacionController.php:1066
* @route '/admin/reparaciones/quick-modelo'
*/
export const storeModelo = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeModelo.url(options),
    method: 'post',
})

storeModelo.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/quick-modelo',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeModelo
* @see app/Http/Controllers/Admin/ReparacionController.php:1066
* @route '/admin/reparaciones/quick-modelo'
*/
storeModelo.url = (options?: RouteQueryOptions) => {
    return storeModelo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeModelo
* @see app/Http/Controllers/Admin/ReparacionController.php:1066
* @route '/admin/reparaciones/quick-modelo'
*/
storeModelo.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeModelo.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:238
* @route '/admin/reparaciones/quick-servicio'
*/
export const storeServicio = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeServicio.url(options),
    method: 'post',
})

storeServicio.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/quick-servicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:238
* @route '/admin/reparaciones/quick-servicio'
*/
storeServicio.url = (options?: RouteQueryOptions) => {
    return storeServicio.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::storeServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:238
* @route '/admin/reparaciones/quick-servicio'
*/
storeServicio.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeServicio.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::checkImei
* @see app/Http/Controllers/Admin/ReparacionController.php:285
* @route '/admin/reparaciones/check-imei'
*/
export const checkImei = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkImei.url(options),
    method: 'post',
})

checkImei.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/check-imei',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::checkImei
* @see app/Http/Controllers/Admin/ReparacionController.php:285
* @route '/admin/reparaciones/check-imei'
*/
checkImei.url = (options?: RouteQueryOptions) => {
    return checkImei.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::checkImei
* @see app/Http/Controllers/Admin/ReparacionController.php:285
* @route '/admin/reparaciones/check-imei'
*/
checkImei.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkImei.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::apiFind
* @see app/Http/Controllers/Admin/ReparacionController.php:1385
* @route '/admin/reparaciones/api-find'
*/
export const apiFind = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiFind.url(options),
    method: 'get',
})

apiFind.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/api-find',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::apiFind
* @see app/Http/Controllers/Admin/ReparacionController.php:1385
* @route '/admin/reparaciones/api-find'
*/
apiFind.url = (options?: RouteQueryOptions) => {
    return apiFind.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::apiFind
* @see app/Http/Controllers/Admin/ReparacionController.php:1385
* @route '/admin/reparaciones/api-find'
*/
apiFind.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: apiFind.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::apiFind
* @see app/Http/Controllers/Admin/ReparacionController.php:1385
* @route '/admin/reparaciones/api-find'
*/
apiFind.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: apiFind.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::index
* @see app/Http/Controllers/Admin/ReparacionController.php:40
* @route '/admin/reparaciones'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::index
* @see app/Http/Controllers/Admin/ReparacionController.php:40
* @route '/admin/reparaciones'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::index
* @see app/Http/Controllers/Admin/ReparacionController.php:40
* @route '/admin/reparaciones'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::index
* @see app/Http/Controllers/Admin/ReparacionController.php:40
* @route '/admin/reparaciones'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::create
* @see app/Http/Controllers/Admin/ReparacionController.php:176
* @route '/admin/reparaciones/create'
*/
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::create
* @see app/Http/Controllers/Admin/ReparacionController.php:176
* @route '/admin/reparaciones/create'
*/
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::create
* @see app/Http/Controllers/Admin/ReparacionController.php:176
* @route '/admin/reparaciones/create'
*/
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::create
* @see app/Http/Controllers/Admin/ReparacionController.php:176
* @route '/admin/reparaciones/create'
*/
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::store
* @see app/Http/Controllers/Admin/ReparacionController.php:441
* @route '/admin/reparaciones'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/reparaciones',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::store
* @see app/Http/Controllers/Admin/ReparacionController.php:441
* @route '/admin/reparaciones'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::store
* @see app/Http/Controllers/Admin/ReparacionController.php:441
* @route '/admin/reparaciones'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::show
* @see app/Http/Controllers/Admin/ReparacionController.php:612
* @route '/admin/reparaciones/{reparacione}'
*/
export const show = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacione}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::show
* @see app/Http/Controllers/Admin/ReparacionController.php:612
* @route '/admin/reparaciones/{reparacione}'
*/
show.url = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacione: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacione: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacione: args.reparacione,
    }

    return show.definition.url
            .replace('{reparacione}', parsedArgs.reparacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::show
* @see app/Http/Controllers/Admin/ReparacionController.php:612
* @route '/admin/reparaciones/{reparacione}'
*/
show.get = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::show
* @see app/Http/Controllers/Admin/ReparacionController.php:612
* @route '/admin/reparaciones/{reparacione}'
*/
show.head = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::edit
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}/edit'
*/
export const edit = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacione}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::edit
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}/edit'
*/
edit.url = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacione: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacione: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacione: args.reparacione,
    }

    return edit.definition.url
            .replace('{reparacione}', parsedArgs.reparacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::edit
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}/edit'
*/
edit.get = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::edit
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}/edit'
*/
edit.head = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::update
* @see app/Http/Controllers/Admin/ReparacionController.php:1019
* @route '/admin/reparaciones/{reparacione}'
*/
export const update = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/reparaciones/{reparacione}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::update
* @see app/Http/Controllers/Admin/ReparacionController.php:1019
* @route '/admin/reparaciones/{reparacione}'
*/
update.url = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacione: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacione: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacione: args.reparacione,
    }

    return update.definition.url
            .replace('{reparacione}', parsedArgs.reparacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::update
* @see app/Http/Controllers/Admin/ReparacionController.php:1019
* @route '/admin/reparaciones/{reparacione}'
*/
update.put = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::update
* @see app/Http/Controllers/Admin/ReparacionController.php:1019
* @route '/admin/reparaciones/{reparacione}'
*/
update.patch = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::destroy
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}'
*/
export const destroy = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/reparaciones/{reparacione}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::destroy
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}'
*/
destroy.url = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacione: args }
    }

    if (Array.isArray(args)) {
        args = {
            reparacione: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacione: args.reparacione,
    }

    return destroy.definition.url
            .replace('{reparacione}', parsedArgs.reparacione.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::destroy
* @see app/Http/Controllers/Admin/ReparacionController.php:0
* @route '/admin/reparaciones/{reparacione}'
*/
destroy.delete = (args: { reparacione: string | number } | [reparacione: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/estado'
*/
const updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.url(args, options),
    method: 'post',
})

updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/estado'
*/
updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/estado'
*/
updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
const updateEstado29b560c301d92324e41f156a1e4e8d5f = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEstado29b560c301d92324e41f156a1e4e8d5f.url(args, options),
    method: 'post',
})

updateEstado29b560c301d92324e41f156a1e4e8d5f.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/update-estado',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
updateEstado29b560c301d92324e41f156a1e4e8d5f.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return updateEstado29b560c301d92324e41f156a1e4e8d5f.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateEstado
* @see app/Http/Controllers/Admin/ReparacionController.php:826
* @route '/admin/reparaciones/{reparacion}/update-estado'
*/
updateEstado29b560c301d92324e41f156a1e4e8d5f.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEstado29b560c301d92324e41f156a1e4e8d5f.url(args, options),
    method: 'post',
})

/**
* Multiple routes resolve to \App\Http\Controllers\Admin\ReparacionController::updateEstado, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `updateEstado['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const updateEstado = {
    '/admin/reparaciones/{reparacion}/estado': updateEstadob5d9c7cddbb9ecb19b82b8920c2b93af,
    '/admin/reparaciones/{reparacion}/update-estado': updateEstado29b560c301d92324e41f156a1e4e8d5f,
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateDatos
* @see app/Http/Controllers/Admin/ReparacionController.php:712
* @route '/admin/reparaciones/{reparacion}/update-datos'
*/
export const updateDatos = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateDatos.url(args, options),
    method: 'post',
})

updateDatos.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/update-datos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateDatos
* @see app/Http/Controllers/Admin/ReparacionController.php:712
* @route '/admin/reparaciones/{reparacion}/update-datos'
*/
updateDatos.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return updateDatos.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateDatos
* @see app/Http/Controllers/Admin/ReparacionController.php:712
* @route '/admin/reparaciones/{reparacion}/update-datos'
*/
updateDatos.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateDatos.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::uploadFotoProceso
* @see app/Http/Controllers/Admin/ReparacionController.php:766
* @route '/admin/reparaciones/{reparacion}/add-foto'
*/
export const uploadFotoProceso = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadFotoProceso.url(args, options),
    method: 'post',
})

uploadFotoProceso.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/add-foto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::uploadFotoProceso
* @see app/Http/Controllers/Admin/ReparacionController.php:766
* @route '/admin/reparaciones/{reparacion}/add-foto'
*/
uploadFotoProceso.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return uploadFotoProceso.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::uploadFotoProceso
* @see app/Http/Controllers/Admin/ReparacionController.php:766
* @route '/admin/reparaciones/{reparacion}/add-foto'
*/
uploadFotoProceso.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: uploadFotoProceso.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::deleteFoto
* @see app/Http/Controllers/Admin/ReparacionController.php:814
* @route '/admin/reparaciones/{reparacion}/fotos/{foto}'
*/
export const deleteFoto = (args: { reparacion: number | { id: number }, foto: number | { id: number } } | [reparacion: number | { id: number }, foto: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteFoto.url(args, options),
    method: 'delete',
})

deleteFoto.definition = {
    methods: ["delete"],
    url: '/admin/reparaciones/{reparacion}/fotos/{foto}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::deleteFoto
* @see app/Http/Controllers/Admin/ReparacionController.php:814
* @route '/admin/reparaciones/{reparacion}/fotos/{foto}'
*/
deleteFoto.url = (args: { reparacion: number | { id: number }, foto: number | { id: number } } | [reparacion: number | { id: number }, foto: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
            foto: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
        foto: typeof args.foto === 'object'
        ? args.foto.id
        : args.foto,
    }

    return deleteFoto.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace('{foto}', parsedArgs.foto.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::deleteFoto
* @see app/Http/Controllers/Admin/ReparacionController.php:814
* @route '/admin/reparaciones/{reparacion}/fotos/{foto}'
*/
deleteFoto.delete = (args: { reparacion: number | { id: number }, foto: number | { id: number } } | [reparacion: number | { id: number }, foto: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteFoto.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::addItem
* @see app/Http/Controllers/Admin/ReparacionController.php:930
* @route '/admin/reparaciones/{reparacion}/items'
*/
export const addItem = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addItem.url(args, options),
    method: 'post',
})

addItem.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/items',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::addItem
* @see app/Http/Controllers/Admin/ReparacionController.php:930
* @route '/admin/reparaciones/{reparacion}/items'
*/
addItem.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return addItem.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::addItem
* @see app/Http/Controllers/Admin/ReparacionController.php:930
* @route '/admin/reparaciones/{reparacion}/items'
*/
addItem.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: addItem.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::removeItem
* @see app/Http/Controllers/Admin/ReparacionController.php:973
* @route '/admin/reparaciones/{reparacion}/items/{item}'
*/
export const removeItem = (args: { reparacion: number | { id: number }, item: number | { id: number } } | [reparacion: number | { id: number }, item: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeItem.url(args, options),
    method: 'delete',
})

removeItem.definition = {
    methods: ["delete"],
    url: '/admin/reparaciones/{reparacion}/items/{item}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::removeItem
* @see app/Http/Controllers/Admin/ReparacionController.php:973
* @route '/admin/reparaciones/{reparacion}/items/{item}'
*/
removeItem.url = (args: { reparacion: number | { id: number }, item: number | { id: number } } | [reparacion: number | { id: number }, item: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
            item: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
        item: typeof args.item === 'object'
        ? args.item.id
        : args.item,
    }

    return removeItem.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::removeItem
* @see app/Http/Controllers/Admin/ReparacionController.php:973
* @route '/admin/reparaciones/{reparacion}/items/{item}'
*/
removeItem.delete = (args: { reparacion: number | { id: number }, item: number | { id: number } } | [reparacion: number | { id: number }, item: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeItem.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateCostos
* @see app/Http/Controllers/Admin/ReparacionController.php:992
* @route '/admin/reparaciones/{reparacion}/costos'
*/
export const updateCostos = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateCostos.url(args, options),
    method: 'post',
})

updateCostos.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/costos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateCostos
* @see app/Http/Controllers/Admin/ReparacionController.php:992
* @route '/admin/reparaciones/{reparacion}/costos'
*/
updateCostos.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return updateCostos.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::updateCostos
* @see app/Http/Controllers/Admin/ReparacionController.php:992
* @route '/admin/reparaciones/{reparacion}/costos'
*/
updateCostos.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateCostos.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::postServicioForm
* @see app/Http/Controllers/Admin/ReparacionController.php:1118
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
export const postServicioForm = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: postServicioForm.url(args, options),
    method: 'get',
})

postServicioForm.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/{reparacion}/post-servicio',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::postServicioForm
* @see app/Http/Controllers/Admin/ReparacionController.php:1118
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
postServicioForm.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return postServicioForm.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::postServicioForm
* @see app/Http/Controllers/Admin/ReparacionController.php:1118
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
postServicioForm.get = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: postServicioForm.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::postServicioForm
* @see app/Http/Controllers/Admin/ReparacionController.php:1118
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
postServicioForm.head = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: postServicioForm.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionController::savePostServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:1151
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
export const savePostServicio = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePostServicio.url(args, options),
    method: 'post',
})

savePostServicio.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/{reparacion}/post-servicio',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionController::savePostServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:1151
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
savePostServicio.url = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reparacion: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { reparacion: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            reparacion: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        reparacion: typeof args.reparacion === 'object'
        ? args.reparacion.id
        : args.reparacion,
    }

    return savePostServicio.definition.url
            .replace('{reparacion}', parsedArgs.reparacion.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionController::savePostServicio
* @see app/Http/Controllers/Admin/ReparacionController.php:1151
* @route '/admin/reparaciones/{reparacion}/post-servicio'
*/
savePostServicio.post = (args: { reparacion: number | { id: number } } | [reparacion: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePostServicio.url(args, options),
    method: 'post',
})

const ReparacionController = { reportePdf, storeCliente, storeMarca, storeModelo, storeServicio, checkImei, apiFind, index, create, store, show, edit, update, destroy, updateEstado, updateDatos, uploadFotoProceso, deleteFoto, addItem, removeItem, updateCostos, postServicioForm, savePostServicio }

export default ReparacionController