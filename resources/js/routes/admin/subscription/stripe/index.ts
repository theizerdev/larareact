import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\SubscriptionController::createCheckout
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
const createCheckoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createCheckout.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createCheckout
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
createCheckoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createCheckout.url(options),
    method: 'post',
})

createCheckout.form = createCheckoutForm

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

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
const successForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
successForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::success
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
successForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: success.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

success.form = successForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
export const cancel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancel.url(options),
    method: 'get',
})

cancel.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription/stripe/cancel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
cancel.url = (options?: RouteQueryOptions) => {
    return cancel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
cancel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
cancel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cancel.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
const cancelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
cancelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::cancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
cancelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cancel.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

cancel.form = cancelForm

const stripe = {
    createCheckout: Object.assign(createCheckout, createCheckout),
    success: Object.assign(success, success),
    cancel: Object.assign(cancel, cancel),
}

export default stripe