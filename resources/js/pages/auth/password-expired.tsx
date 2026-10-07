import { Head, useForm, router } from '@inertiajs/react';
import { ShieldAlert, LoaderCircle, LogOut, Lock } from 'lucide-react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { SoxPasswordRequirements } from '@/components/sox-password-requirements';

type Props = {
    user: {
        name: string;
        email: string;
    };
    daysSinceChange: number;
    policies: {
        minLength: number;
        historyLimit: number;
        expireDays: number;
        requireMixedCase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        requireUncompromised: boolean;
    };
};

export default function PasswordExpired({ user, daysSinceChange, policies }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/password/expired', {
            onFinish: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Renovación de Contraseña - Política SOX" />

            <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="text-xs space-y-1">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">
                            Vigencia de Contraseña Superada ({daysSinceChange} días)
                        </p>
                        <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                            De acuerdo con las políticas corporativas de ciberseguridad y la Sección 404 de la Ley Sarbanes-Oxley (SOX),
                            debe renovar su contraseña cada {policies.expireDays} días para continuar operando en Hoshō.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <FormField
                    label="Contraseña actual"
                    htmlFor="current_password"
                    error={errors.current_password}
                    required
                >
                    <PasswordInput
                        id="current_password"
                        name="current_password"
                        autoComplete="current-password"
                        autoFocus
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        placeholder="•••••••••••••••"
                    />
                </FormField>

                <FormField
                    label="Nueva contraseña"
                    htmlFor="password"
                    error={errors.password}
                    required
                >
                    <PasswordInput
                        id="password"
                        name="password"
                        autoComplete="new-password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder={`Mínimo ${policies.minLength} caracteres`}
                    />
                </FormField>

                {/* Live SOX validation checklist */}
                <SoxPasswordRequirements
                    password={data.password}
                    minLength={policies.minLength}
                    historyLimit={policies.historyLimit}
                />

                <FormField
                    label="Confirmar nueva contraseña"
                    htmlFor="password_confirmation"
                    error={errors.password_confirmation}
                    required
                >
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Repita la nueva contraseña"
                    />
                </FormField>

                <div className="pt-2 flex flex-col gap-2">
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={processing || data.password.length < policies.minLength}
                    >
                        {processing ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <Lock className="size-4" />
                        )}
                        Actualizar y Continuar
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full text-muted-foreground hover:text-foreground text-xs"
                    >
                        <LogOut className="size-3.5 mr-1.5" />
                        Cerrar sesión
                    </Button>
                </div>
            </form>
        </>
    );
}

PasswordExpired.layout = {
    title: 'Renovación Obligatoria SOX',
    description: 'Actualice su contraseña para dar cumplimiento al marco regulatorio SOX 404',
};
