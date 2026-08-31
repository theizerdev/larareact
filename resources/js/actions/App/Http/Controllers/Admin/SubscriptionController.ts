import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:118
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:118
* @route '/admin/subscription/expired'
*/
expired.url = (options?: RouteQueryOptions) => {
    return expired.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:118
* @route '/admin/subscription/expired'
*/
expired.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expired.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::expired
* @see app/Http/Controllers/Admin/SubscriptionController.php:118
* @route '/admin/subscription/expired'
*/
expired.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expired.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:192
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:192
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createPaypalOrder.url = (options?: RouteQueryOptions) => {
    return createPaypalOrder.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::createPaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:192
* @route '/admin/monitoring/subscription/paypal/create-order'
*/
createPaypalOrder.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPaypalOrder.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::capturePaypalOrder
* @see app/Http/Controllers/Admin/SubscriptionController.php:254
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:254
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:254
* @route '/admin/monitoring/subscription/paypal/capture-order/{orderId}'
*/
capturePaypalOrder.post = (args: { orderId: string | number } | [orderId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: capturePaypalOrder.url(args, options),
    method: 'post',
})

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
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:126
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:126
* @route '/admin/monitoring/subscription/renew'
*/
renew.url = (options?: RouteQueryOptions) => {
    return renew.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::renew
* @see app/Http/Controllers/Admin/SubscriptionController.php:126
* @route '/admin/monitoring/subscription/renew'
*/
renew.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renew.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:377
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:377
* @route '/admin/monitoring/subscription/manage'
*/
manage.url = (options?: RouteQueryOptions) => {
    return manage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:377
* @route '/admin/monitoring/subscription/manage'
*/
manage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::manage
* @see app/Http/Controllers/Admin/SubscriptionController.php:377
* @route '/admin/monitoring/subscription/manage'
*/
manage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manage.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approvePayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:438
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:438
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:438
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approvePayment.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approvePayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::rejectPayment
* @see app/Http/Controllers/Admin/SubscriptionController.php:532
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:532
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:532
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
rejectPayment.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rejectPayment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresaSubscription
* @see app/Http/Controllers/Admin/SubscriptionController.php:553
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:553
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:553
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresaSubscription.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEmpresaSubscription.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::sendReminder
* @see app/Http/Controllers/Admin/SubscriptionController.php:616
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:616
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
* @see app/Http/Controllers/Admin/SubscriptionController.php:616
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
sendReminder.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendReminder.url(args, options),
    method: 'post',
})

const SubscriptionController = { expired, createPaypalOrder, capturePaypalOrder, index, renew, manage, approvePayment, rejectPayment, updateEmpresaSubscription, sendReminder }

export default SubscriptionController