import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    ShieldCheck,
    ExternalLink,
    CheckCircle2,
    Clock,
    MapPin,
    Globe,
    Hash,
    Loader2,
    AlertCircle,
    Fingerprint,
} from 'lucide-react';

interface LogItem {
    id: number;
    uuid: string;
    accion: string;
    etiqueta: string;
    descripcion: string | null;
    ip_address: string | null;
    latitud: number | null;
    longitud: number | null;
    hash_evento: string;
    ocurrido_en: string | null;
}

interface CedulaItem {
    id: number;
    uuid: string;
    origen: string;
    estado: string;
    no_empleado: string | null;
    codigo_legacy: string | null;
    nombre_completo: string;
    aviso_privacidad_aceptado_en: string | null;
    enrolado_en: string | null;
    ip_address: string | null;
    sello_digital: string | null;
    integridad_valida: boolean;
    pdf_url: string;
    logs: LogItem[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    empleado: {
        id: number;
        nombres?: string;
        apellidos?: string;
        nombre_completo?: string;
        codigo_nuevo?: string | null;
        codigo_anterior?: string | null;
        legacy?: string | null;
        documento_identidad?: string | null;
    } | null;
}

export function CedulaEnrolamientoExpedienteModal({ open, onOpenChange, empleado }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cedulas, setCedulas] = useState<CedulaItem[]>([]);

    useEffect(() => {
        if (!open || !empleado) {
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(`/admin/empleados/${empleado.id}/cedulas-enrolamiento`, {
            headers: { Accept: 'application/json' },
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'No se pudo cargar el expediente de enrolamiento.');
                }
                if (!cancelled) {
                    setCedulas(data.cedulas || []);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || 'Error al consultar el expediente.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, empleado?.id]);

    const nombre = empleado?.nombre_completo || `${empleado?.nombres || ''} ${empleado?.apellidos || ''}`.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span>Expediente — Cédulas de Enrolamiento</span>
                    </DialogTitle>
                    <DialogDescription>
                        {nombre} • No. Empleado: <strong className="font-mono">{empleado?.codigo_nuevo || empleado?.documento_identidad || '—'}</strong> • N° de Tarjeta: <strong className="font-mono">{empleado?.codigo_anterior || '—'}</strong> • Legacy: <strong className="font-mono">{empleado?.legacy || empleado?.codigo_anterior || '—'}</strong>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-sm font-medium">Cargando cédulas y bitácora del expediente...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : cedulas.length === 0 ? (
                    <div className="py-12 text-center space-y-2 border-2 border-dashed rounded-2xl bg-muted/20">
                        <Fingerprint className="w-10 h-10 mx-auto text-muted-foreground/60" />
                        <p className="font-semibold text-foreground">Sin cédulas de enrolamiento registradas</p>
                        <p className="text-xs text-muted-foreground">
                            Al completar un enrolamiento biométrico desde el Kiosko o desde el panel, la cédula con sello digital y logs se guardará aquí automáticamente.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {cedulas.map((cedula) => (
                            <div key={cedula.id} className="rounded-2xl border-2 border-border/80 bg-card p-5 space-y-4 shadow-xs">
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className="bg-emerald-600 text-white">
                                                {cedula.estado.toUpperCase()}
                                            </Badge>
                                            <Badge variant="outline" className="uppercase font-mono text-xs">
                                                {cedula.origen}
                                            </Badge>
                                            {cedula.integridad_valida && (
                                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Sello Digital Verificado
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            Folio: {cedula.uuid}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold"
                                        onClick={() => window.open(cedula.pdf_url, '_blank', 'noopener,noreferrer')}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>Ver / Descargar Cédula PDF</span>
                                    </Button>
                                </div>

                                {cedula.sello_digital && (
                                    <div className="rounded-xl bg-muted/40 border p-3 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            <Hash className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Sello Digital de Integridad (HMAC-SHA256)</span>
                                        </div>
                                        <p className="font-mono text-xs break-all text-foreground">
                                            {cedula.sello_digital}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Bitácora de Acciones Registradas ({cedula.logs.length})
                                    </p>
                                    <div className="space-y-2">
                                        {cedula.logs.map((log) => (
                                            <div key={log.id} className="rounded-xl border bg-background p-3 text-xs space-y-1.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span className="font-bold text-foreground">{log.etiqueta}</span>
                                                        <Badge variant="secondary" className="text-[10px] font-mono">
                                                            {log.accion}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-muted-foreground font-mono flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {log.ocurrido_en ? new Date(log.ocurrido_en).toLocaleString('es-MX') : '—'}
                                                    </span>
                                                </div>
                                                {log.descripcion && (
                                                    <p className="text-muted-foreground">{log.descripcion}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Globe className="w-3 h-3" />
                                                        IP: {log.ip_address || '—'}
                                                    </span>
                                                    {log.latitud && log.longitud && (
                                                        <span className="flex items-center gap-1 font-mono">
                                                            <MapPin className="w-3 h-3" />
                                                            {log.latitud.toFixed(5)}, {log.longitud.toFixed(5)}
                                                        </span>
                                                    )}
                                                    <span className="font-mono truncate max-w-xs" title={log.hash_evento}>
                                                        SHA-256: {log.hash_evento.slice(0, 20)}...
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
