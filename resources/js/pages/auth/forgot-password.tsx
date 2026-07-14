import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ArrowLeft, Send } from 'lucide-react';
import React, { useState, useRef } from 'react';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { login } from '@/routes';
import { sendOtp, verifyOtp, otpReset } from '@/routes/password';
import PhoneInputGroup from '../admin/Empresas/Partials/PhoneInputGroup';
import type { PaisPhoneOption } from '../admin/Empresas/Partials/PhoneInputGroup';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Props {
    paises: PaisPhoneOption[];
    otp_verified: boolean;
    verified_phone: string | null;
    verified_pais_id: number | null;
}

// ─── Componente OTP Auxiliar ──────────────────────────────────────────────────

const OTPInput = ({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false
}: {
    length?: number;
    value: string;
    onChange: (val: string) => void;
    onComplete?: (val: string) => void;
    disabled?: boolean;
}) => {
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const [otpValues, setOtpValues] = useState<string[]>(Array(length).fill(''));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        const numberVal = val.replace(/[^0-9]/g, '').slice(-1);

        const newOtp = [...otpValues];
        newOtp[index] = numberVal;
        setOtpValues(newOtp);

        const updatedOtpString = newOtp.join('');
        onChange(updatedOtpString);

        if (numberVal && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (updatedOtpString.length === length && onComplete) {
            onComplete(updatedOtpString);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!otpValues[index] && index > 0) {
                const newOtp = [...otpValues];
                newOtp[index - 1] = '';
                setOtpValues(newOtp);
                onChange(newOtp.join(''));
                inputRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otpValues];
                newOtp[index] = '';
                setOtpValues(newOtp);
                onChange(newOtp.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        const cleanData = pastedData.replace(/[^0-9]/g, '').slice(0, length);
        
        if (cleanData.length > 0) {
            const newOtp = Array(length).fill('');

            for (let i = 0; i < cleanData.length; i++) {
                newOtp[i] = cleanData[i];
            }

            setOtpValues(newOtp);
            
            const updatedOtpString = newOtp.join('');
            onChange(updatedOtpString);
            
            const focusIndex = Math.min(cleanData.length, length - 1);
            inputRefs.current[focusIndex]?.focus();
            
            if (cleanData.length === length && onComplete) {
                onComplete(updatedOtpString);
            }
        }
    };

    const isComplete = value.length === length;

    return (
        <div className="flex justify-center gap-2.5" style={{ direction: 'ltr' }}>
            {Array(length).fill(0).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        if (el) {
                            inputRefs.current[index] = el;
                        }
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={otpValues[index]}
                    disabled={disabled}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={`size-11 rounded-lg border text-center text-lg font-bold shadow-sm outline-none transition-all duration-200
                        ${otpValues[index]
                            ? 'border-emerald-400 bg-emerald-50/40 text-emerald-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-emerald-950/10 dark:text-emerald-300'
                            : 'border-input bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }
                        ${isComplete ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200' : ''}
                    `}
                />
            ))}
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ForgotPassword({
    paises,
    otp_verified,
    verified_phone,
    verified_pais_id,
}: Props) {
    const [step, setStep] = useState<'request_otp' | 'verify_otp' | 'reset_password'>(
        otp_verified ? 'reset_password' : 'request_otp'
    );

    // Formulario de Solicitud de OTP
    const requestForm = useForm({
        pais_telefono_id: verified_pais_id || paises[0]?.id || '',
        telefono: verified_phone || '',
    });

    // Formulario de Verificación de OTP
    const verifyForm = useForm({
        otp: '',
    });

    // Formulario de Restablecimiento de Contraseña
    const resetForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        requestForm.post(sendOtp().url, {
            preserveState: true,
            onSuccess: () => {
                setStep('verify_otp');
                verifyForm.reset('otp');
            },
        });
    };

    const handleVerifyOtp = (otpCode?: string) => {
        const code = otpCode || verifyForm.data.otp;
        
        verifyForm.transform((data) => ({
            ...data,
            otp: code,
            pais_telefono_id: requestForm.data.pais_telefono_id,
            telefono: requestForm.data.telefono,
        }));

        verifyForm.post(verifyOtp().url, {
            preserveState: true,
            onSuccess: () => {
                setStep('reset_password');
            },
        });
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();

        resetForm.transform((data) => ({
            ...data,
            pais_telefono_id: requestForm.data.pais_telefono_id,
            telefono: requestForm.data.telefono,
        }));

        resetForm.post(otpReset().url);
    };

    return (
        <>
            <Head title="Recuperar contraseña" />

            {/* ── Paso 1: Solicitar Código OTP ── */}
            {step === 'request_otp' && (
                <div className="space-y-6">
                    <form onSubmit={handleSendOtp} className="space-y-5">
                        <FormField
                            label="Número telefónico"
                            htmlFor="telefono"
                            error={requestForm.errors.telefono}
                            required
                        >
                            <PhoneInputGroup
                                paises={paises}
                                selectedPaisId={requestForm.data.pais_telefono_id}
                                phoneValue={requestForm.data.telefono}
                                onPaisChange={(id) => requestForm.setData('pais_telefono_id', id)}
                                onPhoneChange={(val) => requestForm.setData('telefono', val)}
                                placeholder="Escribe tu número"
                            />
                        </FormField>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={requestForm.processing}
                        >
                            {requestForm.processing ? (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 size-4" />
                            )}
                            Enviar código OTP
                        </Button>
                    </form>
                </div>
            )}

            {/* ── Paso 2: Verificar Código OTP ── */}
            {step === 'verify_otp' && (
                <div className="space-y-6">
                    <div className="space-y-6">
                        <OTPInput
                            key={step}
                            length={6}
                            value={verifyForm.data.otp}
                            disabled={verifyForm.processing}
                            onChange={(val) => verifyForm.setData('otp', val)}
                            onComplete={handleVerifyOtp}
                        />

                        {verifyForm.errors.otp && (
                            <p className="text-center text-xs text-destructive font-medium">
                                {verifyForm.errors.otp}
                            </p>
                        )}

                        <Button
                            type="button"
                            onClick={() => handleVerifyOtp()}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={verifyForm.processing || verifyForm.data.otp.length !== 6}
                        >
                            {verifyForm.processing && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            Verificar código
                        </Button>

                        <button
                            type="button"
                            onClick={() => setStep('request_otp')}
                            className="flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-3" />
                            Volver a ingresar teléfono
                        </button>
                    </div>
                </div>
            )}

            {/* ── Paso 3: Restablecer Contraseña ── */}
            {step === 'reset_password' && (
                <div className="space-y-6">
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <FormField
                            label="Nueva contraseña"
                            htmlFor="password"
                            error={resetForm.errors.password}
                            required
                        >
                            <PasswordInput
                                id="password"
                                name="password"
                                value={resetForm.data.password}
                                onChange={(e) => resetForm.setData('password', e.target.value)}
                                placeholder="Escribe tu nueva contraseña"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Confirmar contraseña"
                            htmlFor="password_confirmation"
                            error={resetForm.errors.password_confirmation}
                            required
                        >
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                value={resetForm.data.password_confirmation}
                                onChange={(e) => resetForm.setData('password_confirmation', e.target.value)}
                                placeholder="Confirma tu contraseña"
                                required
                            />
                        </FormField>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={resetForm.processing}
                        >
                            {resetForm.processing && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            Restablecer contraseña
                        </Button>
                    </form>
                </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
                <span>¿Recordaste tu contraseña? </span>
                <TextLink href={login()}>Volver al inicio de sesión</TextLink>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Recuperar contraseña',
    description: 'Recupera el acceso a tu cuenta mediante un código de verificación en tu WhatsApp.',
};
