import admin from './admin'

const namespaced = {
    admin: Object.assign(admin, admin),
}

export default namespaced