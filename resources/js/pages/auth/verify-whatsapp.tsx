import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthLayout from '@/layouts/auth-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ShieldCheck, MessageSquare, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
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
        <AuthLayout
            title={__('Verificación de Teléfono WhatsApp')}
            description={__('Ingrese el código OTP de 8 dígitos enviado a su número de WhatsApp.')}
        >
            <Head title={__('Verificación de WhatsApp')} />

            <div className="space-y-6">
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 p-4 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-md">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 text-xs">
                        <p className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                            {__('Código enviado por WhatsApp')}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            {__('Hemos enviado un código OTP de 8 dígitos al número de WhatsApp:')}{' '}
                            <strong className="text-foreground font-mono font-bold">{telefono}</strong>.
                        </p>
                    </div>
                </div>

                {status && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2 text-center">
                        <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {__('Código OTP de 8 Dígitos')}
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            maxLength={8}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.trim())}
                            placeholder="12345678"
                            className="h-14 text-center font-mono text-2xl tracking-[0.4em] font-black uppercase"
                            autoFocus
                            required
                        />
                        <InputError message={errors.code} />
                    </div>

                    <Button
                        type="submit"
                        disabled={processing || data.code.length !== 8}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 text-sm shadow-md"
                    >
                        {processing ? <Spinner className="mr-2" /> : <ShieldCheck className="h-4 w-4" />}
                        {__('Verificar y Acceder al Sistema')}
                    </Button>
                </form>

                <div className="flex flex-col items-center gap-3 pt-2 text-center text-xs">
                    <p className="text-muted-foreground">
                        {__('¿No recibió el código de verificación?')}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resending}
                        onClick={handleResend}
                        className="gap-2 font-bold text-xs"
                    >
                        {resending ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />}
                        {__('Reenviar código OTP por WhatsApp')}
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
