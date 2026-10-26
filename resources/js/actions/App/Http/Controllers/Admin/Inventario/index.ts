import InventoryAdjustmentController from './InventoryAdjustmentController'
import KardexController from './KardexController'

const Inventario = {
    InventoryAdjustmentController: Object.assign(InventoryAdjustmentController, InventoryAdjustmentController),
    KardexController: Object.assign(KardexController, KardexController),
}

export default Inventario