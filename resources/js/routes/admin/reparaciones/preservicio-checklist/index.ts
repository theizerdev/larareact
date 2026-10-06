import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/preservicio/checklist',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:147
* @route '/admin/reparaciones/preservicio/checklist'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:147
* @route '/admin/reparaciones/preservicio/checklist'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:147
* @route '/admin/reparaciones/preservicio/checklist'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:192
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
export const update = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/reparaciones/preservicio/checklist/{item}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:192
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
update.url = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: args.item,
    }

    return update.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:192
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
update.put = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:222
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
export const destroy = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/reparaciones/preservicio/checklist/{item}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:222
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
destroy.url = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: args.item,
    }

    return destroy.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:222
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
destroy.delete = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:316
* @route '/admin/reparaciones/preservicio/checklist/reorder'
*/
export const reorder = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

reorder.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/reorder',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:316
* @route '/admin/reparaciones/preservicio/checklist/reorder'
*/
reorder.url = (options?: RouteQueryOptions) => {
    return reorder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:316
* @route '/admin/reparaciones/preservicio/checklist/reorder'
*/
reorder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:344
* @route '/admin/reparaciones/preservicio/checklist/batch-toggle'
*/
export const batchToggle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batchToggle.url(options),
    method: 'post',
})

batchToggle.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/batch-toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:344
* @route '/admin/reparaciones/preservicio/checklist/batch-toggle'
*/
batchToggle.url = (options?: RouteQueryOptions) => {
    return batchToggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:344
* @route '/admin/reparaciones/preservicio/checklist/batch-toggle'
*/
batchToggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batchToggle.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:389
* @route '/admin/reparaciones/preservicio/checklist/{item}/duplicate'
*/
export const duplicate = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

duplicate.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/{item}/duplicate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:389
* @route '/admin/reparaciones/preservicio/checklist/{item}/duplicate'
*/
duplicate.url = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { item: args }
    }

    if (Array.isArray(args)) {
        args = {
            item: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        item: args.item,
    }

    return duplicate.definition.url
            .replace('{item}', parsedArgs.item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:389
* @route '/admin/reparaciones/preservicio/checklist/{item}/duplicate'
*/
duplicate.post = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
export const reset = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

reset.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/reset-defaults',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
reset.url = (options?: RouteQueryOptions) => {
    return reset.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
reset.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:265
* @route '/admin/reparaciones/preservicio/checklist/copy-to-branch'
*/
export const copyToBranch = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyToBranch.url(options),
    method: 'post',
})

copyToBranch.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/copy-to-branch',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:265
* @route '/admin/reparaciones/preservicio/checklist/copy-to-branch'
*/
copyToBranch.url = (options?: RouteQueryOptions) => {
    return copyToBranch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:265
* @route '/admin/reparaciones/preservicio/checklist/copy-to-branch'
*/
copyToBranch.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyToBranch.url(options),
    method: 'post',
})

const preservicioChecklist = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    reorder: Object.assign(reorder, reorder),
    batchToggle: Object.assign(batchToggle, batchToggle),
    duplicate: Object.assign(duplicate, duplicate),
    reset: Object.assign(reset, reset),
    copyToBranch: Object.assign(copyToBranch, copyToBranch),
}

export default preservicioChecklist