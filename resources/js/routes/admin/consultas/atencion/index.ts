import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
export const store = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/consultas/{cita}/atencion',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
store.url = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { cita: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { cita: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    cita: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        cita: typeof args.cita === 'object'
                ? args.cita.id
                : args.cita,
                }

    return store.definition.url
            .replace('{cita}', parsedArgs.cita.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
store.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
    const storeForm = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ConsultaMedicaController::store
 * @see app/Http/Controllers/Admin/ConsultaMedicaController.php:268
 * @route '/admin/consultas/{cita}/atencion'
 */
        storeForm.post = (args: { cita: number | { id: number } } | [cita: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const atencion = {
    store: Object.assign(store, store),
}

export default atencion