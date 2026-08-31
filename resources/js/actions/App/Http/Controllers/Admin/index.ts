import DashboardController from './DashboardController'
import SuperAdminDashboardController from './SuperAdminDashboardController'
import TestimonioController from './TestimonioController'
import ReparacionController from './ReparacionController'
import ActivityMonitoringController from './ActivityMonitoringController'
import ContabilidadController from './ContabilidadController'
import CreditConfigController from './CreditConfigController'
import DbMonitoringController from './DbMonitoringController'
import EmpresaController from './EmpresaController'
import CategoriaController from './CategoriaController'
import MarcaController from './MarcaController'
import FamiliaController from './FamiliaController'
import ModeloController from './ModeloController'
import ProductoController from './ProductoController'
import IntegrationController from './IntegrationController'
import Inventario from './Inventario'
import LogMonitoringController from './LogMonitoringController'
import AuditLogController from './AuditLogController'
import NominaController from './NominaController'
import PaisController from './PaisController'
import PointOfSale from './PointOfSale'
import MonthlyFundController from './MonthlyFundController'
import StockAlertController from './StockAlertController'
import ProveedorController from './ProveedorController'
import QueueMonitoringController from './QueueMonitoringController'
import ReparacionChecklistController from './ReparacionChecklistController'
import RoleController from './RoleController'
import ServerMonitoringController from './ServerMonitoringController'
import SessionMonitoringController from './SessionMonitoringController'
import SubscriptionController from './SubscriptionController'
import SubscriptionPlanController from './SubscriptionPlanController'
import SucursalController from './SucursalController'
import TaskMonitoringController from './TaskMonitoringController'
import TerminalController from './TerminalController'
import UserController from './UserController'

const Admin = {
    DashboardController: Object.assign(DashboardController, DashboardController),
    SuperAdminDashboardController: Object.assign(SuperAdminDashboardController, SuperAdminDashboardController),
    TestimonioController: Object.assign(TestimonioController, TestimonioController),
    ReparacionController: Object.assign(ReparacionController, ReparacionController),
    ActivityMonitoringController: Object.assign(ActivityMonitoringController, ActivityMonitoringController),
    ContabilidadController: Object.assign(ContabilidadController, ContabilidadController),
    CreditConfigController: Object.assign(CreditConfigController, CreditConfigController),
    DbMonitoringController: Object.assign(DbMonitoringController, DbMonitoringController),
    EmpresaController: Object.assign(EmpresaController, EmpresaController),
    CategoriaController: Object.assign(CategoriaController, CategoriaController),
    MarcaController: Object.assign(MarcaController, MarcaController),
    FamiliaController: Object.assign(FamiliaController, FamiliaController),
    ModeloController: Object.assign(ModeloController, ModeloController),
    ProductoController: Object.assign(ProductoController, ProductoController),
    IntegrationController: Object.assign(IntegrationController, IntegrationController),
    Inventario: Object.assign(Inventario, Inventario),
    LogMonitoringController: Object.assign(LogMonitoringController, LogMonitoringController),
    AuditLogController: Object.assign(AuditLogController, AuditLogController),
    NominaController: Object.assign(NominaController, NominaController),
    PaisController: Object.assign(PaisController, PaisController),
    PointOfSale: Object.assign(PointOfSale, PointOfSale),
    MonthlyFundController: Object.assign(MonthlyFundController, MonthlyFundController),
    StockAlertController: Object.assign(StockAlertController, StockAlertController),
    ProveedorController: Object.assign(ProveedorController, ProveedorController),
    QueueMonitoringController: Object.assign(QueueMonitoringController, QueueMonitoringController),
    ReparacionChecklistController: Object.assign(ReparacionChecklistController, ReparacionChecklistController),
    RoleController: Object.assign(RoleController, RoleController),
    ServerMonitoringController: Object.assign(ServerMonitoringController, ServerMonitoringController),
    SessionMonitoringController: Object.assign(SessionMonitoringController, SessionMonitoringController),
    SubscriptionController: Object.assign(SubscriptionController, SubscriptionController),
    SubscriptionPlanController: Object.assign(SubscriptionPlanController, SubscriptionPlanController),
    SucursalController: Object.assign(SucursalController, SucursalController),
    TaskMonitoringController: Object.assign(TaskMonitoringController, TaskMonitoringController),
    TerminalController: Object.assign(TerminalController, TerminalController),
    UserController: Object.assign(UserController, UserController),
}

export default Admin