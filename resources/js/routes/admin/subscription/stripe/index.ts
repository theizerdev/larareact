import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createCheckout
 * @see app/Http/Controllers/Admin/SubscriptionController.php:396
 * @route '/admin/monitoring/subscription/stripe/create-checkout'
 */
export const createCheckout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createCheckout.url(options),
    method: 'post',
})

createCheckout.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/stripe/create-checkout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createCheckout
 * @see app/Http/Controllers/Admin/SubscriptionController.php:396
 * @route '/admin/monitoring/subscription/stripe/create-checkout'
 */
createCheckout.url = (options?: RouteQueryOptions) => {
    return createCheckout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createCheckout
 * @see app/Http/Controllers/Admin/SubscriptionController.php:396
 * @route '/admin/monitoring/subscription/stripe/create-checkout'
 */
createCheckout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createCheckout.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
 * @see app/Http/Controllers/Admin/SubscriptionController.php:500
 * @route '/admin/monitoring/subscription/stripe/success'
 */
export const success = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: success.url(options),
    method: 'get',
})

success.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription/stripe/success',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
 * @see app/Http/Controllers/Admin/SubscriptionController.php:500
 * @route '/admin/monitoring/subscription/stripe/success'
 */
success.url = (options?: RouteQueryOptions) => {
    return success.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
 * @see app/Http/Controllers/Admin/SubscriptionController.php:500
 * @route '/admin/monitoring/subscription/stripe/success'
 */
success.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: success.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
 * @see app/Http/Controllers/Admin/SubscriptionController.php:500
 * @route '/admin/monitoring/subscription/stripe/success'
 */
success.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: success.url(options),
    method: 'head',
})
const stripe = {
    createCheckout: Object.assign(createCheckout, createCheckout),
success: Object.assign(success, success),
}

export default stripe