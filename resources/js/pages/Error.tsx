import { Head, Link } from '@inertiajs/react';
import { Home, ArrowLeft, RefreshCw, Lock, AlertTriangle, Compass, Server, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';

interface ErrorPageProps {
    status: number;
}

export default function ErrorPage({ status }: ErrorPageProps) {
    const { __ } = useTranslate();
    
    const errorDetails = {
        403: {
            title: '403',
            name: __('Access Denied'),
            description: __('You do not have the required permissions to access this page.'),
            icon: <Lock className="w-16 h-16 text-rose-500" />,
            bgGradient: 'from-rose-500/10 to-orange-500/5',
            borderColor: 'border-rose-500/20'
        },
        404: {
            title: '404',
            name: __('Page Not Found'),
            description: __('The page you are looking for does not exist or has been moved.'),
            icon: <Compass className="w-16 h-16 text-indigo-500" />,
            bgGradient: 'from-indigo-500/10 to-blue-500/5',
            borderColor: 'border-indigo-500/20'
        },
        419: {
            title: '419',
            name: __('Page Expired'),
            description: __('Your session has expired due to inactivity. Please refresh and try again.'),
            icon: <RefreshCw className="w-16 h-16 text-amber-500 animate-spin-slow' }} style={{ animationDuration: '6s' }}" />,
            bgGradient: 'from-amber-500/10 to-yellow-500/5',
            borderColor: 'border-amber-500/20'
        },
        500: {
            title: '500',
            name: __('Server Error'),
            description: __('An unexpected error occurred on our servers. We are already working to fix it.'),
            icon: <Server className="w-16 h-16 text-red-500" />,
            bgGradient: 'from-red-500/10 to-rose-500/5',
            borderColor: 'border-red-500/20'
        },
        503: {
            title: '503',
            name: __('Service Unavailable'),
            description: __('The system is temporarily down for maintenance. Please check back soon.'),
            icon: <AlertTriangle className="w-16 h-16 text-sky-500" />,
            bgGradient: 'from-sky-500/10 to-blue-500/5',
            borderColor: 'border-sky-500/20'
        }
    };

    const details = errorDetails[status as keyof typeof errorDetails] || {
        title: String(status),
        name: __('Unexpected Error'),
        description: __('An unexpected error has occurred.'),
        icon: <ShieldAlert className="w-16 h-16 text-slate-500" />,
        bgGradient: 'from-slate-500/10 to-slate-500/5',
        borderColor: 'border-slate-500/20'
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <>
            <Head title={`${details.title} - ${details.name}`} />

            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
                
                {/* Selector de idioma en la esquina superior derecha */}
                <div className="absolute top-4 right-4 z-50">
                    <LanguageToggle />
                </div>
                
                {/* ── Fondo decorativo abstracto con gradiente y blur ── */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#104a29]/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* ── Contenedor principal del error ── */}
                <div className="w-full max-w-lg text-center relative z-10 space-y-6">
                    
                    {/* Ilustración de Error con efecto glassmorphism */}
                    <div className={`mx-auto w-32 h-32 rounded-3xl bg-gradient-to-br ${details.bgGradient} border ${details.borderColor} flex items-center justify-center shadow-xl backdrop-blur-sm animate-pulse-slow`}>
                        {details.icon}
                    </div>

                    <div className="space-y-2">
                        {/* Código de Estado Grande */}
                        <h1 className="text-7xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent select-none">
                            {details.title}
                        </h1>
                        {/* Nombre del Error */}
                        <h2 className="text-2xl font-bold tracking-tight text-slate-200 uppercase select-none">
                            {details.name}
                        </h2>
                        {/* Descripción Detallada */}
                        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                            {details.description}
                        </p>
                    </div>

                    {/* ── Botones de Acción ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        {status === 419 ? (
                            <Button
                                onClick={handleRefresh}
                                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-lg"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {__('Refresh Page')}
                            </Button>
                        ) : (
                            <Link href="/admin/dashboard" className="w-full sm:w-auto">
                                <Button className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-2 shadow-lg">
                                    <Home className="w-4 h-4" />
                                    {__('Go to Dashboard')}
                                </Button>
                            </Link>
                        )}
                        
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {__('Go Back')}
                        </Button>
                    </div>

                    {/* Subtexto corporativo al pie */}
                    <p className="text-[10px] text-slate-600 select-none uppercase tracking-widest pt-8">
                        Only the Finest Berries™
                    </p>

                </div>
            </div>
        </>
    );
}
