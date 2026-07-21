import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/forgot-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::show
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:19
 * @route '/forgot-password'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::sendOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:39
 * @route '/forgot-password/send-otp'
 */
export const sendOtp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendOtp.url(options),
    method: 'post',
})

sendOtp.definition = {
    methods: ["post"],
    url: '/forgot-password/send-otp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::sendOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:39
 * @route '/forgot-password/send-otp'
 */
sendOtp.url = (options?: RouteQueryOptions) => {
    return sendOtp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::sendOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:39
 * @route '/forgot-password/send-otp'
 */
sendOtp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendOtp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::sendOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:39
 * @route '/forgot-password/send-otp'
 */
    const sendOtpForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sendOtp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::sendOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:39
 * @route '/forgot-password/send-otp'
 */
        sendOtpForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sendOtp.url(options),
            method: 'post',
        })
    
    sendOtp.form = sendOtpForm
/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::verifyOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:102
 * @route '/forgot-password/verify-otp'
 */
export const verifyOtp = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyOtp.url(options),
    method: 'post',
})

verifyOtp.definition = {
    methods: ["post"],
    url: '/forgot-password/verify-otp',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::verifyOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:102
 * @route '/forgot-password/verify-otp'
 */
verifyOtp.url = (options?: RouteQueryOptions) => {
    return verifyOtp.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::verifyOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:102
 * @route '/forgot-password/verify-otp'
 */
verifyOtp.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: verifyOtp.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::verifyOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:102
 * @route '/forgot-password/verify-otp'
 */
    const verifyOtpForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: verifyOtp.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::verifyOtp
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:102
 * @route '/forgot-password/verify-otp'
 */
        verifyOtpForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: verifyOtp.url(options),
            method: 'post',
        })
    
    verifyOtp.form = verifyOtpForm
/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::resetPassword
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:148
 * @route '/forgot-password/reset'
 */
export const resetPassword = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetPassword.url(options),
    method: 'post',
})

resetPassword.definition = {
    methods: ["post"],
    url: '/forgot-password/reset',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::resetPassword
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:148
 * @route '/forgot-password/reset'
 */
resetPassword.url = (options?: RouteQueryOptions) => {
    return resetPassword.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::resetPassword
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:148
 * @route '/forgot-password/reset'
 */
resetPassword.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: resetPassword.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::resetPassword
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:148
 * @route '/forgot-password/reset'
 */
    const resetPasswordForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: resetPassword.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\ForgotPasswordOtpController::resetPassword
 * @see app/Http/Controllers/Auth/ForgotPasswordOtpController.php:148
 * @route '/forgot-password/reset'
 */
        resetPasswordForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: resetPassword.url(options),
            method: 'post',
        })
    
    resetPassword.form = resetPasswordForm
const ForgotPasswordOtpController = { show, sendOtp, verifyOtp, resetPassword }

export default ForgotPasswordOtpController