import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import paypal from './paypal'
import stripe from './stripe'
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
* @see \App\Http\Controllers\Admin\SubscriptionController::approve
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
export const approve = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/approve/{payment}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approve
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approve.url = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return approve.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approve
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approve.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approve
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
const approveForm = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::approve
* @see app/Http/Controllers/Admin/SubscriptionController.php:847
* @route '/admin/monitoring/subscription/approve/{payment}'
*/
approveForm.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: approve.url(args, options),
    method: 'post',
})

approve.form = approveForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::reject
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
export const reject = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/reject/{payment}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::reject
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
reject.url = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reject.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::reject
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
reject.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::reject
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
const rejectForm = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reject.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::reject
* @see app/Http/Controllers/Admin/SubscriptionController.php:944
* @route '/admin/monitoring/subscription/reject/{payment}'
*/
rejectForm.post = (args: { payment: number | { id: number } } | [payment: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reject.url(args, options),
    method: 'post',
})

reject.form = rejectForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresa
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
export const updateEmpresa = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEmpresa.url(args, options),
    method: 'post',
})

updateEmpresa.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/update-empresa/{empresa}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresa
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresa.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateEmpresa.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresa
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresa.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: updateEmpresa.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresa
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
const updateEmpresaForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEmpresa.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::updateEmpresa
* @see app/Http/Controllers/Admin/SubscriptionController.php:965
* @route '/admin/monitoring/subscription/update-empresa/{empresa}'
*/
updateEmpresaForm.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updateEmpresa.url(args, options),
    method: 'post',
})

updateEmpresa.form = updateEmpresaForm

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::notify
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
export const notify = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: notify.url(args, options),
    method: 'post',
})

notify.definition = {
    methods: ["post"],
    url: '/admin/monitoring/subscription/notify/{empresa}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::notify
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
notify.url = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return notify.definition.url
            .replace('{empresa}', parsedArgs.empresa.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::notify
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
notify.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: notify.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::notify
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
const notifyForm = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: notify.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\SubscriptionController::notify
* @see app/Http/Controllers/Admin/SubscriptionController.php:1028
* @route '/admin/monitoring/subscription/notify/{empresa}'
*/
notifyForm.post = (args: { empresa: number | { id: number } } | [empresa: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: notify.url(args, options),
    method: 'post',
})

notify.form = notifyForm

const subscription = {
    expired: Object.assign(expired, expired),
    paypal: Object.assign(paypal, paypal),
    stripe: Object.assign(stripe, stripe),
    index: Object.assign(index, index),
    renew: Object.assign(renew, renew),
    manage: Object.assign(manage, manage),
    approve: Object.assign(approve, approve),
    reject: Object.assign(reject, reject),
    updateEmpresa: Object.assign(updateEmpresa, updateEmpresa),
    notify: Object.assign(notify, notify),
}

export default subscription