import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
import update603324 from './update'
/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/credit-config',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::index
* @see app/Http/Controllers/Admin/CreditConfigController.php:15
* @route '/admin/credit-config'
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
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/admin/credit-config',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(options),
    method: 'post',
})

update.form = updateForm

const creditConfig = {
    index: Object.assign(index, index),
    update: Object.assign(update, update603324),
}

export default creditConfig