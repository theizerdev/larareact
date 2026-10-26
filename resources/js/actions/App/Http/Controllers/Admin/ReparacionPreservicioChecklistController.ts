import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
export const indexPage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexPage.url(options),
    method: 'get',
})

indexPage.definition = {
    methods: ["get","head"],
    url: '/admin/reparaciones/preservicio-config',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
indexPage.url = (options?: RouteQueryOptions) => {
    return indexPage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
indexPage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: indexPage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
indexPage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: indexPage.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
const indexPageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexPage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
indexPageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexPage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::indexPage
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:20
* @route '/admin/reparaciones/preservicio-config'
*/
indexPageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: indexPage.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

indexPage.form = indexPageForm

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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::index
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:81
* @route '/admin/reparaciones/preservicio/checklist'
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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:147
* @route '/admin/reparaciones/preservicio/checklist'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::store
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:147
* @route '/admin/reparaciones/preservicio/checklist'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:192
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
const updateForm = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::update
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:192
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
updateForm.put = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:222
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
const destroyForm = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::destroy
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:222
* @route '/admin/reparaciones/preservicio/checklist/{item}'
*/
destroyForm.delete = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:316
* @route '/admin/reparaciones/preservicio/checklist/reorder'
*/
const reorderForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reorder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::reorder
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:316
* @route '/admin/reparaciones/preservicio/checklist/reorder'
*/
reorderForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reorder.url(options),
    method: 'post',
})

reorder.form = reorderForm

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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:344
* @route '/admin/reparaciones/preservicio/checklist/batch-toggle'
*/
const batchToggleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: batchToggle.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::batchToggle
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:344
* @route '/admin/reparaciones/preservicio/checklist/batch-toggle'
*/
batchToggleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: batchToggle.url(options),
    method: 'post',
})

batchToggle.form = batchToggleForm

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
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:389
* @route '/admin/reparaciones/preservicio/checklist/{item}/duplicate'
*/
const duplicateForm = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: duplicate.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::duplicate
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:389
* @route '/admin/reparaciones/preservicio/checklist/{item}/duplicate'
*/
duplicateForm.post = (args: { item: string | number } | [item: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: duplicate.url(args, options),
    method: 'post',
})

duplicate.form = duplicateForm

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::resetDefaults
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
export const resetDefaults = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetDefaults.url(options),
    method: 'post',
})

resetDefaults.definition = {
    methods: ["post"],
    url: '/admin/reparaciones/preservicio/checklist/reset-defaults',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::resetDefaults
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
resetDefaults.url = (options?: RouteQueryOptions) => {
    return resetDefaults.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::resetDefaults
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
resetDefaults.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetDefaults.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::resetDefaults
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
const resetDefaultsForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: resetDefaults.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::resetDefaults
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:243
* @route '/admin/reparaciones/preservicio/checklist/reset-defaults'
*/
resetDefaultsForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: resetDefaults.url(options),
    method: 'post',
})

resetDefaults.form = resetDefaultsForm

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

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:265
* @route '/admin/reparaciones/preservicio/checklist/copy-to-branch'
*/
const copyToBranchForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: copyToBranch.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ReparacionPreservicioChecklistController::copyToBranch
* @see app/Http/Controllers/Admin/ReparacionPreservicioChecklistController.php:265
* @route '/admin/reparaciones/preservicio/checklist/copy-to-branch'
*/
copyToBranchForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: copyToBranch.url(options),
    method: 'post',
})

copyToBranch.form = copyToBranchForm

const ReparacionPreservicioChecklistController = { indexPage, index, store, update, destroy, reorder, batchToggle, duplicate, resetDefaults, copyToBranch }

export default ReparacionPreservicioChecklistController