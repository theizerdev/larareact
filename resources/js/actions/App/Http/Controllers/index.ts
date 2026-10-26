import Auth from './Auth'
import ContactController from './ContactController'
import Admin from './Admin'
import PublicReparacionTrackingController from './PublicReparacionTrackingController'
import Settings from './Settings'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    ContactController: Object.assign(ContactController, ContactController),
    Admin: Object.assign(Admin, Admin),
    PublicReparacionTrackingController: Object.assign(PublicReparacionTrackingController, PublicReparacionTrackingController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers