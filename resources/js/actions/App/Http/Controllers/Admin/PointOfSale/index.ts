import CashRegisterController from './CashRegisterController'
import GoalController from './GoalController'
import ServicioController from './ServicioController'
import SaleController from './SaleController'
import ClienteController from './ClienteController'
import PurchaseController from './PurchaseController'

const PointOfSale = {
    CashRegisterController: Object.assign(CashRegisterController, CashRegisterController),
    GoalController: Object.assign(GoalController, GoalController),
    ServicioController: Object.assign(ServicioController, ServicioController),
    SaleController: Object.assign(SaleController, SaleController),
    ClienteController: Object.assign(ClienteController, ClienteController),
    PurchaseController: Object.assign(PurchaseController, PurchaseController),
}

export default PointOfSale