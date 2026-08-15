import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, Download } from 'lucide-react';
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
    telefono?: string | null;
    correo?: string | null;
    foto_empleado?: string | null;
    foto_documento?: string | null;
    pais_telefono?: Pais | null;
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

    const formatImageUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const cleanUrl = url.replace(/^\/?(storage\/)+/, '');
        return `/storage/${cleanUrl}`;
    };

    // Generar la URL del QR de verificación
    const accessCode = empleado.codigo_acceso || empleado.documento_identidad;
    const qrData = accessCode;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=0f4426`;

    // Separar nombres y apellidos por palabras para apilarlos como en el modelo original
    const nameWords = `${empleado.nombres} ${empleado.apellidos}`
        .split(/\s+/)
        .filter(Boolean);

    const handlePrint = () => {
        window.print();
    };

    const loadHtml2Canvas = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if ((window as any).html2canvas) {
                return resolve((window as any).html2canvas);
            }
            const script = document.createElement('script');
            // Cargar html2canvas-pro que soporta oklch y sintaxis moderna de CSS
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
                    // Prevenir error de oklch en parsers removiendo hojas de estilo externas que usen oklch
                    const styleElements = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
                    styleElements.forEach((el) => {
                        try {
                            if (el.textContent && el.textContent.includes('oklch')) {
                                el.remove();
                            }
                        } catch (e) {
                            // Ignorar errores al inspeccionar elementos
                        }
                    });
                }
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Carnet_${empleado.nombres}_${empleado.apellidos}.png`.replace(/\s+/g, '_');
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
            <Head title={`${__('ID Badge')} - ${empleado.nombres} ${empleado.apellidos}`} />

            {/* Importar fuentes manuscritas similares a las del carnet de la imagen */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&display=swap');
                
                @media print {
                    /* Ocultar todo lo demás al imprimir */
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
                        border-color: #104a29 !important;
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

                {/* Controles de navegación y acción (ocultos al imprimir) */}
                <div className="w-full max-w-[340px] flex items-center justify-between gap-2 mb-6 no-print">
                    {auth?.user ? (
                        <Link
                            href="/admin/empleados"
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {__('Employees')}
                        </Link>
                    ) : (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            🪪 Carnet Digital Driscoll's
                        </span>
                    )}

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleDownloadImage}
                            disabled={downloading}
                            variant="outline"
                            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950 flex items-center gap-1.5 shadow-sm text-xs"
                        >
                            <Download className="w-4 h-4" />
                            {downloading ? __('Generando...') : __('Descargar')}
                        </Button>


                    </div>
                </div>

                {/* ── Credencial (Carnet) ── */}
                <div
                    id="badge-wrapper"
                    style={{
                        width: '340px',
                        height: '540px',
                        backgroundColor: '#ffffff',
                        border: '8px solid #104a29',
                        borderRadius: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        boxSizing: 'border-box',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                >
                    {/* Watercolor abstract top spots matching physical card */}
                    <div style={{ position: 'absolute', top: '-8px', left: '-5px', width: '95px', height: '60px', backgroundColor: 'rgba(211, 18, 42, 0.95)', borderRadius: '45% 55% 70% 30% / 50% 60% 40% 50%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-12px', left: '80px', width: '85px', height: '58px', backgroundColor: 'rgba(88, 28, 93, 0.9)', borderRadius: '50% 40% 60% 40% / 40% 50% 50% 60%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-15px', left: '155px', width: '90px', height: '52px', backgroundColor: 'rgba(16, 117, 188, 0.9)', borderRadius: '30% 70% 40% 60% / 50% 40% 60% 50%', filter: 'blur(1.5px)', mixBlendMode: 'multiply' }} />

                    {/* ══ Sección Superior (Nombres Apilados y Foto) ══ */}
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
                        {/* Nombre del empleado (lado izquierdo, apilado por palabras en Title Case) */}
                        <div style={{ width: '56%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                            {nameWords.map((word, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        fontSize: '25px',
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

                        {/* Foto del empleado (lado derecho, marco verde curvo) */}
                        <div style={{ width: '44%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '115px',
                                    height: '135px',
                                    border: '3px solid #104a29',
                                    borderRadius: '24px',
                                    overflow: 'hidden',
                                    backgroundColor: '#f8fafc',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {formatImageUrl(empleado.foto_empleado) ? (
                                    <img
                                        src={formatImageUrl(empleado.foto_empleado)!}
                                        alt={`${empleado.nombres} ${empleado.apellidos}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ color: '#cbd5e1' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ══ Sección Central (Departamento y Sucursal con tipografía manuscrita y franja verde) ══ */}
                    <div
                        style={{
                            backgroundColor: '#104a29',
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
                            fontSize: '32px',
                            fontWeight: '700',
                            margin: 0,
                            lineHeight: '1.1',
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            {empleado.departamento?.nombre || __('No Department')}
                        </p>
                        <p style={{
                            fontFamily: "'Caveat', cursive",
                            fontSize: '26px',
                            fontWeight: '700',
                            margin: '2px 0 0 0',
                            lineHeight: '1.1',
                            color: '#ffffff',
                            letterSpacing: '0.01em',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            {empleado.sucursal?.nombre || __('No Branch')}
                        </p>
                    </div>

                    {/* ══ Sección Inferior (Código QR y logo institucional) ══ */}
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
                                    border: '2px solid rgba(16, 74, 41, 0.1)',
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
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#104a29', letterSpacing: '0.1em' }}>
                                {accessCode}
                            </span>
                        </div>

                        {/* Logo sin fondo idéntico al de login.tsx */}
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

                {/* Botón principal de descarga para teléfono celular / escritorio */}
                <div className="mt-6 w-full max-w-[340px] no-print">
                    <Button
                        onClick={handleDownloadImage}
                        disabled={downloading}
                        className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg text-base"
                    >
                        <Download className="w-5 h-5" />
                        {downloading ? __('Generando Imagen PNG...') : __('Descargar Carnet como Imagen')}
                    </Button>
                </div>

            </div>
        </>
    );
}
