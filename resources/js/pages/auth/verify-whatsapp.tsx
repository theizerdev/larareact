import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ShieldCheck, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';

interface Props {
    telefono: string;
    email: string;
    status?: string;
}

export default function VerifyWhatsapp({ telefono, email, status }: Props) {
    const { __ } = useTranslate();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const [resending, setResending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/verify-whatsapp/verify');
    };

    const handleResend = () => {
        setResending(true);
        router.post('/verify-whatsapp/resend', {}, {
            onFinish: () => setResending(false),
        });
    };

    return (
        <>
            <Head title={__('Verificación de WhatsApp')} />

            <div className="space-y-4">
                <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3.5 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                            {__('Código enviado por WhatsApp')}
                        </p>
                        <p className="text-muted-foreground leading-snug">
                            {__('Hemos enviado un código OTP de 8 dígitos al número:')}{' '}
                            <strong className="text-foreground font-mono font-bold">{telefono}</strong>
                        </p>
                    </div>
                </div>

                {status && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-center">
                        <Label htmlFor="code" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {__('Código OTP de 8 Dígitos')}
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            maxLength={8}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                            placeholder="12345678"
                            className="h-11 text-center font-mono text-lg tracking-[0.2em] font-black uppercase"
                            autoFocus
                            required
                        />
                        <InputError message={errors.code} />
                    </div>

                    <Button
                        type="submit"
                        disabled={processing || data.code.length !== 8}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-xs shadow-sm"
                    >
                        {processing ? <Spinner className="mr-2" /> : <ShieldCheck className="h-4 w-4" />}
                        {__('Verificar y Acceder')}
                    </Button>
                </form>

                <div className="flex space-x-4 mt-4">
                    {/* Botón para reenviar OTP */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={resending}
                        onClick={handleResend}
                        className="gap-1.5 font-bold text-xs h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 flex-1"
                    >
                        {resending ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {__('Reenviar código OTP por WhatsApp')}
                    </Button>
                    {/* Botón de logout */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 font-bold text-xs h-8 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-950 flex-1"
                        onClick={() => {
                            fetch('/logout', {
                                method: 'POST',
                                headers: {
                                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                },
                            })
                                .then(() => {
                                    window.location.href = route('login');
                                })
                                .catch((err) => console.error('Error al cerrar sesión:', err));
                        }}
                    >
                        {__('Cerrar sesión')}
                    </Button>
                </div>
            </div>
        </>
    );
}

VerifyWhatsapp.layout = {
    title: 'Verificación de Teléfono',
    description: 'Ingrese el código OTP de 8 dígitos enviado a su WhatsApp.',
};
