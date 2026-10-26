import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
export const createOrder = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createOrder.url(options),
    method: 'post',
})

createOrder.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/paypal/create-order',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createOrder.url = (options?: RouteQueryOptions) => {
    return createOrder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createOrder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createOrder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
const createOrderForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createOrder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createOrderForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createOrder.url(options),
    method: 'post',
})

createOrder.form = createOrderForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::captureOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
export const captureOrder = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: captureOrder.url(args, options),
    method: 'post',
})

captureOrder.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/paypal/capture-order/{orderId}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::captureOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
captureOrder.url = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { orderId: args }
    }

    if (Array.isArray(args)) {
        args = {
            orderId: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        orderId: args.orderId,
    }

    return captureOrder.definition.url
            .replace('{orderId}', parsedArgs.orderId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::captureOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
captureOrder.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: captureOrder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::captureOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
const captureOrderForm = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: captureOrder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::captureOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
captureOrderForm.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: captureOrder.url(args, options),
    method: 'post',
})

captureOrder.form = captureOrderForm

const paypal = {
    createOrder: Object.assign(createOrder, createOrder),
    captureOrder: Object.assign(captureOrder, captureOrder),
}

export default paypal