import { Head, Link, usePage, router } from '@inertiajs/react';
import { ArrowLeft, Printer, Download, Send, Truck } from 'lucide-react';
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
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface Proveedor {
    id: number;
    razon_social: string;
    nombre_comercial?: string | null;
    documento_identidad?: string | null;
    codigo_acceso?: string | null;
    rfc?: string | null;
    responsable?: string | null;
    curp?: string | null;
    telefono?: string | null;
    paisTelefono?: Pais | null;
    empresa?: Empresa | null;
    sucursal?: Sucursal | null;
}

interface CarnetProveedorPageProps {
    proveedor: Proveedor;
}

export default function CarnetProveedorPage({ proveedor }: CarnetProveedorPageProps) {
    const { __ } = useTranslate();
    const { auth } = usePage().props as any;
    const [downloading, setDownloading] = useState(false);
    const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

    const displayName = proveedor.nombre_comercial || proveedor.razon_social;
    const nameWords = displayName.split(/\s+/).filter(Boolean);

    // QR de Verificación
    const accessCode = proveedor.codigo_acceso || proveedor.curp || proveedor.rfc || proveedor.documento_identidad || `PROV_${proveedor.id}`;
    const qrData = accessCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=b91c1c`;

    const handlePrint = () => {
        window.print();
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
                backgroundColor: '#ffffff',
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
            link.download = `Gafete_Proveedor_${displayName.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error al generar la imagen del carnet:', err);
        } finally {
            setDownloading(false);
        }
    };

    const handleSendWhatsApp = () => {
        setSendingWhatsapp(true);
        router.post(`/admin/proveedores/${proveedor.id}/send-carnet-whatsapp`, {}, {
            onFinish: () => setSendingWhatsapp(false)
        });
    };

    return (
        <>
            <Head title={`${__('Gafete Proveedor')} - ${displayName}`} />

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&display=swap');
                
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
                        border-width: 8px !important;
                        border-color: #b91c1c !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: portrait;
                        margin: 0;
                    }
                }
            `}} />

            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 flex flex-col items-center justify-center">

                {/* Controles de navegación y acción */}
                <div className="w-full max-w-[340px] flex items-center justify-between gap-2 mb-6 no-print">
                    {auth?.user ? (
                        <Link
                            href="/admin/proveedores"
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {__('Proveedores')}
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                            🪪 Gafete de Proveedor
                        </span>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleDownloadImage}
                            disabled={downloading}
                            variant="outline"
                            className="border-rose-600 text-rose-700 hover:bg-rose-50 dark:border-rose-500 dark:text-rose-300 dark:hover:bg-rose-950 flex items-center gap-1.5 shadow-xs text-xs font-bold"
                        >
                            <Download className="w-4 h-4" />
                            {downloading ? __('Generando...') : __('Descargar')}
                        </Button>
                    </div>
                </div>

                {/* ── Credencial (Gafete Rojo de Proveedor) ── */}
                <div
                    id="badge-wrapper"
                    style={{
                        width: '340px',
                        height: '540px',
                        backgroundColor: '#ffffff',
                        border: '8px solid #b91c1c',
                        borderRadius: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 25px 50px -12px rgba(185, 28, 28, 0.25)',
                        boxSizing: 'border-box',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                >
                    {/* Abstract watercolor top spots en tonos rojos y borgoña */}
                    <div style={{ position: 'absolute', top: '-8px', left: '-5px', width: '95px', height: '60px', backgroundColor: 'rgba(185, 28, 28, 0.95)', borderRadius: '45% 55% 70% 30% / 50% 60% 40% 50%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-12px', left: '80px', width: '85px', height: '58px', backgroundColor: 'rgba(153, 27, 27, 0.9)', borderRadius: '50% 40% 60% 40% / 40% 50% 50% 60%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-15px', left: '155px', width: '90px', height: '52px', backgroundColor: 'rgba(225, 29, 72, 0.85)', borderRadius: '30% 70% 40% 60% / 50% 40% 60% 50%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />

                    {/* ══ Sección Superior (Nombre y Badge de Proveedor) ══ */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '48px 20px 10px 20px',
                            boxSizing: 'border-box',
                            height: '190px',
                            zIndex: 10
                        }}
                    >
                        {/* Nombre del Proveedor (apilado) */}
                        <div style={{ width: '58%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                            {nameWords.slice(0, 4).map((word, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        fontSize: '23px',
                                        fontWeight: '800',
                                        lineHeight: '1.05',
                                        color: '#1a202c',
                                        fontFamily: 'system-ui, sans-serif',
                                        letterSpacing: '-0.03em',
                                        wordBreak: 'break-all'
                                    }}
                                >
                                    {word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}
                                </span>
                            ))}
                        </div>

                        {/* Icono / Marca de Proveedor en marco rojo */}
                        <div style={{ width: '42%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '110px',
                                    height: '130px',
                                    border: '3px solid #b91c1c',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    backgroundColor: '#fef2f2',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px'
                                }}
                            >
                                <Truck style={{ width: '48px', height: '48px', color: '#b91c1c' }} />
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    PROVEEDOR
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ══ Sección Central (Franja Roja ROJA) ══ */}
                    <div
                        style={{
                            backgroundColor: '#b91c1c',
                            padding: '10px 10px',
                            textAlign: 'center',
                            color: '#ffffff',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '95px'
                        }}
                    >
                        <p style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: '30px',
                            fontWeight: '700',
                            margin: 0,
                            lineHeight: '1.1',
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                            PROVEEDOR AUTORIZADO
                        </p>
                        {proveedor.responsable && (
                            <p style={{
                                fontFamily: "'Caveat', cursive",
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: '2px 0 0 0',
                                lineHeight: '1.1',
                                color: '#fef2f2',
                                letterSpacing: '0.01em'
                            }}>
                                Resp: {proveedor.responsable}
                            </p>
                        )}
                    </div>

                    {/* ══ Sección Inferior (Código QR y Logo) ══ */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                            padding: '14px 0',
                            boxSizing: 'border-box',
                            height: '225px'
                        }}
                    >
                        {/* Código QR y Código de Acceso */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px'
                            }}
                        >
                            <div
                                style={{
                                    padding: '4px',
                                    border: '2px solid rgba(185, 28, 28, 0.2)',
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <img
                                    src={qrCodeUrl}
                                    alt="Verification QR Code"
                                    style={{ width: '84px', height: '84px', display: 'block' }}
                                />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c', letterSpacing: '0.1em' }}>
                                {accessCode}
                            </span>
                        </div>

                        {/* Logo institucional */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '75px', width: '100%', padding: '0 10px', boxSizing: 'border-box' }}>
                            <img
                                src="/image/logo/hosho/lockup.webp"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/image/logo/hosho/lockup.webp";
                                }}
                                alt="Hoshō"
                                style={{ height: '72px', maxWidth: '250px', width: 'auto', display: 'block', objectFit: 'contain', backgroundColor: 'transparent' }}
                            />
                        </div>
                    </div>

                </div>

                {/* Acciones principales de descarga e impresión */}
                <div className="mt-6 w-full max-w-[340px] space-y-2 no-print">
                    <Button
                        onClick={handleDownloadImage}
                        disabled={downloading}
                        className="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-base"
                    >
                        <Download className="w-5 h-5" />
                        {downloading ? __('Generando Imagen PNG...') : __('Descargar Gafete como Imagen')}
                    </Button>

                    {auth?.user && proveedor.telefono && (
                        <Button
                            onClick={handleSendWhatsApp}
                            disabled={sendingWhatsapp}
                            variant="outline"
                            className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950 py-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs text-sm"
                        >
                            <Send className="w-4 h-4 text-emerald-600" />
                            {sendingWhatsapp ? __('Enviando a WhatsApp...') : __('Enviar Gafete a WhatsApp')}
                        </Button>
                    )}

                    <Button
                        onClick={handlePrint}
                        variant="ghost"
                        className="w-full text-slate-600 hover:text-slate-900 dark:text-slate-400 py-3 text-xs flex items-center justify-center gap-1.5"
                    >
                        <Printer className="w-4 h-4" />
                        {__('Imprimir Gafete')}
                    </Button>
                </div>

            </div>
        </>
    );
}

CarnetProveedorPage.layout = (page: React.ReactNode) => page;
