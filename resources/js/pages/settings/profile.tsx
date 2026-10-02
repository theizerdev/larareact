import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Configuración de perfil" />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title="Perfil"
                    description="Actualiza tu información personal y correo electrónico"
                />

                <SectionCard
                    title="Información del perfil"
                    description="Actualiza tu nombre y dirección de correo electrónico"
                >
                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <FormField
                                    label="Usuario"
                                    htmlFor="username"
                                    error={errors.username}
                                    required
                                >
                                    <Input
                                        id="username"
                                        defaultValue={auth.user.username}
                                        name="username"
                                        required
                                        autoComplete="username"
                                        placeholder="Usuario de acceso"
                                    />
                                </FormField>
                                <FormField
                                    label="Nombre"
                                    htmlFor="name"
                                    error={errors.name}
                                    required
                                >
                                    <Input
                                        id="name"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />
                                </FormField>

                                <FormField
                                    label="Correo electrónico"
                                    htmlFor="email"
                                    error={errors.email}
                                    required
                                >
                                    <Input
                                        id="email"
                                        type="email"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="correo@empresa.com"
                                    />
                                </FormField>

                                <FormField
                                    label="Numero telefónico"
                                    htmlFor="telefono"
                                    error={errors.telefono}
                                    required
                                >
                                    <Input
                                        id="telefono"
                                        defaultValue={auth.user.telefono}
                                        name="telefono"
                                        required
                                        autoComplete="telefono"
                                        placeholder="Numero telefónico"
                                    />
                                </FormField>



                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Tu correo no está verificado.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                                                >
                                                    Reenviar correo de
                                                    verificación
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-medium text-emerald-600">
                                                        Se ha enviado un nuevo
                                                        enlace de verificación a tu
                                                        correo.
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4 pt-2">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Guardar cambios
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </SectionCard>

                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Configuración',
            href: edit(),
        },
        {
            title: 'Perfil',
            href: edit(),
        },
    ],
};
