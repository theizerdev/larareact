import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import PhoneInputGroup from '@/pages/admin/Empresas/Partials/PhoneInputGroup';
import { login } from '@/routes';
import { store } from '@/routes/register';
import {
    ArrowLeft,
    Building2,
    Check,
    CheckCircle2,
    CreditCard,
    Lock,
    MessageSquare,
    ShieldCheck,
    ShoppingBag,
    User,
} from 'lucide-react';

interface PaisOption {
    id: number;
    nombre: string;
    codigo_iso2?: string | null;
    codigo_telefonico?: string | null;
}

interface PlanOption {
    id: number;
    nombre: string;
    descripcion?: string | null;
    ciclo_meses?: number;
    precio_regular_mensual?: number;
    precio_promocional_mensual?: number;
    precio_12_meses?: number;
    cupos_restantes?: number | null;
    destacado?: boolean;
}

interface PaymentMethodOption {
    id: string;
    label: string;
}

type Props = {
    passwordRules: string;
    paises?: PaisOption[];
    planes?: PlanOption[];
    paymentMethods?: PaymentMethodOption[];
};

export default function Register({
    passwordRules,
    paises = [],
    planes = [],
    paymentMethods = [{ id: 'transferencia', label: 'Transferencia / SPEI' }],
}: Props) {
    const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
    const [stepError, setStepError] = useState<string>('');
    const [representanteLegal, setRepresentanteLegal] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [nombreComercial, setNombreComercial] = useState('');
    const [paisId, setPaisId] = useState<string | number>(paises[0]?.id ?? '');
    const [companyPhone, setCompanyPhone] = useState('');

    const [selectedPlanId, setSelectedPlanId] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlPlanId = Number(params.get('plan_id'));
            if (urlPlanId && planes.some((p) => p.id === urlPlanId)) {
                return urlPlanId;
            }
            try {
                const raw = window.localStorage.getItem('fixsale_cart_plan');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed?.id && planes.some((p) => p.id === Number(parsed.id))) {
                        return Number(parsed.id);
                    }
                }
            } catch {
                // ignore
            }
        }
        return planes[0]?.id ?? 0;
    });
    const [paymentMethod, setPaymentMethod] = useState<string>(paymentMethods[0]?.id ?? 'transferencia');

    const selectedPlan = planes.find((p) => p.id === selectedPlanId) ?? planes[0] ?? null;
    const isFreePlan =
        !selectedPlan ||
        Number(selectedPlan.ciclo_meses) === 0 ||
        (selectedPlan.nombre || '').toLowerCase().includes('prueba') ||
        (Number(selectedPlan.precio_regular_mensual ?? 0) === 0 && Number(selectedPlan.precio_12_meses ?? 0) === 0);
    const isAnnualPlan = Number(selectedPlan?.ciclo_meses) === 12;
    const planPrice = isFreePlan
        ? 0
        : isAnnualPlan
            ? Number(selectedPlan?.precio_12_meses || 1000)
            : Number(selectedPlan?.precio_promocional_mensual || selectedPlan?.precio_regular_mensual || 149);

    useEffect(() => {
        if (selectedPlan && typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(
                    'fixsale_cart_plan',
                    JSON.stringify({
                        id: selectedPlan.id,
                        nombre: selectedPlan.nombre,
                        ciclo_meses: Number(selectedPlan.ciclo_meses ?? (isAnnualPlan ? 12 : isFreePlan ? 0 : 1)),
                        precio: planPrice,
                        descripcion: selectedPlan.descripcion || '',
                    }),
                );
            } catch {
                // ignore
            }
        }
    }, [selectedPlan, isAnnualPlan, isFreePlan, planPrice]);

    const goToStep = (target: 1 | 2 | 3) => {
        setStepError('');
        if (target > 1) {
            if (!representanteLegal.trim() || !email.trim() || !password || !passwordConfirmation) {
                setStepError('Completa tu nombre, correo y contraseña para continuar.');
                setActiveStep(1);
                return;
            }
            if (password !== passwordConfirmation) {
                setStepError('Las contraseñas no coinciden.');
                setActiveStep(1);
                return;
            }
        }
        if (target > 2) {
            if (!companyName.trim()) {
                setStepError('Ingresa el nombre de tu empresa o taller para continuar.');
                setActiveStep(2);
                return;
            }
        }
        setActiveStep(target);
    };

    const stepsMeta = [
        { step: 1 as const, title: '1. Datos del Usuario', subtitle: 'Cuenta de acceso administrador', icon: User },
        { step: 2 as const, title: '2. Datos de Contacto y Negocio', subtitle: 'Empresa, país y WhatsApp para código OTP', icon: Building2 },
        { step: 3 as const, title: '3. Selección de Plan y Pago', subtitle: 'Confirma tu plan y método de pago', icon: CreditCard },
    ];

    return (
        <>
            <Head title="Checkout | FixSale" />

            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pt-20 pb-16">
                {/* Navbar igual al de la página principal */}
                <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/image/logo/5.png"
                                alt="FixSale Logo"
                                className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/#pricing"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver a Planes
                            </Link>
                            <Link
                                href="/login"
                                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#08264e] transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                    <div className="mb-10">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                            <Lock className="w-3.5 h-3.5" />
                            Checkout Seguro · FixSale
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#08264e] mt-3 tracking-tight">
                            Finaliza tu registro y activa tu cuenta
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                            Completa los 3 pasos para verificar tu WhatsApp y vincular tu sucursal.
                        </p>
                    </div>

                    <Form
                        action={store()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        noValidate
                    >
                        {({ processing, errors }) => {
                            const step1HasError = Boolean(errors.representante_legal || errors.email || errors.password || errors.password_confirmation);
                            const step2HasError = Boolean(errors.company_name || errors.nombre_comercial || errors.pais_id || errors.company_phone);
                            const step3HasError = Boolean(errors.plan_id || errors.payment_method);

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                                    <input type="hidden" name="pais_id" value={paisId} />
                                    <input type="hidden" name="company_phone" value={companyPhone} />
                                    <input type="hidden" name="plan_id" value={selectedPlan?.id ?? ''} />
                                    <input type="hidden" name="payment_method" value={isFreePlan ? 'free_trial' : paymentMethod} />

                                    {/* Columna Izquierda: Wizard Vertical */}
                                    <div className="lg:col-span-7 space-y-5">
                                        {stepError && (
                                            <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-700">
                                                {stepError}
                                            </div>
                                        )}

                                        {stepsMeta.map(({ step, title, subtitle, icon: Icon }) => {
                                            const isOpen =
                                                activeStep === step ||
                                                (step === 1 && step1HasError) ||
                                                (step === 2 && step2HasError) ||
                                                (step === 3 && step3HasError);
                                            const isCompleted = activeStep > step;

                                            return (
                                                <div
                                                    key={step}
                                                    className={`rounded-2xl border bg-white transition-all ${
                                                        isOpen
                                                            ? 'border-[#ff5a00] shadow-lg'
                                                            : 'border-slate-200 shadow-sm'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => goToStep(step)}
                                                        className="w-full flex items-center justify-between gap-3 p-5 text-left"
                                                    >
                                                        <div className="flex items-center gap-3.5">
                                                            <div
                                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                                                                    isCompleted
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : isOpen
                                                                            ? 'bg-[#ff5a00] text-white'
                                                                            : 'bg-slate-100 text-slate-500'
                                                                }`}
                                                            >
                                                                {isCompleted ? <Check className="w-4 h-4" /> : step}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm sm:text-base font-extrabold text-[#08264e] flex items-center gap-2">
                                                                    <Icon className="w-4 h-4 text-slate-500" />
                                                                    {title}
                                                                </p>
                                                                <p className="text-xs text-slate-500">{subtitle}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-[#ff5a00]">
                                                            {isOpen ? 'Editando' : 'Editar'}
                                                        </span>
                                                    </button>

                                                    {/* Paso 1: Datos del Usuario */}
                                                    <div className={step === 1 && isOpen ? 'px-5 pb-6 pt-2 space-y-4 border-t border-slate-100' : 'hidden'}>
                                                        <div className="grid gap-1.5 pt-2">
                                                            <Label htmlFor="representante_legal" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                Nombre Completo *
                                                            </Label>
                                                            <Input
                                                                id="representante_legal"
                                                                name="representante_legal"
                                                                type="text"
                                                                value={representanteLegal}
                                                                onChange={(e) => setRepresentanteLegal(e.target.value)}
                                                                placeholder="Ej: Juan Pérez"
                                                                className="h-10 bg-white"
                                                            />
                                                            <InputError message={errors.representante_legal} />
                                                        </div>

                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                Correo Electrónico *
                                                            </Label>
                                                            <Input
                                                                id="email"
                                                                name="email"
                                                                type="email"
                                                                value={email}
                                                                onChange={(e) => setEmail(e.target.value)}
                                                                autoComplete="email"
                                                                placeholder="contacto@empresa.com"
                                                                className="h-10 bg-white"
                                                            />
                                                            <InputError message={errors.email} />
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                    Contraseña *
                                                                </Label>
                                                                <PasswordInput
                                                                    id="password"
                                                                    name="password"
                                                                    value={password}
                                                                    onChange={(e) => setPassword(e.target.value)}
                                                                    autoComplete="new-password"
                                                                    placeholder="Contraseña"
                                                                    passwordrules={passwordRules}
                                                                />
                                                                <InputError message={errors.password} />
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="password_confirmation" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                    Confirmar Contraseña *
                                                                </Label>
                                                                <PasswordInput
                                                                    id="password_confirmation"
                                                                    name="password_confirmation"
                                                                    value={passwordConfirmation}
                                                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                                                    autoComplete="new-password"
                                                                    placeholder="Repita contraseña"
                                                                    passwordrules={passwordRules}
                                                                />
                                                                <InputError message={errors.password_confirmation} />
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end pt-2">
                                                            <Button
                                                                type="button"
                                                                onClick={() => goToStep(2)}
                                                                className="bg-[#08264e] hover:bg-[#061e3d] text-white font-bold"
                                                            >
                                                                Continuar a Datos de Contacto
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Paso 2: Datos de Contacto */}
                                                    <div className={step === 2 && isOpen ? 'px-5 pb-6 pt-2 space-y-4 border-t border-slate-100' : 'hidden'}>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="company_name" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                    Nombre de la Empresa / Taller *
                                                                </Label>
                                                                <Input
                                                                    id="company_name"
                                                                    name="company_name"
                                                                    type="text"
                                                                    value={companyName}
                                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                                    placeholder="Ej: FixSale Centro S.A."
                                                                    className="h-10 bg-white"
                                                                />
                                                                <InputError message={errors.company_name} />
                                                            </div>

                                                            <div className="grid gap-1.5">
                                                                <Label htmlFor="nombre_comercial" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                    Nombre Comercial (Opcional)
                                                                </Label>
                                                                <Input
                                                                    id="nombre_comercial"
                                                                    name="nombre_comercial"
                                                                    type="text"
                                                                    value={nombreComercial}
                                                                    onChange={(e) => setNombreComercial(e.target.value)}
                                                                    placeholder="Ej: FixSale Centro"
                                                                    className="h-10 bg-white"
                                                                />
                                                                <InputError message={errors.nombre_comercial} />
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor="pais_id_select" className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                País *
                                                            </Label>
                                                            <Select value={String(paisId)} onValueChange={(val) => setPaisId(val)}>
                                                                <SelectTrigger id="pais_id_select" className="h-10 bg-white">
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

                                                        <div className="grid gap-1.5">
                                                            <Label className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                WhatsApp de Contacto (Para código de verificación OTP) *
                                                            </Label>
                                                            <PhoneInputGroup
                                                                paises={paises}
                                                                selectedPaisId={paisId}
                                                                phoneValue={companyPhone}
                                                                onPaisChange={(pid) => setPaisId(pid)}
                                                                onPhoneChange={(num) => setCompanyPhone(num)}
                                                                placeholder="Ej: 5512345678"
                                                                error={errors.company_phone}
                                                            />
                                                        </div>

                                                        <div className="flex justify-between pt-2">
                                                            <Button type="button" variant="outline" onClick={() => goToStep(1)}>
                                                                Atrás
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() => goToStep(3)}
                                                                className="bg-[#08264e] hover:bg-[#061e3d] text-white font-bold"
                                                            >
                                                                Continuar al Plan y Pago
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Paso 3: Selección de Plan y Pago */}
                                                    <div className={step === 3 && isOpen ? 'px-5 pb-6 pt-2 space-y-4 border-t border-slate-100' : 'hidden'}>
                                                        <div className="space-y-2.5 pt-2">
                                                            <Label className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                Selecciona o confirma tu Plan
                                                            </Label>
                                                            <div className="grid gap-2.5">
                                                                {planes.map((plan) => {
                                                                    const soldOut = plan.cupos_restantes !== null && plan.cupos_restantes !== undefined && plan.cupos_restantes <= 0;
                                                                    const annual = Number(plan.ciclo_meses) === 12;
                                                                    const free = Number(plan.ciclo_meses) === 0 || (plan.nombre || '').toLowerCase().includes('prueba');
                                                                    const price = free
                                                                        ? 0
                                                                        : annual
                                                                            ? Number(plan.precio_12_meses || 1000)
                                                                            : Number(plan.precio_promocional_mensual || plan.precio_regular_mensual || 149);
                                                                    const isSelected = selectedPlan?.id === plan.id;

                                                                    return (
                                                                        <button
                                                                            key={plan.id}
                                                                            type="button"
                                                                            disabled={soldOut}
                                                                            onClick={() => setSelectedPlanId(plan.id)}
                                                                            className={`w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between gap-3 ${
                                                                                soldOut
                                                                                    ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                                                                    : isSelected
                                                                                        ? 'border-[#ff5a00] bg-orange-50/70 ring-1 ring-[#ff5a00]'
                                                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                                            }`}
                                                                        >
                                                                            <div>
                                                                                <p className="text-sm font-extrabold text-[#08264e] flex items-center gap-2">
                                                                                    {plan.nombre}
                                                                                    {plan.cupos_restantes !== null && plan.cupos_restantes !== undefined && (
                                                                                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 bg-amber-50">
                                                                                            {soldOut ? 'Agotado' : `Solo ${plan.cupos_restantes} lugares`}
                                                                                        </Badge>
                                                                                    )}
                                                                                </p>
                                                                                {plan.descripcion && (
                                                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                                                        {plan.descripcion}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-sm font-black font-mono text-[#08264e] shrink-0">
                                                                                {free ? '$0 MXN' : `$${price.toLocaleString('es-MX')} MXN/${annual ? 'año' : 'mes'}`}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <InputError message={errors.plan_id} />
                                                        </div>

                                                        {isFreePlan ? (
                                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
                                                                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span>
                                                                    <strong>Plan Prueba ($0 MXN):</strong> No se te cobrará nada hoy. Verificaremos tu número por WhatsApp y enseguida podrás escanear tu código QR para vincular tu sucursal.
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2.5">
                                                                <Label className="text-xs sm:text-sm font-semibold text-slate-700">
                                                                    Método de Pago Activo
                                                                </Label>
                                                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                                                    <SelectTrigger className="h-10 bg-white">
                                                                        <SelectValue placeholder="Selecciona método de pago" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {paymentMethods.map((m) => (
                                                                            <SelectItem key={m.id} value={m.id}>
                                                                                {m.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-[#ff5a00] shrink-0 mt-0.5" />
                                                                    <span>
                                                                        Primero verificarás tu WhatsApp por OTP y luego completarás el pago con <strong>{paymentMethods.find((m) => m.id === paymentMethod)?.label || paymentMethod}</strong> para activar tu cuenta y escanear tu código QR.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between gap-3 pt-2">
                                                            <Button type="button" variant="outline" onClick={() => goToStep(2)}>
                                                                Atrás
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                className="h-11 px-6 font-extrabold bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
                                                                disabled={processing}
                                                                data-test="register-user-button"
                                                            >
                                                                {processing && <Spinner className="mr-2" />}
                                                                {isFreePlan ? 'Crear Cuenta y Verificar WhatsApp' : 'Continuar al Pago'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="text-center text-sm text-slate-600 pt-2">
                                            ¿Ya tienes una cuenta?{' '}
                                            <TextLink href={login()} className="font-bold text-[#08264e]">
                                                Iniciar sesión
                                            </TextLink>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Resumen del Carrito */}
                                    <aside className="lg:col-span-5 lg:sticky lg:top-28">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-md space-y-6">
                                            <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
                                                <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5a00] flex items-center justify-center shrink-0">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                        Resumen de Compra
                                                    </p>
                                                    <h2 className="text-lg font-black text-[#08264e] truncate">
                                                        {selectedPlan?.nombre || 'Selecciona un Plan'}
                                                    </h2>
                                                </div>
                                            </div>

                                            <div className="space-y-3.5 text-sm text-slate-600">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span>Plan seleccionado</span>
                                                    <span className="font-bold text-[#08264e] whitespace-nowrap">{selectedPlan?.nombre || '—'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span>Mensajes WhatsApp incluidos</span>
                                                    <span className="font-bold text-emerald-600 whitespace-nowrap">500 / mes (tope 1,000)</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-lg font-black text-[#08264e]">
                                                    <span>Total hoy</span>
                                                    <span className="font-mono text-[#ff5a00] whitespace-nowrap">
                                                        {isFreePlan ? '$0 MXN' : `$${planPrice.toLocaleString('es-MX')} MXN`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                <div className="flex items-center gap-2 font-bold text-[#08264e]">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Flujo de activación seguro</span>
                                                </div>
                                                <p>1. Verificación rápida de tu WhatsApp por OTP.</p>
                                                <p>2. Vinculación de tu sucursal escaneando tu código QR.</p>
                                            </div>
                                        </div>
                                    </aside>
                                </div>
                            );
                        }}
                    </Form>
                </main>
            </div>
        </>
    );
}

Register.layout = (page: ReactNode) => page;
