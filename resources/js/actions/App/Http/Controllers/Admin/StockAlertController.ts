import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
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
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::index
* @see app/Http/Controllers/Admin/StockAlertController.php:20
* @route '/admin/stock-alerts'
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
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
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
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
count.url = (options?: RouteQueryOptions) => {
    return count.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
count.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: count.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
count.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: count.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
const countForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: count.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
countForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: count.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::count
* @see app/Http/Controllers/Admin/StockAlertController.php:95
* @route '/admin/stock-alerts/count'
*/
countForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: count.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

count.form = countForm

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/admin/stock-alerts/export-pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\StockAlertController::exportPdf
* @see app/Http/Controllers/Admin/StockAlertController.php:34
* @route '/admin/stock-alerts/export-pdf'
*/
exportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportPdf.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportPdf.form = exportPdfForm

const StockAlertController = { index, count, exportPdf }

export default StockAlertController