import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Lock } from 'lucide-react';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            <PasskeyVerify />

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
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
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nombre@empresa.com"
                                />
                            </FormField>

                            <FormField
                                label="Contraseña"
                                htmlFor="password"
                                error={errors.password}
                                required
                            >
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                />
                            </FormField>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="text-sm font-normal text-muted-foreground"
                                    >
                                        Recordarme
                                    </Label>
                                </div>

                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-sm"
                                        tabIndex={5}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </TextLink>
                                )}
                            </div>

                            {errors.email && (errors.email.includes('bloqueada') || errors.email.includes('SOX')) && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-2.5">
                                    <span className="p-1 rounded-md bg-red-600 text-white shrink-0">
                                        <Lock className="size-3.5" />
                                    </span>
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-red-900 dark:text-red-200">
                                            Bloqueo de Seguridad SOX 404
                                        </p>
                                        <p className="leading-relaxed">
                                            {errors.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && (
                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                )}
                                Iniciar sesión
                            </Button>

                            <div className="relative my-1">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                                    <span className="bg-background px-2 text-muted-foreground font-semibold">
                                        Federación Corporativa SOX
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2 text-xs font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                                onClick={() => {
                                    window.location.href = '/auth/sso/azure/redirect';
                                }}
                            >
                                <svg className="size-3.5 shrink-0" viewBox="0 0 23 23">
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                                Iniciar con Microsoft Entra ID (SSO)
                            </Button>
                        </div>


                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Inicia sesión en tu cuenta',
    description: 'Ingresa tu correo y contraseña para continuar',
};
