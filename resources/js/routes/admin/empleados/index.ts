import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EmpleadoController::syncUsers
* @see app/Http/Controllers/Admin/EmpleadoController.php:186
* @route '/admin/empleados/sync-users'
*/
export const syncUsers = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncUsers.url(options),
    method: 'post',
})

syncUsers.definition = {
    methods: ["post"],
    url: '/admin/empleados/sync-users',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::syncUsers
* @see app/Http/Controllers/Admin/EmpleadoController.php:186
* @route '/admin/empleados/sync-users'
*/
syncUsers.url = (options?: RouteQueryOptions) => {
    return syncUsers.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::syncUsers
* @see app/Http/Controllers/Admin/EmpleadoController.php:186
* @route '/admin/empleados/sync-users'
*/
syncUsers.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncUsers.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::syncUsers
* @see app/Http/Controllers/Admin/EmpleadoController.php:186
* @route '/admin/empleados/sync-users'
*/
const syncUsersForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncUsers.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::syncUsers
* @see app/Http/Controllers/Admin/EmpleadoController.php:186
* @route '/admin/empleados/sync-users'
*/
syncUsersForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: syncUsers.url(options),
    method: 'post',
})

syncUsers.form = syncUsersForm

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
* @see \App\Http\Controllers\Admin\EmpleadoController::store
* @see app/Http/Controllers/Admin/EmpleadoController.php:67
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:67
* @route '/admin/empleados'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
* @see app/Http/Controllers/Admin/EmpleadoController.php:67
* @route '/admin/empleados'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
* @see app/Http/Controllers/Admin/EmpleadoController.php:67
* @route '/admin/empleados'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::store
* @see app/Http/Controllers/Admin/EmpleadoController.php:67
* @route '/admin/empleados'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
export const update = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/empleados/{empleado}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
update.url = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
update.put = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
update.patch = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::update
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
const updateForm = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
updateForm.put = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:116
* @route '/admin/empleados/{empleado}'
*/
updateForm.patch = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
* @see app/Http/Controllers/Admin/EmpleadoController.php:151
* @route '/admin/empleados/{empleado}'
*/
export const destroy = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/empleados/{empleado}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
* @see app/Http/Controllers/Admin/EmpleadoController.php:151
* @route '/admin/empleados/{empleado}'
*/
destroy.url = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:151
* @route '/admin/empleados/{empleado}'
*/
destroy.delete = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::destroy
* @see app/Http/Controllers/Admin/EmpleadoController.php:151
* @route '/admin/empleados/{empleado}'
*/
const destroyForm = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:151
* @route '/admin/empleados/{empleado}'
*/
destroyForm.delete = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
* @see app/Http/Controllers/Admin/EmpleadoController.php:169
* @route '/admin/empleados/{empleado}/toggle-status'
*/
export const toggleStatus = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

toggleStatus.definition = {
    methods: ["patch"],
    url: '/admin/empleados/{empleado}/toggle-status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
* @see app/Http/Controllers/Admin/EmpleadoController.php:169
* @route '/admin/empleados/{empleado}/toggle-status'
*/
toggleStatus.url = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:169
* @route '/admin/empleados/{empleado}/toggle-status'
*/
toggleStatus.patch = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: toggleStatus.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Admin\EmpleadoController::toggleStatus
* @see app/Http/Controllers/Admin/EmpleadoController.php:169
* @route '/admin/empleados/{empleado}/toggle-status'
*/
const toggleStatusForm = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Admin/EmpleadoController.php:169
* @route '/admin/empleados/{empleado}/toggle-status'
*/
toggleStatusForm.patch = (args: { empleado: number | { id: number } } | [empleado: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: toggleStatus.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

toggleStatus.form = toggleStatusForm

const empleados = {
    syncUsers: Object.assign(syncUsers, syncUsers),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    toggleStatus: Object.assign(toggleStatus, toggleStatus),
}

export default empleados