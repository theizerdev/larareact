import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteMethod
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
export const deleteMethod = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})

deleteMethod.definition = {
    methods: ["delete"],
    url: '/admin/ventas/held/{heldSale}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteMethod
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
deleteMethod.url = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { heldSale: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { heldSale: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            heldSale: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        heldSale: typeof args.heldSale === 'object'
        ? args.heldSale.id
        : args.heldSale,
    }

    return deleteMethod.definition.url
            .replace('{heldSale}', parsedArgs.heldSale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\PointOfSale\SaleController::deleteMethod
* @see app/Http/Controllers/Admin/PointOfSale/SaleController.php:330
* @route '/admin/ventas/held/{heldSale}'
*/
deleteMethod.delete = (args: { heldSale: number | { id: number } } | [heldSale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteMethod.url(args, options),
    method: 'delete',
})

const held = {
    delete: Object.assign(deleteMethod, deleteMethod),
}

export default held