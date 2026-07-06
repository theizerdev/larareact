import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Configuración de seguridad" />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title="Seguridad"
                    description="Administra tu contraseña y métodos de autenticación"
                />

                <SectionCard
                    title="Actualizar contraseña"
                    description="Asegúrate de usar una contraseña larga y aleatoria para mantener tu cuenta segura"
                >
                    <Form
                        {...SecurityController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <FormField
                                    label="Contraseña actual"
                                    htmlFor="current_password"
                                    error={errors.current_password}
                                    required
                                >
                                    <PasswordInput
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        autoComplete="current-password"
                                        placeholder="Contraseña actual"
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
                                        ref={passwordInput}
                                        name="password"
                                        autoComplete="new-password"
                                        placeholder="Nueva contraseña"
                                        passwordrules={props.passwordRules}
                                    />
                                </FormField>

                                <FormField
                                    label="Confirmar contraseña"
                                    htmlFor="password_confirmation"
                                    error={errors.password_confirmation}
                                    required
                                >
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        autoComplete="new-password"
                                        placeholder="Confirmar contraseña"
                                        passwordrules={props.passwordRules}
                                    />
                                </FormField>

                                <div className="flex items-center gap-4 pt-2">
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                    >
                                        Guardar cambios
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </SectionCard>

                <ManageTwoFactor
                    canManageTwoFactor={props.canManageTwoFactor}
                    requiresConfirmation={props.requiresConfirmation}
                    twoFactorEnabled={props.twoFactorEnabled}
                />

                <ManagePasskeys
                    canManagePasskeys={props.canManagePasskeys}
                    passkeys={props.passkeys}
                />
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Configuración',
            href: edit(),
        },
        {
            title: 'Seguridad',
            href: edit(),
        },
    ],
};
