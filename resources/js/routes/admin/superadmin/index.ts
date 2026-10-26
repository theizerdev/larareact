import stripe from './stripe'

const superadmin = {
    stripe: Object.assign(stripe, stripe),
}

export default superadmin