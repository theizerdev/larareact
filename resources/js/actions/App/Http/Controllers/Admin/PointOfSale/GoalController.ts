import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/pos/metas',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::index
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:36
* @route '/admin/pos/metas'
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
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::store
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:221
* @route '/admin/pos/metas'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/pos/metas',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::store
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:221
* @route '/admin/pos/metas'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::store
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:221
* @route '/admin/pos/metas'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::store
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:221
* @route '/admin/pos/metas'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\PointOfSale\GoalController::store
* @see app/Http/Controllers/Admin/PointOfSale/GoalController.php:221
* @route '/admin/pos/metas'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

const GoalController = { index, store }

export default GoalController