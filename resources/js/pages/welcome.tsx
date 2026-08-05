import { Head, Link, usePage } from '@inertiajs/react';
import {
    Zap,
    Smartphone,
    ShieldCheck,
    Coins,
    Package,
    Wallet,
    CheckCircle2,
    ArrowRight,
    ChevronRight,
    Sparkles,
    Laptop,
    ChevronDown,
    Check,
    Lock,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import BackgroundParticles from '@/components/background-particles';

export default function Welcome() {
    const pageProps = usePage().props as any;
    const auth = pageProps.auth || {};
    const { __ } = useTranslate();

    // Detección dinámica de país (Venezuela vs Internacional)
    const isVenezuela = Boolean(pageProps.isVenezuela);
    const countryCode = pageProps.countryCode || 'MX';
    const currencySymbol = pageProps.currencySymbol || '$';
    const currencyCode = pageProps.currencyCode || 'MXN';

    const [activeFaq, setActiveFaq] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <>
            <Head title={__('FixSale | Punto de Venta, Inventario y Automatización WhatsApp')} />

            <div className="relative min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-orange-500 selection:text-white antialiased overflow-x-hidden">
                {/* ─── CANVASES & PARTICLES DECORATION ──────────────────────────────────── */}
                <BackgroundParticles particleCount={40} colorScheme="brand" />

                {/* ─── SOFT BACKGROUND DECORATIONS (LIGHT MODE) ────────────────────────────── */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-orange-500/5 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
                <div className="fixed top-1/3 left-0 w-96 h-96 bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />
                <div className="fixed bottom-10 right-0 w-96 h-96 bg-orange-500/5 blur-[120px] pointer-events-none -z-10" />

                {/* ─── HEADER / NAVBAR ────────────────────────────────────────────────────── */}
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-sm transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                        {/* Logo Horizontal Completo FixSale (Light Mode) */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/image/logo/5.png"
                                alt="FixSale Logo"
                                className="h-12 sm:h-14 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                        </Link>

                        {/* Menú Nav Desktop */}
                        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
                            <a href="#pos" className="hover:text-[#ff5a00] transition-colors">
                                {__('Punto de Venta')}
                            </a>
                            <a href="#whatsapp" className="hover:text-[#ff5a00] transition-colors">
                                {__('WhatsApp Engine')}
                            </a>
                            <a href="#features" className="hover:text-[#ff5a00] transition-colors">
                                {__('Características')}
                            </a>
                            <a href="#pricing" className="hover:text-[#ff5a00] transition-colors">
                                {__('Planes')}
                            </a>
                            <a href="#faq" className="hover:text-[#ff5a00] transition-colors">
                                {__('FAQ')}
                            </a>
                        </nav>

                        {/* Acciones de Auth */}
                        <div className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href="/admin/dashboard"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#08264e] hover:bg-[#061e3d] text-white font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <Laptop className="w-4 h-4" />
                                    {__('Ir al Dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#08264e] transition-colors"
                                    >
                                        {__('Iniciar Sesión')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 active:scale-95"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {__('Probar 7 Días Gratis')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ─── HERO SECTION ───────────────────────────────────────────────────────── */}
                <section className="relative pt-12 pb-16 md:pt-20 md:pb-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
                        {/* Badge dinámico por País */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-bold text-[#ff5a00] shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-[#ff5a00]" />
                            <span>
                                {isVenezuela
                                    ? __('Novedad: Sincronización Tasa Oficial BCV & WhatsApp Engine')
                                    : __('Novedad: Punto de Venta Ultrarrápido & WhatsApp Engine Integrado')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </div>

                        {/* Titular Principal H1 */}
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#08264e] tracking-tight max-w-5xl mx-auto leading-[1.15]">
                            {__('El Punto de Venta e Inventario')} <br />
                            <span className="bg-gradient-to-r from-[#ff5a00] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                {__('que Hace Crecer tu Negocio')}
                            </span>
                        </h1>

                        {/* Subtítulo */}
                        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
                            {__('Procesa ventas en segundos con atajos de teclado, automatiza envíos de credenciales y recibos por WhatsApp, controla cajas con cero descuadres y gestiona tus divisas en tiempo real.')}
                        </p>

                        {/* Botones CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <span>{__('Comenzar Prueba Gratuita (7 Días)')}</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="#pos"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-[#08264e] font-bold text-base shadow-sm transition-all hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 text-[#ff5a00]" />
                                <span>{__('Ver Características')}</span>
                            </a>
                        </div>

                        {/* Garantía */}
                        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-500 pt-2">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Sin tarjeta de crédito')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Configuración en 2 minutos')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {__('Soporte incluido')}
                            </span>
                        </div>

                        {/* MOCKUP INTERACTIVO SIMULADO DEL POS & DASHBOARD (LIGHT MODE) */}
                        <div id="pos" className="pt-8 max-w-6xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#08264e] to-[#ff5a00] rounded-3xl blur-2xl opacity-15 group-hover:opacity-25 transition-opacity" />
                            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xl text-left space-y-6">
                                {/* Barra superior de ventana simulada */}
                                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-mono text-slate-500 ml-2">
                                            fixsale.app / admin / terminal
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium">
                                        {/* Estado WhatsApp Engine */}
                                        <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-700 font-bold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            WhatsApp Active
                                        </span>

                                        {/* Tasa BCV o Multimoneda */}
                                        <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-mono font-bold border border-slate-200">
                                            {isVenezuela ? '💵 Tasa BCV: 36.45 Bs' : `💵 Divisa: ${currencyCode} (${currencySymbol})`}
                                        </span>
                                    </div>
                                </div>

                                {/* Contenido Mockup POS (Light Theme) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Panel Izquierdo: Resumen de Ventas / Dashboard */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                                                <span className="text-xs text-slate-500 uppercase font-mono font-bold">{__('Ventas del Día')}</span>
                                                <p className="text-xl font-black font-mono text-[#ff5a00]">{currencySymbol}1,480.00</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                                                <span className="text-xs text-slate-500 uppercase font-mono font-bold">{__('Caja Abierta')}</span>
                                                <p className="text-xl font-black font-mono text-[#08264e]">Turno #104</p>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                                                <span className="text-xs text-slate-500 uppercase font-mono font-bold">{__('WhatsApp OTP')}</span>
                                                <p className="text-xl font-black font-mono text-emerald-600">Active ✅</p>
                                            </div>
                                        </div>

                                        {/* Simulación Tabla POS */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 border-b border-slate-200 pb-2">
                                                <span>{__('PRODUCTO / SERVICIO')}</span>
                                                <span>{__('CANT')}</span>
                                                <span>{__('SUBTOTAL')}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-1">
                                                <span className="font-medium text-slate-800">Mantenimiento de Servidor / Equipo</span>
                                                <span className="font-mono text-slate-500">1</span>
                                                <span className="font-mono font-bold text-[#08264e]">{currencySymbol}450.00</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-1 border-t border-slate-200">
                                                <span className="font-medium text-slate-800">Cable de Red Cat6 & Conectores</span>
                                                <span className="font-mono text-slate-500">5</span>
                                                <span className="font-mono font-bold text-[#08264e]">{currencySymbol}75.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Panel Derecho: Teclas Rápidas */}
                                    <div className="bg-[#08264e] text-white p-4 rounded-xl space-y-3 flex flex-col justify-between shadow-lg">
                                        <div>
                                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-3 font-mono">
                                                {__('Atajos de Teclado Rápido')}
                                            </span>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between p-2 rounded bg-[#0b3368] border border-blue-900">
                                                    <span className="font-mono font-bold text-emerald-400">F11 / F12</span>
                                                    <span className="text-slate-200">{__('Cobrar e Imprimir')}</span>
                                                </div>
                                                <div className="flex justify-between p-2 rounded bg-[#0b3368] border border-blue-900">
                                                    <span className="font-mono font-bold text-orange-400">F10</span>
                                                    <span className="text-slate-200">{__('Búsqueda Predictiva')}</span>
                                                </div>
                                                <div className="flex justify-between p-2 rounded bg-[#0b3368] border border-blue-900">
                                                    <span className="font-mono font-bold text-rose-400">F8</span>
                                                    <span className="text-slate-200">{__('Arqueo / Corte Z')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <div className="bg-orange-500/20 border border-orange-400/40 p-3 rounded-lg text-center">
                                                <span className="text-xs text-orange-300 font-bold block">
                                                    ⚡ {__('Ventas sin pausas ni clics de más')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── BANNER DE STATS Y PERFORMANCE ────────────────────────────────────── */}
                <section className="py-12 border-y border-slate-200 bg-white shadow-inner">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#ff5a00] font-mono">3x</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Más veloz en caja registradora')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#08264e] font-mono">100%</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Control de arqueo por usuario')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">WhatsApp</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Notificaciones & credenciales automáticas')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-3xl sm:text-4xl font-black text-[#ff5a00] font-mono">7 {__('Días')}</span>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                                    {__('Prueba gratuita completa')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN DE CARACTERÍSTICAS PRINCIPALES ─────────────────────────────── */}
                <section id="features" className="py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                                {__('Módulos Potentes')}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#08264e] tracking-tight">
                                {__('Diseñado para resolver los desafíos reales de tu negocio')}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg">
                                {__('Cada herramienta está optimizada para acelerar las operaciones diarias, evitar descuidos de dinero y conectar a tu equipo.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Card 1: POS */}
                            <div className="bg-white border border-slate-200 hover:border-orange-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5a00] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Punto de Venta Eleventa / POS')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Ventas ágiles con teclado físico (F4-F12), escáner predictivo, artículos varios e impresión directa en ticketera térmica.')}
                                </p>
                            </div>

                            {/* Card 2: WhatsApp */}
                            <div id="whatsapp" className="bg-white border border-slate-200 hover:border-emerald-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('WhatsApp Engine Integrado')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Envío automático de mensajes de bienvenida con credenciales claras (Email, Usuario, Password) y comprobantes de compra.')}
                                </p>
                            </div>

                            {/* Card 3: Arqueo de Caja */}
                            <div className="bg-white border border-slate-200 hover:border-blue-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#08264e] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Arqueo Estricto por Aperturador')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Seguridad financiera garantizada: Únicamente el usuario que realiza la apertura de caja puede efectuar el Cierre Z del turno.')}
                                </p>
                            </div>

                            {/* Card 4: Multimoneda / BCV */}
                            <div className="bg-white border border-slate-200 hover:border-amber-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">
                                    {isVenezuela ? __('Tasa Oficial BCV & Divisas') : __('Multimoneda & Conversión Dinámica')}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {isVenezuela
                                        ? __('Consulta y actualización automática de la tasa oficial del Banco Central de Venezuela (BCV) en dólares y bolívares.')
                                        : __('Gestión de múltiples monedas y tipo de cambio configurable en tiempo real para cotizar y cobrar sin errores.')}
                                </p>
                            </div>

                            {/* Card 5: Inventario */}
                            <div className="bg-white border border-slate-200 hover:border-orange-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-[#ff5a00] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Inventario & Alertas de Stock')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Control de existencias mínimas, compras a proveedores, categorías, marcas y servicios de reparación.')}
                                </p>
                            </div>

                            {/* Card 6: Ventas a Crédito */}
                            <div className="bg-white border border-slate-200 hover:border-emerald-400 p-8 rounded-2xl space-y-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[#08264e]">{__('Ventas a Crédito y Cobranza')}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    {__('Gestión de límites de crédito por cliente, registro de abonos y cuentas por cobrar con impacto directo en caja.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SIMULADOR INTERACTIVO DE WHATSAPP ─────────────────────────────────── */}
                <section className="py-20 bg-white border-y border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Texto Explicativo */}
                            <div className="space-y-6 text-left">
                                <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                                    {__('Comunicación Automática')}
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#08264e] tracking-tight leading-tight">
                                    {__('Tus usuarios y clientes informados al instante por WhatsApp')}
                                </h2>
                                <p className="text-slate-600 text-base leading-relaxed">
                                    {__('Al crear un nuevo usuario desde el panel de administración, el sistema envía un mensaje de bienvenida limpio, profesional y formateado con sus credenciales de acceso.')}
                                </p>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Formateo de teléfono automático con código internacional de país.')}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Envío de usuario, correo, contraseña y enlace directo de login.')}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{__('Verificación OTP de 8 dígitos para inicio de sesión seguro.')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Simulación Teléfono Móvil WhatsApp */}
                            <div className="flex justify-center">
                                <div className="w-full max-w-sm bg-slate-900 border-8 border-slate-800 rounded-[40px] shadow-2xl p-3 overflow-hidden relative font-sans text-left">
                                    {/* Muesca del teléfono */}
                                    <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-3" />

                                    {/* Header WhatsApp Chat */}
                                    <div className="bg-emerald-700 text-white p-3 rounded-t-2xl flex items-center gap-3 shadow">
                                        <img
                                            src="/image/logo/2.png"
                                            alt="Isotipo FixSale"
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white bg-white"
                                        />
                                        <div>
                                            <p className="font-bold text-sm">FixSale POS System</p>
                                            <p className="text-[10px] text-emerald-200 font-mono">WhatsApp Verified Account</p>
                                        </div>
                                    </div>

                                    {/* Burbuja de Mensaje WhatsApp */}
                                    <div className="bg-[#e5ddd5] p-4 rounded-b-2xl space-y-3">
                                        <div className="bg-white text-slate-800 p-3.5 rounded-2xl rounded-tl-none text-xs space-y-2 font-mono shadow-sm">
                                            <p className="font-bold text-emerald-700">🌟 ¡Bienvenido(a) a FixSale! 🌟</p>
                                            <p>Hola <span className="font-bold text-slate-900">Juan Pérez</span>, nos alegra darte la bienvenida a nuestra plataforma.</p>
                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                                                <p>🔑 <span className="font-bold text-[#08264e]">Credenciales de Acceso:</span></p>
                                                <p>👤 Nombre: Juan Pérez</p>
                                                <p>📧 Correo: jperez@empresa.com</p>
                                                <p>🏷️ Usuario: jperez</p>
                                                <p>🔒 Contraseña: ********</p>
                                                <p>🏢 Empresa: Demo Store S.A.</p>
                                            </div>
                                            <p className="text-emerald-700 underline font-bold">🌐 http://fixsale.app/login</p>
                                            <span className="text-[9px] text-slate-400 text-right block pt-1">10:45 AM ✓✓</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── SECCIÓN DE PRECIOS & PRUEBA DE 7 DÍAS ─────────────────────────────── */}
                <section id="pricing" className="py-20 md:py-28">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="text-xs font-bold font-mono uppercase tracking-widest text-[#ff5a00] bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full">
                                {__('Comienza Hoy')}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#08264e] tracking-tight">
                                {__('Prueba 7 días gratis sin compromisos')}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg">
                                {__('Prueba todas las funcionalidades del sistema en tu negocio. Acceso inmediato sin tarjeta de crédito.')}
                            </p>
                        </div>

                        <div className="max-w-md mx-auto relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#ff5a00] to-amber-500 rounded-3xl blur-xl opacity-20" />
                            <div className="relative bg-white border-2 border-[#ff5a00]/40 p-8 rounded-3xl space-y-6 text-center shadow-xl">
                                <span className="inline-block px-4 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ff5a00] text-xs font-bold font-mono uppercase">
                                    {__('Prueba Gratuita')}
                                </span>

                                <div>
                                    <span className="text-5xl font-black text-[#08264e] font-mono">7 {__('Días')}</span>
                                    <p className="text-sm text-slate-500 mt-1 font-medium">{__('Acceso Total Ilimitado')}</p>
                                </div>

                                <ul className="space-y-3 text-sm text-slate-700 text-left border-t border-slate-200 pt-6 font-medium">
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{__('Punto de venta POS con atajos rápidos')}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{__('WhatsApp Engine con envío de credenciales')}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{__('Control de cajas y cierres protegidos')}</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>
                                            {isVenezuela
                                                ? __('Sincronización oficial Tasa BCV')
                                                : __('Multimoneda & tipos de cambio')}
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{__('Inventarios, compras y ventas a crédito')}</span>
                                    </li>
                                </ul>

                                <Link
                                    href="/register"
                                    className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-[#ff5a00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                                >
                                    <span>{__('Crear Cuenta Gratis')}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── PREGUNTAS FRECUENTES (FAQ) ────────────────────────────────────────── */}
                <section id="faq" className="py-20 border-t border-slate-200 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black text-[#08264e]">{__('Preguntas Frecuentes')}</h2>
                            <p className="text-slate-600 text-sm font-medium">{__('Respuestas a las dudas más comunes sobre la plataforma')}</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                {
                                    q: __('¿Cómo funciona la prueba gratuita de 7 días?'),
                                    a: __('Al registrarte obtienes acceso inmediato e ilimitado a todos los módulos del sistema durante 7 días continuos. No requieres ingresar tarjeta de crédito.'),
                                },
                                {
                                    q: __('¿Solo el usuario que abre la caja puede realizar el cierre?'),
                                    a: __('Sí. Por políticas de control y seguridad financiera, únicamente el usuario que realiza la apertura de la caja tiene los permisos para efectuar el Cierre Z de su turno.'),
                                },
                                {
                                    q: isVenezuela
                                        ? __('¿Cómo se consulta la Tasa Oficial del BCV?')
                                        : __('¿Cómo funciona la conversión de monedas?'),
                                    a: isVenezuela
                                        ? __('El sistema consulta en tiempo real la tasa oficial publicada por el Banco Central de Venezuela (BCV), permitiéndote cotizar y cobrar automáticamente en dólares y bolívares.')
                                        : __('Puedes configurar la moneda principal de tu país y utilizar tipos de cambio personalizados en tiempo real.'),
                                },
                                {
                                    q: __('¿Cómo se envían los mensajes por WhatsApp?'),
                                    a: __('El sistema incluye un motor de WhatsApp integrado que puedes conectar escaneando un código QR. Permite enviar credenciales de acceso a nuevos usuarios y comprobantes de compra.'),
                                },
                            ].map((faq, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-[#08264e] hover:text-[#ff5a00] transition-colors"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${activeFaq === idx ? 'rotate-180 text-[#ff5a00]' : ''}`} />
                                    </button>
                                    {activeFaq === idx && (
                                        <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FOOTER ────────────────────────────────────────────────────────────── */}
                <footer className="border-t border-slate-200 py-12 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-3">
                            <img
                                src="/image/logo/5.png"
                                alt="FixSale Logo"
                                className="h-9 w-auto object-contain"
                            />
                            <span>© {new Date().getFullYear()} FixSale POS. All rights reserved.</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link href="/login" className="hover:text-[#ff5a00] transition-colors font-bold">
                                {__('Iniciar Sesión')}
                            </Link>
                            <Link href="/register" className="hover:text-[#ff5a00] transition-colors font-bold">
                                {__('Registrarse')}
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
