import React, { useState } from 'react';
import { CreditCard, RefreshCw, ExternalLink, ShieldCheck, Clock, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';

export interface StripeBalanceData {
    connected: boolean;
    livemode: boolean;
    currency: string;
    usd_rate: number;
    available_mxn: number;
    pending_mxn: number;
    total_mxn: number;
    available_usd: number;
    pending_usd: number;
    total_usd: number;
    gross_mxn?: number;
    fee_mxn?: number;
    gross_usd?: number;
    fee_usd?: number;
    last_updated?: string;
    error?: string;
}

interface StripeBalanceCardProps {
    initialData?: StripeBalanceData | null;
    className?: string;
    variant?: 'compact' | 'full';
}

export function StripeBalanceCard({ initialData, className = '', variant = 'compact' }: StripeBalanceCardProps) {
    const { __ } = useTranslate();
    const [balance, setBalance] = useState<StripeBalanceData | null>(initialData || null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsRefreshing(true);
        try {
            const res = await fetch('/admin/superadministrador/stripe-balance/refresh', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) {
                throw new Error('No se pudo actualizar el balance de Stripe');
            }
            const data: StripeBalanceData = await res.json();
            setBalance(data);
            notifySuccess(__('Balance de Stripe sincronizado en tiempo real.'));
        } catch (e: any) {
            notifyError(e.message || __('Error al consultar Stripe.'));
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatCurrency = (val?: number, cur: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: cur,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val || 0);
    };

    // VISTA COMPACTA (Reemplazo de tarjeta de KPI en la cuadrícula de 4 columnas)
    if (variant === 'compact') {
        if (!balance || !balance.connected) {
            return (
                <Card className={`shadow-sm border border-border hover:shadow-md transition-shadow ${className}`}>
                    <CardContent className="p-5 flex items-start justify-between">
                        <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                                {__('Balance Real Stripe')}
                            </span>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {__('No Conectado')}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">
                                {__('Configura Stripe en integraciones')}
                            </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const gross = balance.gross_mxn ?? balance.total_mxn;
        const fee = balance.fee_mxn ?? 0;

        return (
            <Card className={`shadow-sm border-2 border-indigo-200 dark:border-indigo-900/60 hover:shadow-md transition-all relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/25 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20 ${className}`}>
                {/* Acento superior degradado */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />

                <CardContent className="p-5 space-y-3">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                    <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                                    {__('Balance Real Stripe')}
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {balance.livemode ? 'Live' : 'Test'}
                                </span>
                            </div>

                            {/* Cifra principal neta */}
                            <div className="flex items-baseline gap-2 pt-0.5">
                                <p className="text-2xl sm:text-3xl font-black text-foreground font-mono tracking-tight">
                                    {formatCurrency(balance.total_mxn, 'MXN')}
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-xs font-bold font-mono px-2 py-0">
                                    ≈ {formatCurrency(balance.total_usd, 'USD')}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    (1 USD = ${balance.usd_rate.toFixed(2)})
                                </span>
                            </div>
                        </div>

                        {/* Icono y botón actualizar */}
                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="text-[10px] text-muted-foreground hover:text-indigo-600 flex items-center gap-1 transition-colors font-medium"
                                title={__('Actualizar balance en tiempo real')}
                            >
                                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                                <span>{isRefreshing ? __('...') : __('Actualizar')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Desglose de Facturación Bruta vs Comisión de Pasarela */}
                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-950 text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span>{__('Bruto Facturado:')}</span>
                            <span className="font-mono font-semibold text-foreground">
                                {formatCurrency(gross, 'MXN')}
                            </span>
                        </div>
                        {fee > 0 && (
                            <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                                <span>{__('Comisión Stripe:')}</span>
                                <span className="font-mono font-bold">
                                    -{formatCurrency(fee, 'MXN')} ({((fee / (gross || 1)) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Desglose de Fondos en Cuenta (Disponible vs En Tránsito) */}
                    <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                            <span className="text-muted-foreground block font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {__('Disponible:')}
                            </span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-[11px] block mt-0.5">
                                {formatCurrency(balance.available_mxn, 'MXN')}
                            </span>
                            <span className="text-muted-foreground font-mono text-[9px]">
                                ({formatCurrency(balance.available_usd, 'USD')})
                            </span>
                        </div>
                        <div>
                            <span className="text-muted-foreground block font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {__('Por Liquidar:')}
                            </span>
                            <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-[11px] block mt-0.5">
                                {formatCurrency(balance.pending_mxn, 'MXN')}
                            </span>
                            <span className="text-muted-foreground font-mono text-[9px]">
                                ({formatCurrency(balance.pending_usd, 'USD')})
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // VISTA COMPLETA (Para pantallas con ancho completo)
    if (!balance || !balance.connected) {
        return (
            <Card className={`border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 shadow-sm ${className}`}>
                <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{__('Cuenta de Stripe')}</span>
                                <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-800 text-[10px]">
                                    {__('Pendiente de Configuración')}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {balance?.error || __('Configura las claves de Stripe en Integraciones para consultar el dinero real.')}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-1.5 text-xs h-8"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {__('Verificar Conexión')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const gross = balance.gross_mxn ?? balance.total_mxn;
    const fee = balance.fee_mxn ?? 0;

    return (
        <Card className={`relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/20 shadow-md ${className}`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black tracking-wider uppercase text-indigo-700 dark:text-indigo-300">
                                    {__('Balance Real en Cuenta Stripe')}
                                </span>
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0 h-4 gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    {balance.livemode ? __('Stripe Live') : __('Stripe Test')}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium">
                                {__('Dinero real custodiado por Stripe (Neto tras comisiones)')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5"
                            title={__('Refrescar balance desde Stripe')}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                            <span className="hidden sm:inline text-[11px] font-semibold">{__('Actualizar')}</span>
                        </Button>

                        <a
                            href="https://dashboard.stripe.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-bold rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-900"
                        >
                            <span>Dashboard Stripe</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                <div className="p-4 bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                            {__('Saldo Total Neto en Cuenta')}
                        </span>
                        <div className="flex flex-wrap items-baseline gap-2.5">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                {formatCurrency(balance.total_mxn, 'MXN')}
                            </span>
                            <Badge className="bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-sm font-bold font-mono px-2.5 py-0.5">
                                ≈ {formatCurrency(balance.total_usd, 'USD')}
                            </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{__('Bruto facturado:')} <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(gross, 'MXN')}</strong></span>
                            {fee > 0 && (
                                <span className="text-rose-600 dark:text-rose-400">• {__('Comisión retención:')} <strong className="font-mono">-{formatCurrency(fee, 'MXN')}</strong></span>
                            )}
                        </div>
                    </div>

                    <div className="text-left md:text-right">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                            {__('Tipo de Cambio Referencial:')}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            1 USD = ${balance.usd_rate.toFixed(2)} MXN
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {__('Disponible para Retiro')}
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 py-0 h-4">
                                {__('Liquidado')}
                            </Badge>
                        </div>
                        <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-lg font-black font-mono text-emerald-950 dark:text-emerald-100">
                                {formatCurrency(balance.available_mxn, 'MXN')}
                            </span>
                            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                ({formatCurrency(balance.available_usd, 'USD')})
                            </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            {__('Fondos libres listos para ser transferidos a tu banco.')}
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                {__('En Tránsito / Por Liquidar')}
                            </span>
                            <Badge variant="outline" className="text-[9px] bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 py-0 h-4">
                                {__('En Compensación')}
                            </Badge>
                        </div>
                        <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="text-lg font-black font-mono text-amber-950 dark:text-amber-100">
                                {formatCurrency(balance.pending_mxn, 'MXN')}
                            </span>
                            <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                                ({formatCurrency(balance.pending_usd, 'USD')})
                            </span>
                        </div>
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                            {__('Cobros recientes que se liberarán en los próximos días.')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
