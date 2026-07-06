import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, MailCheck } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Recuperar contraseña" />

            {status && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    <MailCheck className="mt-0.5 size-4 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <Form {...email.form()} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <FormField
                            label="Correo electrónico"
                            htmlFor="email"
                            error={errors.email}
                            required
                        >
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="off"
                                autoFocus
                                placeholder="nombre@empresa.com"
                            />
                        </FormField>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            Enviar enlace de recuperación
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
                <span>¿Recordaste tu contraseña? </span>
                <TextLink href={login()}>Volver al inicio de sesión</TextLink>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Recuperar contraseña',
    description:
        'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña',
};
