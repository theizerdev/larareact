import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:15
* @route '/admin/stock-alerts'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/stock-alerts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:15
* @route '/admin/stock-alerts'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:15
* @route '/admin/stock-alerts'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:15
* @route '/admin/stock-alerts'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:74
* @route '/admin/stock-alerts/count'
*/
export const count = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: count.url(options),
    method: 'get',
})

count.definition = {
    methods: ["get","head"],
    url: '/admin/stock-alerts/count',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:74
* @route '/admin/stock-alerts/count'
*/
count.url = (options?: RouteQueryOptions) => {
    return count.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:74
* @route '/admin/stock-alerts/count'
*/
count.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: count.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:74
* @route '/admin/stock-alerts/count'
*/
count.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: count.url(options),
    method: 'head',
})

const stockAlerts = {
    index: Object.assign(index, index),
    count: Object.assign(count, count),
}

export default stockAlerts