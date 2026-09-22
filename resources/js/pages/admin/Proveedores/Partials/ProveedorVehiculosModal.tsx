import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Car,
    Plus,
    Trash2,
    Pencil,
    Eye,
    Calendar,
    UploadCloud,
    Check,
    Camera,
    Truck,
    Shield,
    FileText,
    Container,
    Layers,
    Gauge,
    AlertCircle,
    Sliders,
    ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface Proveedor {
    id: number;
    razon_social: string;
}

export interface ProveedorVehiculo {
    id: number;
    proveedor_id: number;
    tipo_vehiculo: string;
    categoria_vehiculo?: string | null;
    subtipo_carroceria?: string | null;
    marca: string;
    modelo: string;
    year: number;
    placa: string;
    numero_serie_vin?: string | null;
    numero_ejes?: number | null;
    tarjeta_circulacion?: string | null;
    aseguradora?: string | null;
    poliza_seguro?: string | null;
    vigencia_seguro?: string | null;
    foto_frontal?: string | null;
    foto_trasera?: string | null;
    tiene_remolque?: boolean;
    remolque_fabricante?: string | null;
    remolque_serie_fabricante?: string | null;
    remolque_vin?: string | null;
    remolque_placa?: string | null;
    remolque_tipo?: string | null;
    remolque_modelo?: string | null;
    remolque_year?: number | null;
    remolque_peso_bruto_vehicular?: string | null;
    remolque_peso_vehicular?: string | null;
    remolque_capacidad_carga?: string | null;
    remolque_largo?: string | null;
    remolque_ancho?: string | null;
    remolque_alto?: string | null;
    remolque_ejes?: number | null;
    remolque_capacidad_ejes?: string | null;
    remolque_tipo_suspension?: string | null;
    remolque_capacidad_patines?: string | null;
    remolque_cantidad_llantas?: number | null;
    remolque_medida_llantas?: string | null;
    remolque_presion_llantas?: string | null;
    remolque_foto_placa?: string | null;
    remolque_foto_lateral?: string | null;
}

interface ProveedorVehiculosModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
}

type CameraFieldType = 'foto_frontal' | 'foto_trasera' | 'remolque_foto_placa' | 'remolque_foto_lateral';

const cleanUtf8 = (str?: string | null) => {
    if (!str) return '';
    try {
        return decodeURIComponent(escape(str));
    } catch (_) {
        return str;
    }
};

const initialForm = {
    categoria_vehiculo: 'carga',
    tipo_vehiculo: 'Tractocamión',
    subtipo_carroceria: 'Caja Seca',
    marca: '',
    modelo: '',
    year: new Date().getFullYear(),
    placa: '',
    numero_serie_vin: '',
    numero_ejes: 3,
    tarjeta_circulacion: '',
    aseguradora: '',
    poliza_seguro: '',
    vigencia_seguro: '',
    foto_frontal: null as File | null,
    foto_trasera: null as File | null,

    // Semirremolque / Caja
    tiene_remolque: true,
    remolque_fabricante: '',
    remolque_serie_fabricante: '',
    remolque_vin: '',
    remolque_placa: '',
    remolque_tipo: 'Caja Seca',
    remolque_modelo: '',
    remolque_year: new Date().getFullYear(),
    remolque_peso_bruto_vehicular: '',
    remolque_peso_vehicular: '',
    remolque_capacidad_carga: '',
    remolque_largo: "53'",
    remolque_ancho: '2.60 m',
    remolque_alto: '4.15 m',
    remolque_ejes: 2,
    remolque_capacidad_ejes: '',
    remolque_tipo_suspension: 'Neumática',
    remolque_capacidad_patines: '',
    remolque_cantidad_llantas: 8,
    remolque_medida_llantas: '295/75R22.5',
    remolque_presion_llantas: '100 PSI',
    remolque_foto_placa: null as File | null,
    remolque_foto_lateral: null as File | null,
};

export default function ProveedorVehiculosModal({
    isOpen,
    onClose,
    proveedor,
}: ProveedorVehiculosModalProps) {
    const { __ } = useTranslate();

    // ── Estados ────────────────────────────────────────────────────────────────
    const [vehicles, setVehicles] = useState<ProveedorVehiculo[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<ProveedorVehiculo | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    
    // Tab activo en el formulario
    const [activeFormTab, setActiveFormTab] = useState<'unidad' | 'caja' | 'fotos'>('unidad');

    // Formulario local
    const [form, setForm] = useState({ ...initialForm });
    
    // Previsualizaciones de archivos
    const [previews, setPreviews] = useState({
        foto_frontal: '',
        foto_trasera: '',
        remolque_foto_placa: '',
        remolque_foto_lateral: '',
    });

    // Visor de fotos (Lightbox)
    const [viewingDocsVehicle, setViewingDocsVehicle] = useState<ProveedorVehiculo | null>(null);

    // Cámara Web
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<CameraFieldType | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [cameraStream]);

    // ── Cargar vehículos cuando abre el modal ──────────────────────────────────
    useEffect(() => {
        if (isOpen && proveedor) {
            loadVehicles();
            handleResetForm();
        }
    }, [isOpen, proveedor]);

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    const loadVehicles = async () => {
        if (!proveedor) return;
        try {
            setIsLoadingList(true);
            const response = await fetch(`/admin/proveedores/${proveedor.id}/vehiculos`, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setVehicles(data.vehicles || []);
                }
            }
        } catch (_) {
            toast.error(__('Failed to load vehicles list.'));
        } finally {
            setIsLoadingList(false);
        }
    };

    // Al cambiar tipo de vehículo, verificar si amerita caja por defecto
    const handleTipoVehiculoChange = (val: string) => {
        const isArticulated = ['Tractocamión', 'Camión Remolque', 'tractocamion', 'camion_remolque'].includes(val);
        setForm((prev) => ({
            ...prev,
            tipo_vehiculo: val,
            tiene_remolque: isArticulated ? true : prev.tiene_remolque,
        }));
    };

    // ── File Handlers ──────────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof previews) => {
        const file = e.target.files?.[0] || null;
        setForm((prev) => ({ ...prev, [fieldName]: file }));

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews((prev) => ({ ...prev, [fieldName]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        } else {
            setPreviews((prev) => ({ ...prev, [fieldName]: '' }));
        }
    };

    const handleResetForm = () => {
        setForm({ ...initialForm });
        setPreviews({
            foto_frontal: '',
            foto_trasera: '',
            remolque_foto_placa: '',
            remolque_foto_lateral: '',
        });
        setEditingVehicle(null);
        setValidationErrors({});
        setActiveFormTab('unidad');
    };

    // Cargar vehículo en edición
    const handleEditClick = (veh: ProveedorVehiculo) => {
        setEditingVehicle(veh);
        setValidationErrors({});
        setForm({
            categoria_vehiculo: veh.categoria_vehiculo || 'carga',
            tipo_vehiculo: veh.tipo_vehiculo || 'Tractocamión',
            subtipo_carroceria: veh.subtipo_carroceria || 'Caja Seca',
            marca: veh.marca || '',
            modelo: veh.modelo || '',
            year: veh.year || new Date().getFullYear(),
            placa: veh.placa || '',
            numero_serie_vin: veh.numero_serie_vin || '',
            numero_ejes: veh.numero_ejes || 3,
            tarjeta_circulacion: veh.tarjeta_circulacion || '',
            aseguradora: veh.aseguradora || '',
            poliza_seguro: veh.poliza_seguro || '',
            vigencia_seguro: veh.vigencia_seguro ? veh.vigencia_seguro.substring(0, 10) : '',
            foto_frontal: null,
            foto_trasera: null,

            tiene_remolque: Boolean(veh.tiene_remolque),
            remolque_fabricante: veh.remolque_fabricante || '',
            remolque_serie_fabricante: veh.remolque_serie_fabricante || '',
            remolque_vin: veh.remolque_vin || '',
            remolque_placa: veh.remolque_placa || '',
            remolque_tipo: veh.remolque_tipo || 'Caja Seca',
            remolque_modelo: veh.remolque_modelo || '',
            remolque_year: veh.remolque_year || new Date().getFullYear(),
            remolque_peso_bruto_vehicular: veh.remolque_peso_bruto_vehicular || '',
            remolque_peso_vehicular: veh.remolque_peso_vehicular || '',
            remolque_capacidad_carga: veh.remolque_capacidad_carga || '',
            remolque_largo: veh.remolque_largo || "53'",
            remolque_ancho: veh.remolque_ancho || '2.60 m',
            remolque_alto: veh.remolque_alto || '4.15 m',
            remolque_ejes: veh.remolque_ejes || 2,
            remolque_capacidad_ejes: veh.remolque_capacidad_ejes || '',
            remolque_tipo_suspension: veh.remolque_tipo_suspension || 'Neumática',
            remolque_capacidad_patines: veh.remolque_capacidad_patines || '',
            remolque_cantidad_llantas: veh.remolque_cantidad_llantas || 8,
            remolque_medida_llantas: veh.remolque_medida_llantas || '295/75R22.5',
            remolque_presion_llantas: veh.remolque_presion_llantas || '100 PSI',
            remolque_foto_placa: null,
            remolque_foto_lateral: null,
        });

        setPreviews({
            foto_frontal: veh.foto_frontal ? `/storage/${veh.foto_frontal}` : '',
            foto_trasera: veh.foto_trasera ? `/storage/${veh.foto_trasera}` : '',
            remolque_foto_placa: veh.remolque_foto_placa ? `/storage/${veh.remolque_foto_placa}` : '',
            remolque_foto_lateral: veh.remolque_foto_lateral ? `/storage/${veh.remolque_foto_lateral}` : '',
        });
    };

    // ── Cámara Web Handlers ───────────────────────────────────────────────────
    const handleOpenCamera = async (field: CameraFieldType) => {
        setActiveCameraField(field);
        setIsCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });
            setCameraStream(stream);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error(__('Failed to access camera. Please grant permission.'));
            handleCloseCamera();
        }
    };

    const handleCloseCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
        }
        setCameraStream(null);
        setIsCameraOpen(false);
        setActiveCameraField(null);
    };

    const handleCapturePhoto = () => {
        if (!videoRef.current || !activeCameraField) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `${activeCameraField}_captured.jpg`, { type: 'image/jpeg' });
                setForm((prev) => ({ ...prev, [activeCameraField]: file }));
                setPreviews((prev) => ({ ...prev, [activeCameraField]: URL.createObjectURL(file) }));
            }
            handleCloseCamera();
        }, 'image/jpeg', 0.95);
    };

    // ── Enviar Formulario ─────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedor) return;

        try {
            setIsSubmitting(true);
            setValidationErrors({});

            const formData = new FormData();
            formData.append('tipo_vehiculo', form.tipo_vehiculo);
            formData.append('categoria_vehiculo', form.categoria_vehiculo || '');
            formData.append('subtipo_carroceria', form.subtipo_carroceria || '');
            formData.append('marca', form.marca);
            formData.append('modelo', form.modelo);
            formData.append('year', String(form.year));
            formData.append('placa', form.placa.toUpperCase());
            formData.append('numero_serie_vin', (form.numero_serie_vin || '').toUpperCase());
            if (form.numero_ejes) formData.append('numero_ejes', String(form.numero_ejes));
            if (form.tarjeta_circulacion) formData.append('tarjeta_circulacion', form.tarjeta_circulacion);
            if (form.aseguradora) formData.append('aseguradora', form.aseguradora);
            if (form.poliza_seguro) formData.append('poliza_seguro', form.poliza_seguro);
            if (form.vigencia_seguro) formData.append('vigencia_seguro', form.vigencia_seguro);

            // Semirremolque / Caja
            formData.append('tiene_remolque', form.tiene_remolque ? '1' : '0');
            if (form.tiene_remolque) {
                if (form.remolque_fabricante) formData.append('remolque_fabricante', form.remolque_fabricante);
                if (form.remolque_serie_fabricante) formData.append('remolque_serie_fabricante', form.remolque_serie_fabricante);
                if (form.remolque_vin) formData.append('remolque_vin', form.remolque_vin.toUpperCase());
                if (form.remolque_placa) formData.append('remolque_placa', form.remolque_placa.toUpperCase());
                if (form.remolque_tipo) formData.append('remolque_tipo', form.remolque_tipo);
                if (form.remolque_modelo) formData.append('remolque_modelo', form.remolque_modelo);
                if (form.remolque_year) formData.append('remolque_year', String(form.remolque_year));
                if (form.remolque_peso_bruto_vehicular) formData.append('remolque_peso_bruto_vehicular', form.remolque_peso_bruto_vehicular);
                if (form.remolque_peso_vehicular) formData.append('remolque_peso_vehicular', form.remolque_peso_vehicular);
                if (form.remolque_capacidad_carga) formData.append('remolque_capacidad_carga', form.remolque_capacidad_carga);
                if (form.remolque_largo) formData.append('remolque_largo', form.remolque_largo);
                if (form.remolque_ancho) formData.append('remolque_ancho', form.remolque_ancho);
                if (form.remolque_alto) formData.append('remolque_alto', form.remolque_alto);
                if (form.remolque_ejes) formData.append('remolque_ejes', String(form.remolque_ejes));
                if (form.remolque_capacidad_ejes) formData.append('remolque_capacidad_ejes', form.remolque_capacidad_ejes);
                if (form.remolque_tipo_suspension) formData.append('remolque_tipo_suspension', form.remolque_tipo_suspension);
                if (form.remolque_capacidad_patines) formData.append('remolque_capacidad_patines', form.remolque_capacidad_patines);
                if (form.remolque_cantidad_llantas) formData.append('remolque_cantidad_llantas', String(form.remolque_cantidad_llantas));
                if (form.remolque_medida_llantas) formData.append('remolque_medida_llantas', form.remolque_medida_llantas);
                if (form.remolque_presion_llantas) formData.append('remolque_presion_llantas', form.remolque_presion_llantas);

                if (form.remolque_foto_placa) formData.append('remolque_foto_placa', form.remolque_foto_placa);
                if (form.remolque_foto_lateral) formData.append('remolque_foto_lateral', form.remolque_foto_lateral);
            }

            if (form.foto_frontal) formData.append('foto_frontal', form.foto_frontal);
            if (form.foto_trasera) formData.append('foto_trasera', form.foto_trasera);

            let url = `/admin/proveedores/${proveedor.id}/vehiculos`;
            if (editingVehicle) {
                formData.append('_method', 'POST');
                url = `/admin/proveedor-vehiculos/${editingVehicle.id}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                }
            });

            const resData = await response.json();

            if (response.ok && resData.success) {
                toast.success(editingVehicle ? __('Vehicle updated successfully.') : __('Vehicle added successfully.'));
                handleResetForm();
                loadVehicles();
            } else if (response.status === 422) {
                const errors = resData.errors || {};
                const flatErrors: Record<string, string> = {};
                Object.keys(errors).forEach((key) => {
                    flatErrors[key] = errors[key][0];
                });
                setValidationErrors(flatErrors);
                toast.error(__('Please correct the errors in the form.'));
            } else {
                toast.error(__('An error occurred while saving the vehicle.'));
            }
        } catch (error) {
            toast.error(__('An error occurred while saving the vehicle.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Eliminar Vehículo ─────────────────────────────────────────────────────
    const handleDeleteClick = async (vehId: number) => {
        if (!confirm(__('Are you sure you want to remove this vehicle?'))) return;

        try {
            const response = await fetch(`/admin/proveedor-vehiculos/${vehId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                }
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.success) {
                    toast.success(__('Vehicle removed successfully.'));
                    loadVehicles();
                    if (editingVehicle?.id === vehId) {
                        handleResetForm();
                    }
                }
            }
        } catch (_) {
            toast.error(__('Failed to delete vehicle.'));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[96vw] lg:max-w-[1380px] xl:max-w-[1440px] w-full max-h-[94vh] overflow-y-auto p-6 md:p-8 flex flex-col">
                
                <DialogHeader className="border-b pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#104a29]/10 dark:bg-[#104a29]/20 flex items-center justify-center text-[#104a29]">
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    {__('Supplier Vehicles and Semi-trailers')}
                                </DialogTitle>
                                <DialogDescription className="text-xs md:text-sm mt-0.5">
                                    {__('Regulatory technical registry (Federal Traffic Regulations Art. 24 and Semi-trailer Plate NOM-035-SCT-2-2010) for')} <span className="font-semibold text-slate-800 dark:text-slate-200">{cleanUtf8(proveedor?.razon_social)}</span>.
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Insignia de cumplimiento normativo */}
                        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <span>NOM-035-SCT / Reg. Carreteras Federales</span>
                        </div>
                    </div>
                </DialogHeader>

                {/* ══ Grid: Formulario (Izq) y Lista (Der) ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 min-h-0">
                    
                    {/* ── Columna Izquierda: Formulario Modular (50%) ── */}
                    <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800/80 h-fit space-y-5">
                        
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Car className="w-5 h-5 text-[#104a29]" />
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                    {editingVehicle ? __('Edit Vehicle') : __('Register New Vehicle')}
                                </h3>
                            </div>
                            {editingVehicle && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleResetForm}
                                    className="h-8 text-xs text-rose-600 hover:text-rose-700"
                                >
                                    {__('Cancel')}
                                </Button>
                            )}
                        </div>

                        {/* Pestañas internas para organización ergonómica */}
                        <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveFormTab('unidad')}
                                className={cn(
                                    'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                                    activeFormTab === 'unidad'
                                        ? 'bg-white dark:bg-slate-900 text-[#104a29] shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                )}
                            >
                                <Truck className="w-3.5 h-3.5" />
                                <span>{__('1. Motor Unit')}</span>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setActiveFormTab('caja')}
                                className={cn(
                                    'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 relative',
                                    activeFormTab === 'caja'
                                        ? 'bg-white dark:bg-slate-900 text-[#104a29] shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                )}
                            >
                                <Container className="w-3.5 h-3.5" />
                                <span>{__('2. Box / Trailer')}</span>
                                {form.tiene_remolque && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveFormTab('fotos')}
                                className={cn(
                                    'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
                                    activeFormTab === 'fotos'
                                        ? 'bg-white dark:bg-slate-900 text-[#104a29] shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                )}
                            >
                                <Camera className="w-3.5 h-3.5" />
                                <span>{__('3. Photographs')}</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* ── TAB 1: UNIDAD MOTRIZ (REGLAMENTO FEDERAL ART. 24) ── */}
                            {activeFormTab === 'unidad' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                                        <Shield className="w-4 h-4 shrink-0 text-emerald-600" />
                                        <span>{__('Classification according to Federal Highway Traffic Regulations (Art. 24)')}</span>
                                    </div>

                                    {/* Categoría y Tipo de Vehículo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Federal Category')} *</Label>
                                            <Select
                                                value={form.categoria_vehiculo}
                                                onValueChange={(v) => setForm((prev) => ({ ...prev, categoria_vehiculo: v }))}
                                            >
                                                <SelectTrigger className="w-full h-9 text-xs">
                                                    <SelectValue placeholder={__('Select Category')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="carga">{__('Freight Transport')}</SelectItem>
                                                    <SelectItem value="personas">{__('Passenger Transport')}</SelectItem>
                                                    <SelectItem value="excepcional">{__('Exceptional / Special Traffic')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Vehicle Type')} *</Label>
                                            <Select
                                                value={form.tipo_vehiculo}
                                                onValueChange={handleTipoVehiculoChange}
                                            >
                                                <SelectTrigger className="w-full h-9 text-xs">
                                                    <SelectValue placeholder={__('Vehicle Type')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {form.categoria_vehiculo === 'carga' ? (
                                                        <>
                                                            <SelectItem value="Tractocamión">{__('Tractor Truck (Fifth Wheel)')}</SelectItem>
                                                            <SelectItem value="Camión Remolque">{__('Truck Trailer')}</SelectItem>
                                                            <SelectItem value="Camión Unitario Pesado">{__('Heavy Unit Truck (C3+)')}</SelectItem>
                                                            <SelectItem value="Camión Unitario Ligero">{__('Light Unit Truck (C2)')}</SelectItem>
                                                            <SelectItem value="Semirremolque">{__('Semi-trailer')}</SelectItem>
                                                            <SelectItem value="Remolque">{__('Trailer')}</SelectItem>
                                                            <SelectItem value="Vehículo Tipo Grúa">{__('Tow Truck')}</SelectItem>
                                                        </>
                                                    ) : form.categoria_vehiculo === 'personas' ? (
                                                        <>
                                                            <SelectItem value="Automóvil">{__('Car (Sedan/Hatchback)')}</SelectItem>
                                                            <SelectItem value="Camioneta">{__('SUV / Truck')}</SelectItem>
                                                            <SelectItem value="Pick-up">{__('Pickup')}</SelectItem>
                                                            <SelectItem value="Vagoneta">{__('Van / Station Wagon')}</SelectItem>
                                                            <SelectItem value="Autobús">{__('Bus')}</SelectItem>
                                                            <SelectItem value="Midibús">{__('Midibus')}</SelectItem>
                                                            <SelectItem value="Motocicleta">{__('Motorcycle')}</SelectItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SelectItem value="Tractor Agrícola">{__('Agricultural Tractor')}</SelectItem>
                                                            <SelectItem value="Maquinaria Construcción">{__('Machinery / Self-propelled')}</SelectItem>
                                                            <SelectItem value="Especial Indivisible">{__('Special Design (Heavy Weight/Volume)')}</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Subtipo de Carrocería */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Body Subtype')} (Art. 24)</Label>
                                            <Select
                                                value={form.subtipo_carroceria}
                                                onValueChange={(v) => setForm((prev) => ({ ...prev, subtipo_carroceria: v }))}
                                            >
                                                <SelectTrigger className="w-full h-9 text-xs">
                                                    <SelectValue placeholder={__('Body Configuration')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Caja Seca">{__('Dry / Closed Box')}</SelectItem>
                                                    <SelectItem value="Refrigerador">{__('Refrigerated Box (Thermo)')}</SelectItem>
                                                    <SelectItem value="Plataforma">{__('Flatbed')}</SelectItem>
                                                    <SelectItem value="Cama Baja">{__('Lowboy')}</SelectItem>
                                                    <SelectItem value="Redilas">{__('Stake Truck')}</SelectItem>
                                                    <SelectItem value="Tanque">{__('Tank / Tanker')}</SelectItem>
                                                    <SelectItem value="Tolva">{__('Hopper')}</SelectItem>
                                                    <SelectItem value="Volteo">{__('Dump')}</SelectItem>
                                                    <SelectItem value="Chasis">{__('Chassis')}</SelectItem>
                                                    <SelectItem value="Caseta">{__('Camper / Shell')}</SelectItem>
                                                    <SelectItem value="Panel">{__('Panel')}</SelectItem>
                                                    <SelectItem value="Pick-up">{__('Pickup')}</SelectItem>
                                                    <SelectItem value="Jaula">{__('Cage')}</SelectItem>
                                                    <SelectItem value="Portacontenedor">{__('Container Carrier')}</SelectItem>
                                                    <SelectItem value="Otro">{__('Other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Unit License Plate')} *</Label>
                                            <Input
                                                value={form.placa}
                                                onChange={(e) => setForm((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                                                className="w-full h-9 text-xs font-mono font-bold uppercase"
                                                placeholder={__('e.g. 12-AA-3B or ABC-123')}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Marca, Modelo, Año */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Brand')} *</Label>
                                            <Input
                                                value={form.marca}
                                                onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                                placeholder={__('e.g. Kenworth, Freightliner')}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Model')} *</Label>
                                            <Input
                                                value={form.modelo}
                                                onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                                placeholder={__('e.g. T680, Cascadia')}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Year')} *</Label>
                                            <Input
                                                type="number"
                                                value={form.year}
                                                onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                                                className="w-full h-9 text-xs"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* VIN de la Unidad y Número de Ejes */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('VIN / Serial Number (17 digits)')}</Label>
                                            <Input
                                                value={form.numero_serie_vin}
                                                onChange={(e) => setForm((prev) => ({ ...prev, numero_serie_vin: e.target.value.toUpperCase() }))}
                                                className="w-full h-9 text-xs font-mono uppercase"
                                                placeholder="1M8GDM9A_KP042788"
                                                maxLength={17}
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Tractor / Truck Axles Count')}</Label>
                                            <Select
                                                value={String(form.numero_ejes)}
                                                onValueChange={(v) => setForm((prev) => ({ ...prev, numero_ejes: Number(v) }))}
                                            >
                                                <SelectTrigger className="w-full h-9 text-xs">
                                                    <SelectValue placeholder={__('Axles')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2">{__('2 Axles')}</SelectItem>
                                                    <SelectItem value="3">{__('3 Axles (Tandem)')}</SelectItem>
                                                    <SelectItem value="4">{__('4 Axles')}</SelectItem>
                                                    <SelectItem value="5">{__('5 Axles')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Tarjeta de Circulación y Seguro Obligatorio */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Card Folio')}</Label>
                                            <Input
                                                value={form.tarjeta_circulacion}
                                                onChange={(e) => setForm((prev) => ({ ...prev, tarjeta_circulacion: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                                placeholder={__('SCT/State Folio')}
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Insurance Company')}</Label>
                                            <Input
                                                value={form.aseguradora}
                                                onChange={(e) => setForm((prev) => ({ ...prev, aseguradora: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                                placeholder={__('e.g. Qualitas, GNP')}
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Insurance Policy No.')}</Label>
                                            <Input
                                                value={form.poliza_seguro}
                                                onChange={(e) => setForm((prev) => ({ ...prev, poliza_seguro: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                                placeholder={__('Valid policy')}
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <Label className="text-xs font-semibold">{__('Policy Validity')}</Label>
                                            <Input
                                                type="date"
                                                value={form.vigencia_seguro}
                                                onChange={(e) => setForm((prev) => ({ ...prev, vigencia_seguro: e.target.value }))}
                                                className="w-full h-9 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB 2: CAJA / SEMIRREMOLQUE (PLACA NOM-035-SCT) ── */}
                            {activeFormTab === 'caja' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    
                                    {/* Toggle de activación de caja */}
                                    <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl flex items-center justify-between border">
                                        <div className="flex items-center gap-2.5">
                                            <Container className="w-5 h-5 text-[#104a29]" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    {__('Has Box / Semi-trailer attached?')}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {__('Enable to register manufacturer plate technical specifications (NOM-035-SCT-2-2010)')}
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.tiene_remolque}
                                            onChange={(e) => setForm((prev) => ({ ...prev, tiene_remolque: e.target.checked }))}
                                            className="w-5 h-5 accent-[#104a29] cursor-pointer rounded"
                                        />
                                    </div>

                                    {!form.tiene_remolque ? (
                                        <div className="p-8 border border-dashed rounded-xl text-center bg-white dark:bg-slate-900/30">
                                            <Container className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-slate-500">
                                                {__('This vehicle has no box or semi-trailer attached.')}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setForm((prev) => ({ ...prev, tiene_remolque: true }))}
                                                className="mt-3 text-xs text-[#104a29] border-[#104a29]/30"
                                            >
                                                {__('Enable Box / Trailer Registration')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Datos del Fabricante de la Caja */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1.5 w-full">
                                                    <Label className="text-xs font-semibold">{__('Manufacturer / Brand')} *</Label>
                                                    <Input
                                                        value={form.remolque_fabricante}
                                                        onChange={(e) => setForm((prev) => ({ ...prev, remolque_fabricante: e.target.value }))}
                                                        className="w-full h-9 text-xs"
                                                        placeholder={__('e.g. Utility, Great Dane, Wabash, Fruehauf')}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 w-full">
                                                    <Label className="text-xs font-semibold">{__('Manufacturer Serial No.')}</Label>
                                                    <Input
                                                        value={form.remolque_serie_fabricante}
                                                        onChange={(e) => setForm((prev) => ({ ...prev, remolque_serie_fabricante: e.target.value }))}
                                                        className="w-full h-9 text-xs"
                                                        placeholder={__('Manufacturer serial folio')}
                                                    />
                                                </div>
                                            </div>

                                            {/* Identificación: VIN y Placa de la Caja */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="space-y-1.5 w-full">
                                                    <Label className="text-xs font-semibold">{__('Box VIN (17 characters)')}</Label>
                                                    <Input
                                                        value={form.remolque_vin}
                                                        onChange={(e) => setForm((prev) => ({ ...prev, remolque_vin: e.target.value.toUpperCase() }))}
                                                        className="w-full h-9 text-xs font-mono uppercase"
                                                        placeholder={__('Box plate VIN')}
                                                        maxLength={17}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 w-full">
                                                    <Label className="text-xs font-semibold">{__('Semi-trailer License Plate')} *</Label>
                                                    <Input
                                                        value={form.remolque_placa}
                                                        onChange={(e) => setForm((prev) => ({ ...prev, remolque_placa: e.target.value.toUpperCase() }))}
                                                        className="w-full h-9 text-xs font-mono font-bold uppercase"
                                                        placeholder={__('e.g. 34-TY-8U')}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 w-full">
                                                    <Label className="text-xs font-semibold">{__('Semi-trailer Type')}</Label>
                                                    <Select
                                                        value={form.remolque_tipo}
                                                        onValueChange={(v) => setForm((prev) => ({ ...prev, remolque_tipo: v }))}
                                                    >
                                                        <SelectTrigger className="w-full h-9 text-xs">
                                                            <SelectValue placeholder={__('Semi-trailer Type')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Caja Seca">{__('Dry Box')}</SelectItem>
                                                            <SelectItem value="Caja Refrigerada">{__('Refrigerated Box (Thermo)')}</SelectItem>
                                                            <SelectItem value="Cajas Conservadoras">{__('Preservation Box')}</SelectItem>
                                                            <SelectItem value="Plataforma">{__('Flatbed')}</SelectItem>
                                                            <SelectItem value="Cama Baja">{__('Lowboy')}</SelectItem>
                                                            <SelectItem value="Redilas">{__('Stake')}</SelectItem>
                                                            <SelectItem value="Tanque">{__('Tank')}</SelectItem>
                                                            <SelectItem value="Tolva">{__('Hopper')}</SelectItem>
                                                            <SelectItem value="Portacontenedores">{__('Container Carriers')}</SelectItem>
                                                            <SelectItem value="Volteo">{__('Dump')}</SelectItem>
                                                            <SelectItem value="Jaula">{__('Cage')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Pesos y Dimensiones según Placa */}
                                            <div className="pt-2 border-t space-y-3">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                                                    <Gauge className="w-3.5 h-3.5 text-[#104a29]" />
                                                    {__('Weights and Dimensions (Technical Plate Data)')}
                                                </span>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Length (feet/m)')}</Label>
                                                        <Input
                                                            value={form.remolque_largo}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_largo: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="53', 48', 16.15m"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Width')}</Label>
                                                        <Input
                                                            value={form.remolque_ancho}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_ancho: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="2.60 m"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Height')}</Label>
                                                        <Input
                                                            value={form.remolque_alto}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_alto: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="4.15 m"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('GVWR (kg/lbs)')}</Label>
                                                        <Input
                                                            value={form.remolque_peso_bruto_vehicular}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_peso_bruto_vehicular: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder={__('Gross Vehicle Wt.')}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Tare (kg/lbs)')}</Label>
                                                        <Input
                                                            value={form.remolque_peso_vehicular}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_peso_vehicular: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder={__('Empty weight / Tare')}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Payload')}</Label>
                                                        <Input
                                                            value={form.remolque_capacidad_carga}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_capacidad_carga: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder={__('Load capacity')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tren Rodante y Suspensión */}
                                            <div className="pt-2 border-t space-y-3">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                                                    <Sliders className="w-3.5 h-3.5 text-[#104a29]" />
                                                    {__('Running Gear and Underpass of Semi-trailer')}
                                                </span>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Axles Count')}</Label>
                                                        <Select
                                                            value={String(form.remolque_ejes)}
                                                            onValueChange={(v) => setForm((prev) => ({ ...prev, remolque_ejes: Number(v) }))}
                                                        >
                                                            <SelectTrigger className="w-full h-9 text-xs">
                                                                <SelectValue placeholder={__('Axles')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">{__('1 Axle')}</SelectItem>
                                                                <SelectItem value="2">{__('2 Axles (Tandem)')}</SelectItem>
                                                                <SelectItem value="3">{__('3 Axles (Tridem)')}</SelectItem>
                                                                <SelectItem value="4">{__('4 Axles')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Suspension')}</Label>
                                                        <Select
                                                            value={form.remolque_tipo_suspension}
                                                            onValueChange={(v) => setForm((prev) => ({ ...prev, remolque_tipo_suspension: v }))}
                                                        >
                                                            <SelectTrigger className="w-full h-9 text-xs">
                                                                <SelectValue placeholder={__('Suspension')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Neumática">{__('Pneumatic (Air)')}</SelectItem>
                                                                <SelectItem value="Mecánica">{__('Mechanical (Springs)')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Landing Gear Capacity')}</Label>
                                                        <Input
                                                            value={form.remolque_capacidad_patines}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_capacidad_patines: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="50,000 lbs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Tire Quantity')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={form.remolque_cantidad_llantas}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_cantidad_llantas: Number(e.target.value) }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Tire Size')}</Label>
                                                        <Input
                                                            value={form.remolque_medida_llantas}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_medida_llantas: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="295/75R22.5 / 11R22.5"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 w-full">
                                                        <Label className="text-xs font-medium">{__('Pressure (PSI)')}</Label>
                                                        <Input
                                                            value={form.remolque_presion_llantas}
                                                            onChange={(e) => setForm((prev) => ({ ...prev, remolque_presion_llantas: e.target.value }))}
                                                            className="w-full h-9 text-xs"
                                                            placeholder="100 PSI"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 3: FOTOGRAFÍAS (UNIDAD + PLACA TÉCNICA DE CAJA) ── */}
                            {activeFormTab === 'fotos' && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                                        {__('Upload photos or use the webcam to capture the plates and the manufacturer technical plate of the box.')}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        
                                        {/* Foto 1: Frente Unidad */}
                                        <div className="space-y-2 border p-3 rounded-xl bg-white dark:bg-slate-900">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                                {__('1. Front Photo (Unit / Plate)')}
                                            </span>
                                            <div className="aspect-[1.8/1] rounded-lg border bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                                                {previews.foto_frontal ? (
                                                    <img src={previews.foto_frontal} className="object-contain w-full h-full" alt="Frente" />
                                                ) : (
                                                    <Car className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <label className="flex-1 flex items-center justify-center gap-1 h-8 border border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer">
                                                    <UploadCloud className="w-3.5 h-3.5 text-[#104a29]" />
                                                    <span>{__('Upload')}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'foto_frontal')} />
                                                </label>
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenCamera('foto_frontal')} className="h-8 text-[11px]">
                                                    <Camera className="w-3.5 h-3.5 text-[#104a29]" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Foto 2: Trasera Unidad */}
                                        <div className="space-y-2 border p-3 rounded-xl bg-white dark:bg-slate-900">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                                {__('2. Rear Photo (Unit / Plate)')}
                                            </span>
                                            <div className="aspect-[1.8/1] rounded-lg border bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                                                {previews.foto_trasera ? (
                                                    <img src={previews.foto_trasera} className="object-contain w-full h-full" alt="Trasera" />
                                                ) : (
                                                    <Car className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <label className="flex-1 flex items-center justify-center gap-1 h-8 border border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer">
                                                    <UploadCloud className="w-3.5 h-3.5 text-[#104a29]" />
                                                    <span>{__('Upload')}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'foto_trasera')} />
                                                </label>
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenCamera('foto_trasera')} className="h-8 text-[11px]">
                                                    <Camera className="w-3.5 h-3.5 text-[#104a29]" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Foto 3: Placa Técnica del Semirremolque (NOM-035) */}
                                        <div className={cn('space-y-2 border p-3 rounded-xl bg-white dark:bg-slate-900', !form.tiene_remolque && 'opacity-50 pointer-events-none')}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    {__('3. Box Technical Plate (NOM-035)')}
                                                </span>
                                                <span className="text-[10px] bg-[#104a29]/10 text-[#104a29] px-1.5 py-0.5 rounded font-bold">{__('Required')}</span>
                                            </div>
                                            <div className="aspect-[1.8/1] rounded-lg border bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                                                {previews.remolque_foto_placa ? (
                                                    <img src={previews.remolque_foto_placa} className="object-contain w-full h-full" alt="Placa Técnica" />
                                                ) : (
                                                    <Shield className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <label className="flex-1 flex items-center justify-center gap-1 h-8 border border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer">
                                                    <UploadCloud className="w-3.5 h-3.5 text-[#104a29]" />
                                                    <span>{__('Upload Plate')}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'remolque_foto_placa')} />
                                                </label>
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenCamera('remolque_foto_placa')} className="h-8 text-[11px]">
                                                    <Camera className="w-3.5 h-3.5 text-[#104a29]" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Foto 4: Lateral / Panorámica de la Caja */}
                                        <div className={cn('space-y-2 border p-3 rounded-xl bg-white dark:bg-slate-900', !form.tiene_remolque && 'opacity-50 pointer-events-none')}>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                                                {__('4. Box Side View')}
                                            </span>
                                            <div className="aspect-[1.8/1] rounded-lg border bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
                                                {previews.remolque_foto_lateral ? (
                                                    <img src={previews.remolque_foto_lateral} className="object-contain w-full h-full" alt="Lateral Caja" />
                                                ) : (
                                                    <Container className="w-8 h-8 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <label className="flex-1 flex items-center justify-center gap-1 h-8 border border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold cursor-pointer">
                                                    <UploadCloud className="w-3.5 h-3.5 text-[#104a29]" />
                                                    <span>{__('Upload Box')}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'remolque_foto_lateral')} />
                                                </label>
                                                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenCamera('remolque_foto_lateral')} className="h-8 text-[11px]">
                                                    <Camera className="w-3.5 h-3.5 text-[#104a29]" />
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* Botón de Enviar */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white h-11 text-sm font-semibold flex items-center justify-center gap-2 mt-4 shadow-sm"
                            >
                                {isSubmitting ? (
                                    <span>{__('Saving vehicle record...')}</span>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>{editingVehicle ? __('Update Vehicle and Box') : __('Save Vehicle and Box')}</span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* ── Columna Derecha: Lista / Carrito de Vehículos Registrados (50%) ── */}
                    <div className="lg:col-span-6 flex flex-col min-h-[350px]">
                        
                        {/* Cabecera del Carrito */}
                        <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                    {__('Registered Vehicles')}
                                </span>
                                <span className="bg-[#104a29]/10 text-[#104a29] dark:bg-[#104a29]/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                    {vehicles.length}
                                </span>
                            </div>
                        </div>

                        {/* Lista de Vehículos */}
                        <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                            {isLoadingList ? (
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                                    {__('Loading vehicles list...')}
                                </div>
                            ) : vehicles.length === 0 ? (
                                <div className="h-56 border border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/10">
                                    <Truck className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm font-semibold text-slate-600">{__('No vehicles registered for this supplier.')}</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">
                                        {__('Fill out the form on the left with the technical sheet of the unit and its box to add it to the system.')}
                                    </p>
                                </div>
                            ) : (
                                vehicles.map((veh) => (
                                    <div
                                        key={veh.id}
                                        className={cn(
                                            'p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs flex flex-col gap-3 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
                                            editingVehicle?.id === veh.id && 'border-[#104a29]/60 ring-2 ring-[#104a29]/20 bg-[#104a29]/5'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            
                                            {/* Foto miniatura o ícono */}
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-14 h-14 rounded-xl border bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                                                    {veh.foto_frontal ? (
                                                        <img
                                                            src={`/storage/${veh.foto_frontal}`}
                                                            className="object-cover w-full h-full"
                                                            alt={`${veh.marca}`}
                                                        />
                                                    ) : (
                                                        <Truck className="w-7 h-7 text-[#104a29]" />
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                            {veh.marca} {veh.modelo}
                                                        </h4>
                                                        <span className="text-[11px] font-mono bg-[#104a29]/10 text-[#104a29] px-2 py-0.5 rounded font-bold uppercase" dir="ltr">
                                                            {veh.placa}
                                                        </span>
                                                    </div>

                                                    {/* Meta-badges */}
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                                                            {veh.tipo_vehiculo}
                                                        </span>
                                                        {veh.subtipo_carroceria && (
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                                                {veh.subtipo_carroceria}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {veh.year}
                                                        </span>
                                                        {veh.numero_serie_vin && (
                                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded" dir="ltr">
                                                                VIN: {veh.numero_serie_vin}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewingDocsVehicle(veh)}
                                                    className="h-8 text-xs flex items-center gap-1 px-2.5 border-slate-200 hover:bg-slate-100"
                                                    title={__('View Technical Sheet and Photos')}
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-[#104a29]" />
                                                    <span className="hidden sm:inline">{__('Sheet')}</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(veh)}
                                                    className="h-8 w-8 text-slate-600 hover:text-slate-900"
                                                    title={__('Edit')}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(veh.id)}
                                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                    title={__('Delete')}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Sub-tarjeta de la Caja / Semirremolque si cuenta con ella */}
                                        {veh.tiene_remolque ? (
                                            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Container className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                                    <div>
                                                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                                                            {__('Box')}: {veh.remolque_tipo || __('Semi-trailer')} ({veh.remolque_fabricante || __('Manufacturer N/A')})
                                                        </span>
                                                        <div className="flex flex-wrap gap-2 text-[11px] text-emerald-800/80 dark:text-emerald-300 mt-0.5">
                                                            {veh.remolque_placa && (
                                                                <span className="font-mono font-bold bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.2 rounded border border-emerald-200 text-emerald-900 dark:text-emerald-200" dir="ltr">
                                                                    {__('Plate')}: {veh.remolque_placa}
                                                                </span>
                                                            )}
                                                            {veh.remolque_largo && <span>{__('Length')}: {veh.remolque_largo}</span>}
                                                            {veh.remolque_ejes && <span>• {veh.remolque_ejes} {__('Axles')} ({veh.remolque_tipo_suspension || __('Suspension')})</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Indicador de foto de placa de caja */}
                                                {veh.remolque_foto_placa && (
                                                    <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> {__('Technical Plate')}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-400 italic px-1">
                                                {__('No semi-trailer attached')}
                                            </div>
                                        )}

                                    </div>
                                ))
                            )}
                        </div>

                    </div>

                </div>

            </DialogContent>

            {/* ══ SUB-DIALOG: Ficha Técnica Completa y Visor Lightbox ══ */}
            <Dialog open={viewingDocsVehicle !== null} onOpenChange={(open) => !open && setViewingDocsVehicle(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="flex items-center gap-2 text-lg text-slate-800 dark:text-slate-100">
                            <Truck className="w-5 h-5 text-[#104a29]" />
                            {__('Regulatory Technical Sheet')} - {viewingDocsVehicle?.marca} {viewingDocsVehicle?.modelo} ({viewingDocsVehicle?.placa})
                        </DialogTitle>
                    </DialogHeader>

                    {viewingDocsVehicle && (
                        <div className="space-y-6 mt-4">
                            
                            {/* Resumen Ficha Unidad */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border text-xs">
                                <div>
                                    <span className="text-slate-500 block">{__('Category / Type')}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {viewingDocsVehicle.tipo_vehiculo}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">{__('Bodywork')}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {viewingDocsVehicle.subtipo_carroceria || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">{__('Unit VIN')}</span>
                                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200" dir="ltr">
                                        {viewingDocsVehicle.numero_serie_vin || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">{__('Insurance Policy')}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {viewingDocsVehicle.poliza_seguro ? `${viewingDocsVehicle.aseguradora || ''} (${viewingDocsVehicle.poliza_seguro})` : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Ficha Semirremolque (NOM-035) */}
                            {viewingDocsVehicle.tiene_remolque && (
                                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                                            <Container className="w-4 h-4 text-emerald-600" />
                                            {__('Semi-trailer Plate Specifications (NOM-035-SCT)')}
                                        </h4>
                                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border text-emerald-900" dir="ltr">
                                            {__('Box Plate')}: {viewingDocsVehicle.remolque_placa || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <span className="text-slate-500 block">{__('Manufacturer')}</span>
                                            <span className="font-bold">{viewingDocsVehicle.remolque_fabricante || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">{__('Box VIN')}</span>
                                            <span className="font-bold font-mono" dir="ltr">{viewingDocsVehicle.remolque_vin || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">{__('Dimensions')}</span>
                                            <span className="font-bold" dir="ltr">
                                                {viewingDocsVehicle.remolque_largo || "53'"} × {viewingDocsVehicle.remolque_ancho || '2.60m'} × {viewingDocsVehicle.remolque_alto || '4.15m'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">{__('Running Gear')}</span>
                                            <span className="font-bold">
                                                {viewingDocsVehicle.remolque_ejes || 2} {__('Axles')} • {viewingDocsVehicle.remolque_tipo_suspension || __('Pneumatic (Air)')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Galería de Fotografías */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    {__('Photographic Evidence')}
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    
                                    {/* Frontal */}
                                    <div className="space-y-1.5 text-center">
                                        <span className="text-[11px] font-semibold text-slate-600 block">{__('Front Unit')}</span>
                                        <div className="aspect-[1.3/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
                                            {viewingDocsVehicle.foto_frontal ? (
                                                <img src={`/storage/${viewingDocsVehicle.foto_frontal}`} className="object-contain w-full h-full" alt="Frente" />
                                            ) : <span className="text-xs text-slate-400 italic">{__('No photo')}</span>}
                                        </div>
                                    </div>

                                    {/* Trasera */}
                                    <div className="space-y-1.5 text-center">
                                        <span className="text-[11px] font-semibold text-slate-600 block">{__('Rear Unit')}</span>
                                        <div className="aspect-[1.3/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
                                            {viewingDocsVehicle.foto_trasera ? (
                                                <img src={`/storage/${viewingDocsVehicle.foto_trasera}`} className="object-contain w-full h-full" alt="Trasera" />
                                            ) : <span className="text-xs text-slate-400 italic">{__('No photo')}</span>}
                                        </div>
                                    </div>

                                    {/* Placa Técnica Caja */}
                                    <div className="space-y-1.5 text-center">
                                        <span className="text-[11px] font-semibold text-slate-600 block text-emerald-800 font-bold">{__('Technical Plate (NOM-035)')}</span>
                                        <div className="aspect-[1.3/1] border rounded-xl overflow-hidden bg-emerald-50 flex items-center justify-center shadow-xs">
                                            {viewingDocsVehicle.remolque_foto_placa ? (
                                                <img src={`/storage/${viewingDocsVehicle.remolque_foto_placa}`} className="object-contain w-full h-full" alt="Placa Técnica" />
                                            ) : <span className="text-xs text-slate-400 italic">{__('No photo')}</span>}
                                        </div>
                                    </div>

                                    {/* Vista Lateral Caja */}
                                    <div className="space-y-1.5 text-center">
                                        <span className="text-[11px] font-semibold text-slate-600 block">{__('Box Side')}</span>
                                        <div className="aspect-[1.3/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
                                            {viewingDocsVehicle.remolque_foto_lateral ? (
                                                <img src={`/storage/${viewingDocsVehicle.remolque_foto_lateral}`} className="object-contain w-full h-full" alt="Lateral" />
                                            ) : <span className="text-xs text-slate-400 italic">{__('No photo')}</span>}
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    <div className="flex justify-end mt-6 border-t pt-4">
                        <Button
                            type="button"
                            onClick={() => setViewingDocsVehicle(null)}
                            className="bg-slate-800 text-white hover:bg-slate-700 h-9 px-5 text-xs font-semibold"
                        >
                            {__('Close')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ══ SUB-DIALOG: Captura de Foto con Cámara Web ══ */}
            <Dialog open={isCameraOpen} onOpenChange={(open) => !open && handleCloseCamera()}>
                <DialogContent className="max-w-md p-6 flex flex-col items-center">
                    <DialogHeader className="w-full border-b pb-3 mb-4">
                        <DialogTitle className="flex items-center gap-2 text-md">
                            <Camera className="w-5 h-5 text-[#104a29]" />
                            {activeCameraField === 'remolque_foto_placa'
                                ? __('Capture Technical Plate NOM-035')
                                : activeCameraField === 'remolque_foto_lateral'
                                ? __('Capture Box View')
                                : activeCameraField === 'foto_frontal'
                                ? __('Capture Front Photo')
                                : __('Capture Rear Photo')}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Live Stream View */}
                    <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex justify-between w-full mt-5 gap-3 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseCamera}
                            className="h-9 px-4 text-xs"
                        >
                            {__('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCapturePhoto}
                            className="bg-[#104a29] hover:bg-[#0c371e] text-white h-9 px-6 text-xs font-semibold flex items-center gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            {__('Capture')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
