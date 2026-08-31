import ForgotPasswordOtpController from './ForgotPasswordOtpController'
import WhatsAppVerificationController from './WhatsAppVerificationController'

const Auth = {
    ForgotPasswordOtpController: Object.assign(ForgotPasswordOtpController, ForgotPasswordOtpController),
    WhatsAppVerificationController: Object.assign(WhatsAppVerificationController, WhatsAppVerificationController),
}

export default Auth