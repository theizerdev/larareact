import React from 'react';
import { Head } from '@inertiajs/react';
import { 
    ShieldCheck, 
    Calendar, 
    Clock, 
    User, 
    Building, 
    Car, 
    CheckCircle2, 
    XCircle, 
    MapPin, 
    QrCode,
    Share2,
    Phone
} from 'lucide-react';

interface PaseDigitalProps {
    invitacion: {
        id: number;
        uuid: string;
        codigo_invitacion: string;
        tipo_acceso: string;
        visitante_nombre: string;
        visitante_documento?: string | null;
        visitante_telefono?: string | null;
        visitante_empresa?: string | null;
        fecha_estimada: string;
        hora_estimada?: string | null;
        medio_acceso: string;
        vehiculo_placa?: string | null;
        vehiculo_marca?: string | null;
        vehiculo_modelo?: string | null;
        motivo_visita?: string | null;
        status: string;
        anfitrion?: {
            id: number;
            nombres: string;
            apellidos: string;
            telefono?: string | null;
        } | null;
        empresa?: {
            razon_social: string;
        } | null;
        sucursal?: {
            nombre: string;
        } | null;
    };
}

export default function PaseDigital({ invitacion }: PaseDigitalProps) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(invitacion.uuid)}&color=104a29&bgcolor=ffffff`;

    const isPending = invitacion.status === 'pendiente';
    const isIngresado = invitacion.status === 'ingresado';

    return (
        <>
            <Head title={`Pase Digital N° ${invitacion.codigo_invitacion} - Driscolls`} />

            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
                {/* Contenedor Principal Pase Digital */}
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 space-y-0">
                    {/* Header Verde Driscolls */}
                    <div className="bg-[#104a29] p-6 text-white text-center relative">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <ShieldCheck className="w-8 h-8 text-emerald-400" />
                            <span className="font-extrabold text-xl tracking-tight">DRISCOLL'S</span>
                        </div>
                        <h1 className="text-sm font-medium text-emerald-100 uppercase tracking-widest">
                            Pase Digital de Acceso
                        </h1>
                        <div className="mt-3 inline-block bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-200 border border-white/20">
                            N° {invitacion.codigo_invitacion}
                        </div>
                    </div>

                    {/* QR Code central */}
                    <div className="p-6 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="relative inline-block p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
                            <img 
                                src={qrUrl} 
                                alt="Código QR de Acceso" 
                                className="w-48 h-48 mx-auto object-contain rounded-lg"
                            />
                            {isIngresado && (
                                <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-2">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1 animate-bounce" />
                                    <span className="font-extrabold text-sm uppercase">¡Ingreso Registrado!</span>
                                    <span className="text-[11px] text-emerald-200 text-center">Bienvenido a las instalaciones</span>
                                </div>
                            )}
                        </div>

                        {/* Badges Estado */}
                        <div className="flex justify-center">
                            {isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    PASE ACTIVO - MUESTRA EN GARITA
                                </span>
                            ) : isIngresado ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    INGRESADO A INSTALACIONES
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300">
                                    <XCircle className="w-3.5 h-3.5" />
                                    PASE CANCELADO
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Información del Visitante y Cita */}
                    <div className="p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {/* Datos Visitante */}
                        <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Datos del Visitante
                            </div>
                            <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                {invitacion.visitante_nombre}
                            </div>
                            {invitacion.visitante_empresa && (
                                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                                    Empresa: <span className="font-semibold text-slate-800 dark:text-slate-200">{invitacion.visitante_empresa}</span>
                                </div>
                            )}
                            {invitacion.visitante_documento && (
                                <div className="text-xs text-slate-500 font-mono">
                                    Doc / ID: {invitacion.visitante_documento}
                                </div>
                            )}
                        </div>

                        {/* Fecha y Anfitrión */}
                        <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-400 block font-medium">Fecha Programada</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {invitacion.fecha_estimada}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-slate-400 block font-medium">Hora Estimada</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {invitacion.hora_estimada ? invitacion.hora_estimada.substring(0, 5) : 'Por confirmar'}
                                </span>
                            </div>
                        </div>

                        {/* Anfitrión */}
                        {invitacion.anfitrion && (
                            <div className="pt-4 space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                                    Anfitrión / Responsable
                                </span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-sm">
                                    {invitacion.anfitrion.nombres} {invitacion.anfitrion.apellidos}
                                </span>
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                    Instalaciones Driscoll's
                                </span>
                            </div>
                        )}

                        {/* Detalles del Vehículo o Medio */}
                        <div className="pt-4 space-y-1 text-xs">
                            <span className="text-slate-400 block font-medium">Medio de Acceso</span>
                            {invitacion.medio_acceso === 'vehicular' ? (
                                <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <Car className="w-4 h-4" /> Vehicular {invitacion.vehiculo_placa && `(Placa: ${invitacion.vehiculo_placa})`}
                                </span>
                            ) : (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <User className="w-4 h-4" /> Peatonal
                                </span>
                            )}
                        </div>

                        {invitacion.motivo_visita && (
                            <div className="pt-4 space-y-1 text-xs">
                                <span className="text-slate-400 block font-medium">Motivo de Visita</span>
                                <p className="text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border">
                                    "{invitacion.motivo_visita}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Institucional */}
                    <div className="bg-slate-50 dark:bg-slate-900 border-t p-4 text-center text-xs text-slate-500">
                        Presente este Pase Digital al oficial de seguridad en la Garita Principal.
                    </div>
                </div>
            </div>
        </>
    );
}
