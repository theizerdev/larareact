import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
export const expired = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

expired.definition = {
    methods: ["get","head"],
    url: '/admin/subscription/expired',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
expired.url = (options?: RouteQueryOptions) => {
    return expired.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
expired.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
expired.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expired.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
const expiredForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
expiredForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:122
* @route '/admin/subscription/expired'
*/
expiredForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expired.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

expired.form = expiredForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
export const createPaypalOrder = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPaypalOrder.url(options),
    method: 'post',
})

createPaypalOrder.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/paypal/create-order',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createPaypalOrder.url = (options?: RouteQueryOptions) => {
    return createPaypalOrder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createPaypalOrder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPaypalOrder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
const createPaypalOrderForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createPaypalOrder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:202
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createPaypalOrderForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createPaypalOrder.url(options),
    method: 'post',
})

createPaypalOrder.form = createPaypalOrderForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
export const capturePaypalOrder = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: capturePaypalOrder.url(args, options),
    method: 'post',
})

capturePaypalOrder.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/paypal/capture-order/{orderId}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
capturePaypalOrder.url = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return capturePaypalOrder.definition.url
            .replace('{orderId}', parsedArgs.orderId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
capturePaypalOrder.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: capturePaypalOrder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
const capturePaypalOrderForm = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: capturePaypalOrder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:266
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
capturePaypalOrderForm.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: capturePaypalOrder.url(args, options),
    method: 'post',
})

capturePaypalOrder.form = capturePaypalOrderForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createStripeCheckoutSession
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
export const createStripeCheckoutSession = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createStripeCheckoutSession.url(options),
    method: 'post',
})

createStripeCheckoutSession.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/stripe/create-checkout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createStripeCheckoutSession
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
createStripeCheckoutSession.url = (options?: RouteQueryOptions) => {
    return createStripeCheckoutSession.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createStripeCheckoutSession
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
createStripeCheckoutSession.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createStripeCheckoutSession.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createStripeCheckoutSession
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
const createStripeCheckoutSessionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createStripeCheckoutSession.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createStripeCheckoutSession
* @see app/Http/Controllers/Admin/SubscriptionController.php:396
* @route '/admin/monitoring/subscription/stripe/create-checkout'
*/
createStripeCheckoutSessionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createStripeCheckoutSession.url(options),
    method: 'post',
})

createStripeCheckoutSession.form = createStripeCheckoutSessionForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
export const stripeSuccess = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stripeSuccess.url(options),
    method: 'get',
})

stripeSuccess.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription/stripe/success',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
stripeSuccess.url = (options?: RouteQueryOptions) => {
    return stripeSuccess.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
stripeSuccess.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stripeSuccess.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
stripeSuccess.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stripeSuccess.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
const stripeSuccessForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeSuccess.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
stripeSuccessForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeSuccess.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeSuccess
* @see app/Http/Controllers/Admin/SubscriptionController.php:500
* @route '/admin/monitoring/subscription/stripe/success'
*/
stripeSuccessForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeSuccess.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

stripeSuccess.form = stripeSuccessForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
export const stripeCancel = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stripeCancel.url(options),
    method: 'get',
})

stripeCancel.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription/stripe/cancel',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
stripeCancel.url = (options?: RouteQueryOptions) => {
    return stripeCancel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
stripeCancel.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stripeCancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
stripeCancel.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stripeCancel.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
const stripeCancelForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeCancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
stripeCancelForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeCancel.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::stripeCancel
* @see app/Http/Controllers/Admin/SubscriptionController.php:563
* @route '/admin/monitoring/subscription/stripe/cancel'
*/
stripeCancelForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stripeCancel.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

stripeCancel.form = stripeCancelForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::index
* @see app/Http/Controllers/Admin/SubscriptionController.php:21
* @route '/admin/monitoring/subscription'
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
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:130
* @route '/admin/monitoring/subscription/renew'
*/
export const renew = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renew.url(options),
    method: 'post',
})

renew.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/renew',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:130
* @route '/admin/monitoring/subscription/renew'
*/
renew.url = (options?: RouteQueryOptions) => {
    return renew.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:130
* @route '/admin/monitoring/subscription/renew'
*/
renew.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renew.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:130
* @route '/admin/monitoring/subscription/renew'
*/
const renewForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: renew.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:130
* @route '/admin/monitoring/subscription/renew'
*/
renewForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: renew.url(options),
    method: 'post',
})

renew.form = renewForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
export const manage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})

manage.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/subscription/manage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
manage.url = (options?: RouteQueryOptions) => {
    return manage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
manage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
manage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manage.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
const manageForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: manage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
manageForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: manage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:785
* @route '/admin/monitoring/subscription/manage'
*/
manageForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: manage.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

manage.form = manageForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
export const approvePayment = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approvePayment.url(args, options),
    method: 'post',
})

approvePayment.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/approve/{payment}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approvePayment.url = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { payment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { payment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            payment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        payment: typeof args.payment === 'object'
        ? args.payment.id
        : args.payment,
    }

    return approvePayment.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approvePayment.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approvePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
const approvePaymentForm = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approvePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approvePaymentForm.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approvePayment.url(args, options),
    method: 'post',
})

approvePayment.form = approvePaymentForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
export const rejectPayment = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectPayment.url(args, options),
    method: 'post',
})

rejectPayment.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/reject/{payment}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
rejectPayment.url = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { payment: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { payment: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            payment: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        payment: typeof args.payment === 'object'
        ? args.payment.id
        : args.payment,
    }

    return rejectPayment.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
rejectPayment.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectPayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
const rejectPaymentForm = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rejectPayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
rejectPaymentForm.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rejectPayment.url(args, options),
    method: 'post',
})

rejectPayment.form = rejectPaymentForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
export const updateEmpresaSubscription = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEmpresaSubscription.url(args, options),
    method: 'post',
})

updateEmpresaSubscription.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/update-empresa/{empresa}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresaSubscription.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { empresa: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            empresa: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        empresa: typeof args.empresa === 'object'
        ? args.empresa.id
        : args.empresa,
    }

    return updateEmpresaSubscription.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresaSubscription.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEmpresaSubscription.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
const updateEmpresaSubscriptionForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEmpresaSubscription.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresaSubscriptionForm.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEmpresaSubscription.url(args, options),
    method: 'post',
})

updateEmpresaSubscription.form = updateEmpresaSubscriptionForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
export const sendReminder = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendReminder.url(args, options),
    method: 'post',
})

sendReminder.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/notify/{empresa}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
sendReminder.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { empresa: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { empresa: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            empresa: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        empresa: typeof args.empresa === 'object'
        ? args.empresa.id
        : args.empresa,
    }

    return sendReminder.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
sendReminder.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendReminder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
const sendReminderForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendReminder.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
sendReminderForm.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendReminder.url(args, options),
    method: 'post',
})

sendReminder.form = sendReminderForm

const SubscriptionController = { expired, createPaypalOrder, capturePaypalOrder, createStripeCheckoutSession, stripeSuccess, stripeCancel, index, renew, manage, approvePayment, rejectPayment, updateEmpresaSubscription, sendReminder }

export default SubscriptionController