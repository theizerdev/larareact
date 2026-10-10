import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, Send, CreditCard, QrCode, RotateCw } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
    codigo_telefonico: string;
}

interface Empresa {
    id: number;
    razon_social: string;
    logo?: string | null;
}

interface Sucursal {
    id: number;
    nombre: string;
    direccion?: string | null;
    telefono?: string | null;
}

interface Departamento {
    id: number;
    nombre: string;
}

interface Cargo {
    id: number;
    nombre: string;
}

interface Empleado {
    id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    codigo_acceso?: string | null;
    curp?: string | null;
    telefono?: string | null;
    correo?: string | null;
    foto_empleado?: string | null;
    foto_documento?: string | null;
    paisTelefono?: Pais | null;
    departamento?: Departamento | null;
    cargo?: Cargo | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
}

interface CarnetPageProps {
    empleado: Empleado;
}

export default function CarnetPage({ empleado }: CarnetPageProps) {
    const { __ } = useTranslate();
    const { auth } = usePage().props as any;
    const [downloading, setDownloading] = useState(false);
    const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
    const [viewMode, setViewMode] = useState<'with_qr' | 'exact' | 'back'>('with_qr');

    const formatImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };

    // Código de Acceso / Empleado
    const accessCode = empleado.codigo_acceso || empleado.documento_identidad || String(empleado.id);
    const nssValue = empleado.curp || empleado.documento_identidad || '---';

    // Generar la URL del QR de verificación
    const qrData = accessCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&color=0a1c42`;

    const handlePrint = () => {
        window.print();
    };

    const handleSendWhatsApp = () => {
        if (!empleado.telefono) {
            alert(__('El empleado no tiene un número de teléfono registrado.'));
            return;
        }
        setSendingWhatsapp(true);
        router.post(
            `/admin/empleados/${empleado.id}/enviar-carnet`,
            {},
            {
                onFinish: () => setSendingWhatsapp(false),
            }
        );
    };

    const loadHtml2Canvas = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if ((window as any).html2canvas) {
                return resolve((window as any).html2canvas);
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js';
            script.onload = () => resolve((window as any).html2canvas || (window as any).html2canvasPro);
            script.onerror = () => {
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                fallbackScript.onload = () => resolve((window as any).html2canvas);
                fallbackScript.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.body.appendChild(fallbackScript);
            };
            document.body.appendChild(script);
        });
    };

    const handleDownloadImage = async () => {
        const badgeElement = document.getElementById('badge-wrapper');
        if (!badgeElement) return;

        try {
            setDownloading(true);
            const html2canvas = await loadHtml2Canvas();
            const canvas = await html2canvas(badgeElement, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                onclone: (clonedDoc: Document) => {
                    const styleElements = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
                    styleElements.forEach((el) => {
                        try {
                            if (el.textContent && el.textContent.includes('oklch')) {
                                el.remove();
                            }
                        } catch (e) {
                            // Ignorar errores
                        }
                    });
                }
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            const viewSuffix = viewMode === 'back' ? 'Reverso' : viewMode === 'exact' ? 'Frente' : 'Completo';
            link.download = `Carnet_Smurfit_${empleado.nombres}_${empleado.apellidos}_${viewSuffix}.png`.replace(/\s+/g, '_');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error al generar la imagen del carnet:', err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <Head title={`Gafete Smurfit Westrock - ${empleado.nombres} ${empleado.apellidos}`} />

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #badge-wrapper, #badge-wrapper * {
                        visibility: visible !important;
                    }
                    #badge-wrapper {
                        position: absolute !important;
                        left: 50% !important;
                        top: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        box-shadow: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                }
            `}} />

            <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center justify-center">

                {/* ── Controles Superiores de Navegación y Acciones ── */}
                <div className="w-full max-w-[380px] flex items-center justify-between gap-2 mb-4 no-print">
                    {auth?.user ? (
                        <Link
                            href="/admin/empleados"
                            className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {__('Employees')}
                        </Link>
                    ) : (
                        <span className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800">
                            🪪 Credencial Oficial Smurfit Westrock
                        </span>
                    )}

                    <div className="flex items-center gap-1.5">
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs px-2.5"
                            title={__('Imprimir Carnet')}
                        >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            {__('Imprimir')}
                        </Button>

                        <Button
                            onClick={handleDownloadImage}
                            disabled={downloading}
                            size="sm"
                            className="bg-[#00a3e0] hover:bg-[#008fc5] text-white text-xs px-3 font-semibold shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            {downloading ? __('Generando...') : __('Descargar')}
                        </Button>
                    </div>
                </div>

                {/* ── Selector de Vista: Frente con QR / Frente Fiel / Reverso ── */}
                <div className="w-full max-w-[380px] flex items-center justify-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 mb-5 no-print">
                    <button
                        onClick={() => setViewMode('with_qr')}
                        type="button"
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            viewMode === 'with_qr'
                                ? 'bg-[#00a3e0] text-white shadow-md'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Frente con QR</span>
                    </button>
                    <button
                        onClick={() => setViewMode('exact')}
                        type="button"
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            viewMode === 'exact'
                                ? 'bg-[#00a3e0] text-white shadow-md'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Frente Fiel</span>
                    </button>
                    <button
                        onClick={() => setViewMode('back')}
                        type="button"
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                            viewMode === 'back'
                                ? 'bg-[#00a3e0] text-white shadow-md'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Reverso</span>
                    </button>
                </div>

                {/* ═════════════════════════════════════════════════════════
                    CREDENCIAL / CARNET SMURFIT WESTROCK
                   ═════════════════════════════════════════════════════════ */}
                <div
                    id="badge-wrapper"
                    style={{
                        width: '340px',
                        height: viewMode === 'with_qr' ? '570px' : '540px',
                        background: 'linear-gradient(172deg, #102e6d 0%, #0d275e 38%, #081a42 100%)',
                        border: '2px solid rgba(255, 255, 255, 0.45)',
                        borderRadius: '26px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.2)',
                        boxSizing: 'border-box',
                        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        padding: '12px 16px 14px 16px'
                    }}
                >
                    {/* Trazo gráfico sutil de fondo (Identidad de marca Smurfit Westrock) */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                        viewBox="0 0 340 570"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Arco sutil azul/cian de fondo */}
                        <circle cx="340" cy="270" r="230" fill="url(#paint0_radial)" opacity="0.4" />
                        <path
                            d="M-40 430 C80 390, 200 440, 380 370 L380 600 L-40 600 Z"
                            fill="url(#paint1_linear)"
                            opacity="0.3"
                        />
                        <defs>
                            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(340 270) rotate(90) scale(230)">
                                <stop stopColor="#1a56c4" stopOpacity="0.75" />
                                <stop offset="1" stopColor="#0b2354" stopOpacity="0" />
                            </radialGradient>
                            <linearGradient id="paint1_linear" x1="170" y1="370" x2="170" y2="600" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#00a3e0" stopOpacity="0.25" />
                                <stop offset="1" stopColor="#071738" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* ══ VISTA: FRENTE (CON QR O FIEL) ══ */}
                    {viewMode !== 'back' ? (
                        <>
                            {/* 1. Ranura para gafete (Lanyard Punch Hole) */}
                            <div
                                style={{
                                    width: '54px',
                                    height: '12px',
                                    borderRadius: '9999px',
                                    backgroundColor: '#050f24',
                                    border: '1.5px solid rgba(255, 255, 255, 0.22)',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(255, 255, 255, 0.1)',
                                    zIndex: 10,
                                    margin: '2px 0 6px 0'
                                }}
                            />

                            {/* 2. Logo Smurfit Westrock */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '38px',
                                    width: '100%',
                                    zIndex: 10,
                                    margin: '0 0 8px 0'
                                }}
                            >
                                <img
                                    src="/image/logo/clientes/smurfit-westrock-logo-dark.png"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/image/logo/clientes/smurfit-westrock-logo.png";
                                    }}
                                    alt="Smurfit Westrock"
                                    style={{
                                        height: '34px',
                                        maxWidth: '185px',
                                        width: 'auto',
                                        display: 'block',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>

                            {/* 3. Contenedor de Foto con brackets cian */}
                            <div
                                style={{
                                    position: 'relative',
                                    width: '144px',
                                    height: '168px',
                                    zIndex: 10,
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {/* Bracket Superior Derecho ┐ */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-7px',
                                        right: '-7px',
                                        width: '32px',
                                        height: '42px',
                                        borderTop: '3.5px solid #00a3e0',
                                        borderRight: '3.5px solid #00a3e0',
                                        pointerEvents: 'none',
                                        zIndex: 12
                                    }}
                                />

                                {/* Bracket Inferior Izquierdo └ */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-7px',
                                        left: '-7px',
                                        width: '32px',
                                        height: '42px',
                                        borderBottom: '3.5px solid #00a3e0',
                                        borderLeft: '3.5px solid #00a3e0',
                                        pointerEvents: 'none',
                                        zIndex: 12
                                    }}
                                />

                                {/* Foto del Empleado */}
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        backgroundColor: '#e2e8f0',
                                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {formatImageUrl(empleado.foto_empleado) ? (
                                        <img
                                            src={formatImageUrl(empleado.foto_empleado)!}
                                            alt={`${empleado.nombres} ${empleado.apellidos}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 4. Nombre y Apellidos en Mayúsculas */}
                            <div
                                style={{
                                    textAlign: 'center',
                                    zIndex: 10,
                                    width: '100%',
                                    marginTop: '8px',
                                    padding: '0 6px'
                                }}
                            >
                                <div
                                    style={{
                                        color: '#ffffff',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        lineHeight: '1.15',
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    <div>{empleado.nombres}</div>
                                    <div>{empleado.apellidos}</div>
                                </div>
                            </div>

                            {/* 5. NSS y Código de Empleado (ID) */}
                            <div
                                style={{
                                    textAlign: 'center',
                                    zIndex: 10,
                                    width: '100%',
                                    marginTop: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}
                            >
                                <div style={{ fontSize: '14px', lineHeight: '1.2' }}>
                                    <span style={{ color: '#00a3e0', fontWeight: '800', marginRight: '6px' }}>NSS:</span>
                                    <span style={{ color: '#ffffff', fontWeight: '800', letterSpacing: '0.04em' }}>
                                        {nssValue}
                                    </span>
                                </div>
                                <div style={{ fontSize: '15px', lineHeight: '1.2' }}>
                                    <span style={{ color: '#00a3e0', fontWeight: '800', marginRight: '6px' }}>ID:</span>
                                    <span style={{ color: '#ffffff', fontWeight: '800', letterSpacing: '0.05em' }}>
                                        {accessCode}
                                    </span>
                                </div>
                            </div>

                            {/* 6. Código QR de Control de Acceso (En vista Frente con QR) */}
                            {viewMode === 'with_qr' && (
                                <div
                                    style={{
                                        zIndex: 10,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '6px',
                                        marginBottom: '2px'
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: '#ffffff',
                                            padding: '4px',
                                            borderRadius: '10px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                                            border: '2px solid rgba(0, 163, 224, 0.45)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <img
                                            src={qrCodeUrl}
                                            alt="Código QR de Acceso"
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                display: 'block'
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            marginTop: '4px',
                                            fontSize: '9.5px',
                                            fontWeight: '700',
                                            color: '#00a3e0',
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                            maxWidth: '280px',
                                            textAlign: 'center',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {empleado.cargo?.nombre || empleado.departamento?.nombre || 'Control de Acceso'}
                                    </span>
                                </div>
                            )}

                            {/* Si es vista fiel sin QR, agregamos un espaciador decorativo en la base */}
                            {viewMode === 'exact' && (
                                <div style={{ height: '30px', zIndex: 10 }} />
                            )}
                        </>
                    ) : (
                        /* ══ VISTA: REVERSO DE LA CREDENCIAL ══ */
                        <>
                            {/* Ranura para gafete */}
                            <div
                                style={{
                                    width: '54px',
                                    height: '12px',
                                    borderRadius: '9999px',
                                    backgroundColor: '#050f24',
                                    border: '1.5px solid rgba(255, 255, 255, 0.22)',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8)',
                                    zIndex: 10,
                                    margin: '2px 0 6px 0'
                                }}
                            />

                            {/* Título de Reverso */}
                            <div style={{ textAlign: 'center', zIndex: 10, marginTop: '4px' }}>
                                <span style={{ color: '#00a3e0', fontSize: '11px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    Control de Acceso y Seguridad
                                </span>
                            </div>

                            {/* Código QR Principal Grande */}
                            <div
                                style={{
                                    zIndex: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    margin: '10px 0'
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#ffffff',
                                        padding: '8px',
                                        borderRadius: '14px',
                                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.45)',
                                        border: '3px solid #00a3e0'
                                    }}
                                >
                                    <img
                                        src={qrCodeUrl}
                                        alt="Código QR de Verificación"
                                        style={{ width: '130px', height: '130px', display: 'block' }}
                                    />
                                </div>
                                <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '800', marginTop: '6px', letterSpacing: '0.08em' }}>
                                    ID: {accessCode}
                                </span>
                            </div>

                            {/* Datos Organizacionales */}
                            <div
                                style={{
                                    zIndex: 10,
                                    width: '100%',
                                    backgroundColor: 'rgba(6, 21, 53, 0.65)',
                                    border: '1px solid rgba(0, 163, 224, 0.25)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    lineHeight: '1.4',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ color: '#94a3b8' }}>Departamento:</span>
                                    <span style={{ color: '#ffffff', fontWeight: '700' }}>{empleado.departamento?.nombre || 'General'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ color: '#94a3b8' }}>Cargo:</span>
                                    <span style={{ color: '#ffffff', fontWeight: '700' }}>{empleado.cargo?.nombre || 'Personal'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Sucursal:</span>
                                    <span style={{ color: '#ffffff', fontWeight: '700' }}>{empleado.sucursal?.nombre || 'Principal'}</span>
                                </div>
                            </div>

                            {/* Políticas y Avisos */}
                            <div
                                style={{
                                    zIndex: 10,
                                    textAlign: 'center',
                                    padding: '0 8px',
                                    fontSize: '9.5px',
                                    color: '#cbd5e1',
                                    lineHeight: '1.3',
                                    marginTop: '8px'
                                }}
                            >
                                <p style={{ margin: '0 0 4px 0' }}>
                                    Esta credencial es propiedad de <strong style={{ color: '#ffffff' }}>Smurfit Westrock</strong>. Es personal e intransferible.
                                </p>
                                <p style={{ margin: 0, color: '#94a3b8' }}>
                                    En caso de extravío favor de reportar inmediatamente a Seguridad Patrimonial o Recursos Humanos.
                                </p>
                            </div>

                            {/* Logo inferior pequeño */}
                            <div style={{ zIndex: 10, marginTop: '8px', marginBottom: '2px' }}>
                                <img
                                    src="/image/logo/clientes/smurfit-westrock-logo-dark.png"
                                    alt="Smurfit Westrock"
                                    style={{ height: '22px', width: 'auto', opacity: 0.85 }}
                                />
                            </div>
                        </>
                    )}

                </div>

                {/* ── Botones de Acción Móvil / Escritorio ── */}
                <div className="mt-6 w-full max-w-[380px] flex flex-col gap-2.5 no-print">
                    <Button
                        onClick={handleDownloadImage}
                        disabled={downloading}
                        className="w-full bg-[#00a3e0] hover:bg-[#008fc5] text-white py-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-sm"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? __('Generando Imagen PNG...') : __('Descargar Carnet como Imagen PNG')}
                    </Button>

                    {empleado.telefono && (
                        <Button
                            onClick={handleSendWhatsApp}
                            disabled={sendingWhatsapp}
                            variant="outline"
                            className="w-full border-emerald-600 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 py-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow text-sm"
                        >
                            <Send className="w-4 h-4" />
                            {sendingWhatsapp ? __('Enviando por WhatsApp...') : __('Enviar Credencial por WhatsApp')}
                        </Button>
                    )}
                </div>

            </div>
        </>
    );
}
