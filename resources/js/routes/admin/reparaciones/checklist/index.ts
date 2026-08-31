import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:81
* @route '/admin/reparaciones/checklist'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/checklist',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:81
* @route '/admin/reparaciones/checklist'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:81
* @route '/admin/reparaciones/checklist'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:81
* @route '/admin/reparaciones/checklist'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:147
* @route '/admin/reparaciones/checklist'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:147
* @route '/admin/reparaciones/checklist'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:147
* @route '/admin/reparaciones/checklist'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:190
* @route '/admin/reparaciones/checklist/{item}'
*/
export const update = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/reparaciones/checklist/{item}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:190
* @route '/admin/reparaciones/checklist/{item}'
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
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:190
* @route '/admin/reparaciones/checklist/{item}'
*/
update.put = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:219
* @route '/admin/reparaciones/checklist/{item}'
*/
export const destroy = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/reparaciones/checklist/{item}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:219
* @route '/admin/reparaciones/checklist/{item}'
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
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:219
* @route '/admin/reparaciones/checklist/{item}'
*/
destroy.delete = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:316
* @route '/admin/reparaciones/checklist/reorder'
*/
export const reorder = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

reorder.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist/reorder',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:316
* @route '/admin/reparaciones/checklist/reorder'
*/
reorder.url = (options?: RouteQueryOptions) => {
    return reorder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:316
* @route '/admin/reparaciones/checklist/reorder'
*/
reorder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reorder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:344
* @route '/admin/reparaciones/checklist/batch-toggle'
*/
export const batchToggle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batchToggle.url(options),
    method: 'post',
})

batchToggle.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist/batch-toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:344
* @route '/admin/reparaciones/checklist/batch-toggle'
*/
batchToggle.url = (options?: RouteQueryOptions) => {
    return batchToggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:344
* @route '/admin/reparaciones/checklist/batch-toggle'
*/
batchToggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: batchToggle.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:390
* @route '/admin/reparaciones/checklist/{item}/duplicate'
*/
export const duplicate = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

duplicate.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist/{item}/duplicate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:390
* @route '/admin/reparaciones/checklist/{item}/duplicate'
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
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:390
* @route '/admin/reparaciones/checklist/{item}/duplicate'
*/
duplicate.post = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:240
* @route '/admin/reparaciones/checklist/reset-defaults'
*/
export const reset = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

reset.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist/reset-defaults',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:240
* @route '/admin/reparaciones/checklist/reset-defaults'
*/
reset.url = (options?: RouteQueryOptions) => {
    return reset.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::reset
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:240
* @route '/admin/reparaciones/checklist/reset-defaults'
*/
reset.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:262
* @route '/admin/reparaciones/checklist/copy-to-branch'
*/
export const copyToBranch = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyToBranch.url(options),
    method: 'post',
})

copyToBranch.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/checklist/copy-to-branch',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:262
* @route '/admin/reparaciones/checklist/copy-to-branch'
*/
copyToBranch.url = (options?: RouteQueryOptions) => {
    return copyToBranch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionChecklistController.php:262
* @route '/admin/reparaciones/checklist/copy-to-branch'
*/
copyToBranch.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: copyToBranch.url(options),
    method: 'post',
})

const checklist = {
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

export default checklist