import React from 'react';
import {
    ShieldCheck, Sparkles, MessageSquare, CheckCircle2, QrCode, ArrowRight, Smartphone, Receipt, Lock, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslate } from '@/hooks/use-translate';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    empresaNombre?: string;
}

export function WelcomeWhatsAppModal({ isOpen, onClose, empresaNombre }: Props) {
    const { __ } = useTranslate();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white dark:bg-slate-900">
                {/* ENCABEZADO DE BIENVENIDA CON DEGRADADO EMERALD */}
                <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-2">
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1 font-bold flex items-center gap-1.5 w-fit text-xs backdrop-blur-md">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>{__('Paso 1: Configuración Inicial del Sistema')}</span>
                        </Badge>
                        <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                            <span>{__('¡Bienvenido(a) a FixSale!')}</span>
                        </DialogTitle>
                        <DialogDescription className="text-emerald-100 text-sm font-medium">
                            {__('Le acompañamos paso a paso para poner en marcha el control inteligente de su empresa.')}
                        </DialogDescription>
                    </div>
                </div>

                {/* CUERPO DEL MENSAJE Y GUÍA DE TRUST */}
                <div className="p-6 space-y-5">
                    {/* MENSAJE RESPETUOSO Y COMPLETO */}
                    <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {__('Estimado(a) Administrador(a)')}{empresaNombre ? ` de ${empresaNombre}` : ''}:
                        </p>
                        <p>
                            {__('Queremos agradecerle sinceramente por depositar su confianza en nuestra plataforma. Para garantizar un servicio 100% confiable, automatizado y seguro, el ')}
                            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{__('primer paso fundamental')}</strong>
                            {__(' es la vinculación de su cuenta de WhatsApp.')}
                        </p>
                    </div>

                    {/* BENEFICIOS / POR QUÉ ES VITAL */}
                    <div className="grid sm:grid-cols-3 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit">
                                <Receipt className="w-4 h-4" />
                            </div>
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{__('Tickets Digitales')}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{__('Envío automático de recibos de compra a clientes.')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit">
                                <Lock className="w-4 h-4" />
                            </div>
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{__('Seguridad OTP')}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{__('Entrega instantánea de códigos de verificación.')}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit">
                                <Bell className="w-4 h-4" />
                            </div>
                            <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{__('Notificaciones')}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{__('Alertas en tiempo real de cajas y operaciones.')}</p>
                        </div>
                    </div>

                    {/* GUÍA RÁPIDA DE PASOS DE ESCANEO */}
                    <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{__('Pasos para conectar en 15 segundos:')}</span>
                        </div>
                        <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pl-1">
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold bg-emerald-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                                <span>{__('Abra la aplicación de ')}<strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{__('WhatsApp')}</strong>{__(' en su teléfono móvil.')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold bg-emerald-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                                <span>{__('Ingrese al menú de ')}<strong className="font-semibold">{__('Ajustes / Opciones (⋮)')}</strong> ➔ <strong className="font-semibold">{__('Dispositivos vinculados')}</strong>.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono font-bold bg-emerald-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                                <span>{__('Seleccione ')}<strong className="font-semibold">{__('Vincular un dispositivo')}</strong>{__(' y escanee el código QR que verá en pantalla.')}</span>
                            </li>
                        </ol>
                    </div>
                </div>

                {/* BOTÓN CONTINUAR */}
                <DialogFooter className="p-6 pt-0 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex-col sm:flex-col gap-2">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group"
                    >
                        <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>{__('Continuar e Iniciar Escaneo QR')}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
