import { useState } from 'react';
import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import PhoneInputGroup from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { CheckCircle2 } from 'lucide-react';

interface PaisOption {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
}

type Props = {
    passwordRules: string;
    paises?: PaisOption[];
};

export default function Register({ passwordRules, paises = [] }: Props) {
    const [paisId, setPaisId] = useState<string | number>(paises[0]?.id ?? '');
    const [companyPhone, setCompanyPhone] = useState('');

    return (
        <>
            <Head title="Crear Cuenta" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => {
                    return (
                        <>
                            <input type="hidden" name="pais_id" value={paisId} />
                            <input type="hidden" name="company_phone" value={companyPhone} />

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company_name" className="text-sm font-medium">Nombre de la Empresa / Razón Social *</Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        placeholder="Ej: Restaurante y Café Bajo el Reloj C.A."
                                        className="h-10"
                                    />
                                    <InputError message={errors.company_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nombre_comercial" className="text-sm font-medium">Nombre Comercial / Marca (Opcional)</Label>
                                    <Input
                                        id="nombre_comercial"
                                        name="nombre_comercial"
                                        type="text"
                                        tabIndex={2}
                                        placeholder="Ej: Bajo el Reloj"
                                        className="h-10"
                                    />
                                    <InputError message={errors.nombre_comercial} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="representante_legal" className="text-sm font-medium">Representante Legal (Nombre Completo) *</Label>
                                    <Input
                                        id="representante_legal"
                                        name="representante_legal"
                                        type="text"
                                        required
                                        tabIndex={2}
                                        placeholder="Ej: Juan Pérez"
                                        className="h-10"
                                    />
                                    <InputError message={errors.representante_legal} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico *</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        tabIndex={3}
                                        autoComplete="email"
                                        placeholder="contacto@empresa.com"
                                        className="h-10"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="pais_id_select" className="text-sm font-medium">País *</Label>
                                    <Select
                                        value={String(paisId)}
                                        onValueChange={(val) => setPaisId(val)}
                                    >
                                        <SelectTrigger id="pais_id_select" tabIndex={4} className="h-10">
                                            <SelectValue placeholder="Seleccione un país" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paises.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.pais_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Teléfono de Contacto</Label>
                                    <PhoneInputGroup
                                        paises={paises}
                                        selectedPaisId={paisId}
                                        phoneValue={companyPhone}
                                        onPaisChange={(pid) => setPaisId(pid)}
                                        onPhoneChange={(num) => setCompanyPhone(num)}
                                        placeholder="Ej: 4121234567"
                                        error={errors.company_phone}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={5}
                                        autoComplete="new-password"
                                        placeholder="Contraseña"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-medium">Confirmar Contraseña *</Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        tabIndex={6}
                                        autoComplete="new-password"
                                        placeholder="Repita la contraseña"
                                        passwordrules={passwordRules}
                                    />
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs text-muted-foreground flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>Al registrarse obtendrá <strong>7 días de prueba totalmente gratis</strong> con perfil de <strong>Administrador</strong> y acceso completo a <strong>todos los módulos del sistema</strong>.</span>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full mt-2 h-10 font-medium"
                                    tabIndex={8}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner className="mr-2" />}
                                    Completar Registro
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground mt-3">
                                ¿Ya tiene una cuenta?{' '}
                                <TextLink href={login()} tabIndex={9}>
                                    Iniciar sesión
                                </TextLink>
                            </div>
                        </>
                    );
                }}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Crear una cuenta',
    description: 'Ingrese sus datos para comenzar con su prueba gratis de 7 días',
};



