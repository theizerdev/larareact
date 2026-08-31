import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
const update85e618a19e56f773fec15bf72c1540fc = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update85e618a19e56f773fec15bf72c1540fc.url(options),
    method: 'post',
})

update85e618a19e56f773fec15bf72c1540fc.definition = {
    methods: ["post"],
    url: '/admin/credit-config',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
update85e618a19e56f773fec15bf72c1540fc.url = (options?: RouteQueryOptions) => {
    return update85e618a19e56f773fec15bf72c1540fc.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config'
*/
update85e618a19e56f773fec15bf72c1540fc.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update85e618a19e56f773fec15bf72c1540fc.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
const updatec94aaf2841b1a4bf8081f31ad3785af6 = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatec94aaf2841b1a4bf8081f31ad3785af6.url(args, options),
    method: 'put',
})

updatec94aaf2841b1a4bf8081f31ad3785af6.definition = {
    methods: ["put"],
    url: '/admin/credit-config/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
updatec94aaf2841b1a4bf8081f31ad3785af6.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return updatec94aaf2841b1a4bf8081f31ad3785af6.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CreditConfigController::update
* @see app/Http/Controllers/Admin/CreditConfigController.php:47
* @route '/admin/credit-config/{id}'
*/
updatec94aaf2841b1a4bf8081f31ad3785af6.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatec94aaf2841b1a4bf8081f31ad3785af6.url(args, options),
    method: 'put',
})

/**
* Multiple routes resolve to \App\Http\Controllers\Admin\CreditConfigController::update, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `update['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const update = {
    '/admin/credit-config': update85e618a19e56f773fec15bf72c1540fc,
    '/admin/credit-config/{id}': updatec94aaf2841b1a4bf8081f31ad3785af6,
}

const CreditConfigController = { index, update }

export default CreditConfigController