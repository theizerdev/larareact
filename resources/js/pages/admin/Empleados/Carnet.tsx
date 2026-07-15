import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import React from 'react';
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

    // Generar la URL del QR de verificación
    const qrData = empleado.documento_identidad;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&color=0f4426`;

    // Separar nombres y apellidos por palabras para apilarlos como en el modelo original
    const nameWords = `${empleado.nombres} ${empleado.apellidos}`
        .split(/\s+/)
        .filter(Boolean);

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`${__('ID Badge')} - ${empleado.nombres} ${empleado.apellidos}`} />

            {/* Importar fuentes manuscritas similares a las del carnet de la imagen */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Dancing+Script:wght@700&display=swap');
                
                @media print {
                    /* Ocultar todo lo demás al imprimir */
                    body * {
                        visibility: hidden !important;
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
                <div className="w-full max-w-[340px] flex items-center justify-between mb-6 no-print">
                    <Link
                        href="/admin/empleados"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {__('Employees')}
                    </Link>

                    <Button
                        onClick={handlePrint}
                        className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-2 shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        {__('Print')}
                    </Button>
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
                    {/* Watercolor abstract top shapes (Recrea fielmente el patrón de manchas orgánicas) */}
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '100px', height: '65px', backgroundColor: 'rgba(200, 16, 46, 0.85)', borderRadius: '40% 60% 70% 30% / 50% 60% 40% 50%', filter: 'blur(3px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-15px', left: '90px', width: '85px', height: '60px', backgroundColor: 'rgba(109, 32, 119, 0.75)', borderRadius: '50% 40% 60% 40% / 40% 50% 50% 60%', filter: 'blur(3px)', mixBlendMode: 'multiply' }} />
                    <div style={{ position: 'absolute', top: '-18px', left: '160px', width: '90px', height: '55px', backgroundColor: 'rgba(0, 90, 156, 0.75)', borderRadius: '30% 70% 40% 60% / 50% 40% 60% 50%', filter: 'blur(3px)', mixBlendMode: 'multiply' }} />

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
                                {empleado.foto_empleado ? (
                                    <img
                                        src={empleado.foto_empleado}
                                        alt={`${empleado.nombres} ${empleado.apellidos}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                ) : (
                                    <div style={{ color: '#cbd5e1' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

                    {/* ══ Sección Inferior (Código QR y Driscoll's logo) ══ */}
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
                        {/* Código QR */}
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
                                style={{ width: '92px', height: '92px', display: 'block' }}
                            />
                        </div>

                        {/* Driscoll's Logo original del proyecto */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src="/image/logo/driscolls_logo.png"
                                alt="Driscoll's Logo"
                                style={{ height: '44px', width: 'auto', display: 'block', objectFit: 'contain' }}
                            />
                            {/* Subtexto en letra sans-serif pequeña y elegante */}
                            <p
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.15em',
                                    color: '#104a29',
                                    margin: '4px 0 0 0',
                                    textTransform: 'none',
                                    opacity: 0.9,
                                    fontFamily: 'system-ui, sans-serif'
                                }}
                            >
                                Only the Finest Berries™
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}
