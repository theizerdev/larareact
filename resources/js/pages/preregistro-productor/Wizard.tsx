import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Sprout, 
    Building2, 
    Users, 
    Car, 
    CheckCircle, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    MapPin,
    Phone,
    ShieldAlert, 
    Camera as CameraIcon,
    IdCard,
    Globe,
    Check,
    RefreshCw,
    Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PhoneInputGroup from '../admin/Empresas/Partials/PhoneInputGroup';
import MapboxMap, { MapAddressDetails } from '@/components/mapbox-map';
import { cn } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
    codigo_telefonico: string;
    latitud?: number;
    longitud?: number;
}

interface PreRegistroProps {
    preRegistro: {
        id: number;
        razon_social_rancho: string;
        nombre_comercial_rancho: string;
        pais_telefono_id: number;
        telefono: string;
        token: string;
        empresa_id: number;
    };
    paises: Pais[];
    mapbox_api_key?: string | null;
    mapbox_active?: boolean;
}

interface EmpleadoForm {
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    genero: string;
    fecha_nacimiento: string;
    correo: string;
    cargo: string;
    foto_carnet: string;
    documento_frontal: string;
    documento_reverso: string;
}

interface VehiculoForm {
    tipo_vehiculo: string;
    marca: string;
    modelo: string;
    year: string;
    placa: string;
    foto_frontal: string;
    foto_trasera: string;
}

export default function Wizard({ preRegistro, paises, mapbox_api_key, mapbox_active }: PreRegistroProps) {
    const { __ } = useTranslate();
    const [step, setStep] = useState(1);
    const [step1SubTab, setStep1SubTab] = useState('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Camera capture state
    type PhotoTarget = 'foto' | 'frontal' | 'reverso' | 'veh_frontal' | 'veh_trasera';
    const [cameraState, setCameraState] = useState<{ empIndex: number; target: PhotoTarget } | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setCameraState(null);
    };

    const startCamera = async (empIndex: number, target: PhotoTarget, mode?: 'user' | 'environment') => {
        stopCamera();
        const selectedMode = mode || (target === 'foto' ? 'user' : 'environment');
        setFacingMode(selectedMode);
        setCameraState({ empIndex, target });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: selectedMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Error starting camera:', err);
            setErrorMsg(__('No se pudo acceder a la cámara. Por favor otorgue permisos.'));
            setCameraState(null);
        }
    };

    useEffect(() => {
        if (cameraState && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraState]);

    const capturePhoto = () => {
        if (!videoRef.current || !cameraState) return;

        const video = videoRef.current;
        const vWidth = video.videoWidth || 640;
        const vHeight = video.videoHeight || 480;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (cameraState.target === 'foto') {
            // Crop to vertical Carnet ID portrait (3:4 aspect ratio)
            const cropWidth = Math.min(vWidth, Math.floor(vHeight * 0.75));
            const cropHeight = Math.floor(cropWidth / 0.75);
            const startX = Math.floor((vWidth - cropWidth) / 2);
            const startY = Math.floor((vHeight - cropHeight) / 2);

            canvas.width = 480;
            canvas.height = 640;
            if (ctx) {
                ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, 480, 640);
            }
        } else {
            canvas.width = vWidth;
            canvas.height = vHeight;
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        if (cameraState.target === 'veh_frontal') {
            const newVehs = [...vehiculos];
            newVehs[cameraState.empIndex].foto_frontal = dataUrl;
            setVehiculos(newVehs);
        } else if (cameraState.target === 'veh_trasera') {
            const newVehs = [...vehiculos];
            newVehs[cameraState.empIndex].foto_trasera = dataUrl;
            setVehiculos(newVehs);
        } else {
            const newEmps = [...empleados];
            if (cameraState.target === 'foto') {
                newEmps[cameraState.empIndex].foto_carnet = dataUrl;
            } else if (cameraState.target === 'frontal') {
                newEmps[cameraState.empIndex].documento_frontal = dataUrl;
            } else if (cameraState.target === 'reverso') {
                newEmps[cameraState.empIndex].documento_reverso = dataUrl;
            }
            setEmpleados(newEmps);
        }
        stopCamera();
    };

    // Step 1: Producer & Rancho Data
    const [productorData, setProductorData] = useState({
        razon_social: '',
        nombre_comercial: '',
        documento_identidad: '',
        razon_social_rancho: preRegistro.razon_social_rancho || '',
        nombre_comercial_rancho: preRegistro.nombre_comercial_rancho || '',
        pais_telefono_id: preRegistro.pais_telefono_id ? String(preRegistro.pais_telefono_id) : (paises[0]?.id ? String(paises[0].id) : ''),
        telefono: preRegistro.telefono || '',
        responsable: '',
        direccion: '',
        codigo_postal: '',
        estado: '',
        pais_id: paises[0]?.id ? String(paises[0].id) : '',
        latitud: 19.9868 as number | null,
        longitud: -102.2839 as number | null,
    });

    // Step 2: Employees list
    const [empleados, setEmpleados] = useState<EmpleadoForm[]>([
        {
            nombres: '',
            apellidos: '',
            documento_identidad: '',
            genero: '',
            fecha_nacimiento: '',
            correo: '',
            cargo: '',
            foto_carnet: '',
            documento_frontal: '',
            documento_reverso: '',
        }
    ]);

    // Step 3: Vehicles list
    const [vehiculos, setVehiculos] = useState<VehiculoForm[]>([]);

    // Helper for base64 file reading
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                callback(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Add employee
    const addEmpleado = () => {
        setEmpleados([
            ...empleados,
            {
                nombres: '',
                apellidos: '',
                documento_identidad: '',
                genero: '',
                fecha_nacimiento: '',
                correo: '',
                cargo: '',
                foto_carnet: '',
                documento_frontal: '',
                documento_reverso: '',
            }
        ]);
    };

    // Remove employee
    const removeEmpleado = (index: number) => {
        if (empleados.length === 1) return;
        setEmpleados(empleados.filter((_, i) => i !== index));
    };

    // Add vehicle
    const addVehiculo = () => {
        setVehiculos([
            ...vehiculos,
            {
                tipo_vehiculo: '',
                marca: '',
                modelo: '',
                year: String(new Date().getFullYear()),
                placa: '',
                foto_frontal: '',
                foto_trasera: '',
            }
        ]);
    };

    // Remove vehicle
    const removeVehiculo = (index: number) => {
        setVehiculos(vehiculos.filter((_, i) => i !== index));
    };

    // Validation per step
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        const rSocial = (productorData.razon_social_rancho || productorData.razon_social || '').trim();
        const nComercial = (productorData.nombre_comercial_rancho || productorData.nombre_comercial || '').trim();
        const rfc = (productorData.documento_identidad || '').trim();

        if (!rSocial) newErrors.razon_social_rancho = __('La razón social del rancho es requerida');
        if (!nComercial) newErrors.nombre_comercial_rancho = __('El nombre comercial del rancho es requerido');
        if (!rfc) newErrors.documento_identidad = __('El RFC es requerido');

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setErrorMsg(__('Por favor complete los campos obligatorios del rancho (*) para continuar.'));
            if (newErrors.razon_social_rancho || newErrors.nombre_comercial_rancho || newErrors.documento_identidad) {
                setStep1SubTab('general');
            }
            return false;
        }

        setErrorMsg(null);
        setProductorData(prev => ({
            ...prev,
            razon_social: rSocial,
            nombre_comercial: nComercial,
            razon_social_rancho: rSocial,
            nombre_comercial_rancho: nComercial,
        }));
        return true;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        empleados.forEach((emp, i) => {
            if (!emp.nombres?.trim()) newErrors[`emp_${i}_nombres`] = __('Nombres del colaborador requeridos');
            if (!emp.apellidos?.trim()) newErrors[`emp_${i}_apellidos`] = __('Apellidos del colaborador requeridos');
            if (!emp.documento_identidad?.trim()) newErrors[`emp_${i}_doc`] = __('Documento de identidad requerido');
        });
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            setErrorMsg(__('Por favor complete la información requerida de los colaboradores (*) para continuar.'));
            return false;
        }

        setErrorMsg(null);
        return true;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2);
        } else if (step === 2) {
            if (validateStep2()) setStep(3);
        }
    };

    // Submit wizard
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const payload = {
                ...productorData,
                empleados,
                vehiculos,
            };

            const response = await fetch(`/preregistro-productor/${preRegistro.token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                setIsSuccess(true);
            } else {
                setErrorMsg(data.message || __('Error completing registration. Please review the details.'));
            }
        } catch (e) {
            setErrorMsg(__('A network error occurred. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans">
            <Head title={__('Producer Pre-Registration')} />

            {/* Top Bar Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
                            <Sprout className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {__('Producer Pre-Registration')}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {preRegistro.nombre_comercial_rancho || __('Rancho Portal')}
                            </p>
                        </div>
                    </div>
                    <LanguageToggle />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-4xl w-full mx-auto p-4 md:p-6 flex-1 my-4">
                {isSuccess ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-lg mx-auto shadow-xl space-y-4 my-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {__('Registration Complete!')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {__('Your producer and rancho information has been submitted successfully. Status is currently Under Review. You will receive a WhatsApp message once activated.')}
                        </p>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                {__('Thank you for completing your pre-registration.')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        {/* Stepper Header */}
                        <div className="bg-slate-900 text-white p-6 md:p-8">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold max-w-xl mx-auto">
                                <div className={cn("py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2", step === 1 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400")}>
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                                    <span className="hidden sm:inline">{__('Rancho y Ubicación')}</span>
                                </div>
                                <div className={cn("py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2", step === 2 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400")}>
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                                    <span className="hidden sm:inline">{__('Colaboradores')}</span>
                                </div>
                                <div className={cn("py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2", step === 3 ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400")}>
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span>
                                    <span className="hidden sm:inline">{__('Vehículos')}</span>
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="m-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
                                <ShieldAlert className="h-5 w-5 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Step 1: Producer & Rancho Details with Tabs */}
                        {step === 1 && (
                            <div className="p-6 md:p-8 space-y-6">
                                <Tabs value={step1SubTab} onValueChange={setStep1SubTab} className="w-full">
                                    <TabsList className="grid grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                        <TabsTrigger value="general" className="py-2.5 font-medium text-sm gap-2">
                                            <Building2 className="h-4 w-4" />
                                            {__('Datos del Rancho')}
                                        </TabsTrigger>
                                        <TabsTrigger value="location" className="py-2.5 font-medium text-sm gap-2">
                                            <MapPin className="h-4 w-4" />
                                            {__('Ubicación y Dirección')}
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Sub-tab 1: Datos del Rancho */}
                                    <TabsContent value="general" className="space-y-6">
                                        <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-emerald-600" />
                                                {__('Información del Rancho')}
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <Label htmlFor="razon_social_rancho">{__('Razón Social del Rancho')} *</Label>
                                                    <Input 
                                                        id="razon_social_rancho"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. Agrícola Los Pinos S.A. de C.V."
                                                        value={productorData.razon_social_rancho}
                                                        onChange={(e) => setProductorData({ 
                                                            ...productorData, 
                                                            razon_social_rancho: e.target.value,
                                                            razon_social: e.target.value
                                                        })}
                                                    />
                                                    {errors.razon_social_rancho && <p className="text-xs text-red-500 mt-1">{errors.razon_social_rancho}</p>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="nombre_comercial_rancho">{__('Nombre Comercial del Rancho')} *</Label>
                                                    <Input 
                                                        id="nombre_comercial_rancho"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. Rancho Los Pinos"
                                                        value={productorData.nombre_comercial_rancho}
                                                        onChange={(e) => setProductorData({ 
                                                            ...productorData, 
                                                            nombre_comercial_rancho: e.target.value,
                                                            nombre_comercial: e.target.value
                                                        })}
                                                    />
                                                    {errors.nombre_comercial_rancho && <p className="text-xs text-red-500 mt-1">{errors.nombre_comercial_rancho}</p>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="documento_identidad">{__('RFC (Registro Federal de Contribuyentes)')} *</Label>
                                                    <Input 
                                                        id="documento_identidad"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. ABC123456789"
                                                        value={productorData.documento_identidad}
                                                        onChange={(e) => setProductorData({ ...productorData, documento_identidad: e.target.value })}
                                                    />
                                                    {errors.documento_identidad && <p className="text-xs text-red-500 mt-1">{errors.documento_identidad}</p>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="responsable">{__('Persona Responsable / Contacto')} *</Label>
                                                    <Input 
                                                        id="responsable"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. Juan Pérez"
                                                        value={productorData.responsable}
                                                        onChange={(e) => setProductorData({ ...productorData, responsable: e.target.value })}
                                                    />
                                                    {errors.responsable && <p className="text-xs text-red-500 mt-1">{errors.responsable}</p>}
                                                </div>

                                                <div>
                                                    <Label>{__('Teléfono de Contacto (WhatsApp)')} *</Label>
                                                    <div className="mt-1.5 w-full">
                                                        <PhoneInputGroup
                                                            paises={paises}
                                                            selectedPaisId={productorData.pais_telefono_id}
                                                            phoneValue={productorData.telefono}
                                                            onPaisChange={(id) => setProductorData({ ...productorData, pais_telefono_id: String(id) })}
                                                            onPhoneChange={(phone) => setProductorData({ ...productorData, telefono: phone })}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Sub-tab 2: Ubicación y Dirección */}
                                    <TabsContent value="location" className="space-y-6">
                                        <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                                            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-emerald-600" />
                                                {__('Ubicación y Dirección del Rancho')}
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <Label htmlFor="pais_id">{__('País')} *</Label>
                                                    <Select value={productorData.pais_id} onValueChange={(val) => setProductorData({ ...productorData, pais_id: val })}>
                                                        <SelectTrigger id="pais_id" className="mt-1.5 w-full">
                                                            <SelectValue placeholder={__('Seleccionar país')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {paises.map((p) => (
                                                                <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="estado">{__('Estado')}</Label>
                                                    <Input 
                                                        id="estado"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. Michoacán, Jalisco"
                                                        value={productorData.estado}
                                                        onChange={(e) => setProductorData({ ...productorData, estado: e.target.value })}
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="codigo_postal">{__('Código Postal')}</Label>
                                                    <Input 
                                                        id="codigo_postal"
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. 59600"
                                                        value={productorData.codigo_postal}
                                                        onChange={(e) => setProductorData({ ...productorData, codigo_postal: e.target.value })}
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <Label htmlFor="direccion">{__('Dirección Completa del Rancho')}</Label>
                                                    <Textarea 
                                                        id="direccion"
                                                        rows={2}
                                                        className="mt-1.5 w-full"
                                                        placeholder="ej. Carretera Zamora-Jacona Km 3"
                                                        value={productorData.direccion}
                                                        onChange={(e) => setProductorData({ ...productorData, direccion: e.target.value })}
                                                    />
                                                </div>

                                                {/* Map Interactive with Reverse Geocoding */}
                                                <div className="md:col-span-2 space-y-2 pt-2">
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                                        {__('Haga clic o arrastre el marcador en el mapa para obtener automáticamente código postal, estado y dirección.')}
                                                    </p>

                                                    <MapboxMap
                                                        lat={productorData.latitud || 19.9868}
                                                        lng={productorData.longitud || -102.2839}
                                                        zoom={10}
                                                        onChange={(lat, lng, details?: MapAddressDetails) => {
                                                            setProductorData((prev) => ({
                                                                ...prev,
                                                                latitud: lat,
                                                                longitud: lng,
                                                                ...(details?.codigo_postal ? { codigo_postal: details.codigo_postal } : {}),
                                                                ...(details?.estado ? { estado: details.estado } : {}),
                                                                ...(details?.direccion ? { direccion: details.direccion } : {}),
                                                            }));
                                                        }}
                                                        className="h-64 rounded-xl border"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}

                        {/* Step 2: Collaborators */}
                        {step === 2 && (
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Users className="h-5 w-5 text-emerald-600" />
                                            {__('Collaborators & Employees')}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {__('Register all personnel who will be accessing facilities.')}
                                        </p>
                                    </div>
                                    <Button onClick={addEmpleado} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Plus className="h-4 w-4" />
                                        {__('Add Collaborator')}
                                    </Button>
                                </div>

                                <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
                                    {empleados.map((emp, index) => (
                                        <div key={index} className={cn("pt-6 space-y-4", index === 0 && "pt-0")}>
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {__('Collaborator')} #{index + 1}
                                                </h4>
                                                {empleados.length > 1 && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeEmpleado(index)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <Label>{__('Nombres')} *</Label>
                                                    <Input 
                                                        className="mt-1.5 w-full"
                                                        value={emp.nombres}
                                                        onChange={(e) => {
                                                            const newEmps = [...empleados];
                                                            newEmps[index].nombres = e.target.value;
                                                            setEmpleados(newEmps);
                                                        }}
                                                    />
                                                    {errors[`emp_${index}_nombres`] && <p className="text-xs text-red-500 mt-1">{errors[`emp_${index}_nombres`]}</p>}
                                                </div>
                                                <div>
                                                    <Label>{__('Apellidos')} *</Label>
                                                    <Input 
                                                        className="mt-1.5 w-full"
                                                        value={emp.apellidos}
                                                        onChange={(e) => {
                                                            const newEmps = [...empleados];
                                                            newEmps[index].apellidos = e.target.value;
                                                            setEmpleados(newEmps);
                                                        }}
                                                    />
                                                    {errors[`emp_${index}_apellidos`] && <p className="text-xs text-red-500 mt-1">{errors[`emp_${index}_apellidos`]}</p>}
                                                </div>
                                                <div>
                                                    <Label>{__('Documento de Identidad / RFC')} *</Label>
                                                    <Input 
                                                        className="mt-1.5 w-full"
                                                        value={emp.documento_identidad}
                                                        onChange={(e) => {
                                                            const newEmps = [...empleados];
                                                            newEmps[index].documento_identidad = e.target.value;
                                                            setEmpleados(newEmps);
                                                        }}
                                                    />
                                                    {errors[`emp_${index}_doc`] && <p className="text-xs text-red-500 mt-1">{errors[`emp_${index}_doc`]}</p>}
                                                </div>
                                                <div>
                                                    <Label>{__('Cargo / Puesto')}</Label>
                                                    <Input 
                                                        className="mt-1.5 w-full"
                                                        value={emp.cargo}
                                                        onChange={(e) => {
                                                            const newEmps = [...empleados];
                                                            newEmps[index].cargo = e.target.value;
                                                            setEmpleados(newEmps);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>{__('Fecha de Nacimiento')}</Label>
                                                    <Input 
                                                        type="date"
                                                        className="mt-1.5 w-full"
                                                        value={emp.fecha_nacimiento}
                                                        onChange={(e) => {
                                                            const newEmps = [...empleados];
                                                            newEmps[index].fecha_nacimiento = e.target.value;
                                                            setEmpleados(newEmps);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>{__('Género')}</Label>
                                                    <Select value={emp.genero} onValueChange={(val) => {
                                                        const newEmps = [...empleados];
                                                        newEmps[index].genero = val;
                                                        setEmpleados(newEmps);
                                                    }}>
                                                        <SelectTrigger className="mt-1.5 w-full">
                                                            <SelectValue placeholder={__('Seleccionar género')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="masculino">{__('Masculino')}</SelectItem>
                                                            <SelectItem value="femenino">{__('Femenino')}</SelectItem>
                                                            <SelectItem value="otro">{__('Otro')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Photo Upload Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                                {/* 1. Foto del Colaborador */}
                                                <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                                    <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                                        {__('Foto del Colaborador')}
                                                    </Label>
                                                    
                                                    {emp.foto_carnet ? (
                                                        <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-32 flex items-center justify-center">
                                                            <img src={emp.foto_carnet} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEmps = [...empleados];
                                                                    newEmps[index].foto_carnet = '';
                                                                    setEmpleados(newEmps);
                                                                }}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                                            <CameraIcon className="h-6 w-6 mb-1 text-slate-400" />
                                                            <span className="text-xs">{__('Sin fotografía')}</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8"
                                                            onClick={() => startCamera(index, 'foto')}
                                                        >
                                                            <CameraIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                            {__('Cámara')}
                                                        </Button>

                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            id={`emp_foto_${index}`} 
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, (base64) => {
                                                                const newEmps = [...empleados];
                                                                newEmps[index].foto_carnet = base64;
                                                                setEmpleados(newEmps);
                                                            })}
                                                        />
                                                        <label
                                                            htmlFor={`emp_foto_${index}`}
                                                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                                        >
                                                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                                                            {__('Subir')}
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* 2. Documento Frente */}
                                                <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                                    <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                                        {__('Documento Frente')}
                                                    </Label>
                                                    
                                                    {emp.documento_frontal ? (
                                                        <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-32 flex items-center justify-center">
                                                            <img src={emp.documento_frontal} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEmps = [...empleados];
                                                                    newEmps[index].documento_frontal = '';
                                                                    setEmpleados(newEmps);
                                                                }}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                                            <IdCard className="h-6 w-6 mb-1 text-slate-400" />
                                                            <span className="text-xs">{__('Sin documento frente')}</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8"
                                                            onClick={() => startCamera(index, 'frontal')}
                                                        >
                                                            <CameraIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                            {__('Cámara')}
                                                        </Button>

                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            id={`emp_front_${index}`} 
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, (base64) => {
                                                                const newEmps = [...empleados];
                                                                newEmps[index].documento_frontal = base64;
                                                                setEmpleados(newEmps);
                                                            })}
                                                        />
                                                        <label
                                                            htmlFor={`emp_front_${index}`}
                                                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                                        >
                                                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                                                            {__('Subir')}
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* 3. Documento Reverso */}
                                                <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                                    <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                                        {__('Documento Reverso')}
                                                    </Label>
                                                    
                                                    {emp.documento_reverso ? (
                                                        <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-32 flex items-center justify-center">
                                                            <img src={emp.documento_reverso} alt="" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newEmps = [...empleados];
                                                                    newEmps[index].documento_reverso = '';
                                                                    setEmpleados(newEmps);
                                                                }}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                                            <IdCard className="h-6 w-6 mb-1 text-slate-400" />
                                                            <span className="text-xs">{__('Sin documento reverso')}</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs gap-1 h-8"
                                                            onClick={() => startCamera(index, 'reverso')}
                                                        >
                                                            <CameraIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                            {__('Cámara')}
                                                        </Button>

                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            id={`emp_rev_${index}`} 
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, (base64) => {
                                                                const newEmps = [...empleados];
                                                                newEmps[index].documento_reverso = base64;
                                                                setEmpleados(newEmps);
                                                            })}
                                                        />
                                                        <label
                                                            htmlFor={`emp_rev_${index}`}
                                                            className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                                        >
                                                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                                                            {__('Subir')}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Vehicles */}
                        {step === 3 && (
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Car className="h-5 w-5 text-emerald-600" />
                                            {__('Producer Vehicles (Optional)')}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {__('Register vehicles used to access facilities.')}
                                        </p>
                                    </div>
                                    <Button onClick={addVehiculo} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                        <Plus className="h-4 w-4" />
                                        {__('Add Vehicle')}
                                    </Button>
                                </div>

                                {vehiculos.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl p-8">
                                        <Car className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold">{__('No vehicles added')}</p>
                                        <p className="text-xs mt-1 text-slate-400">{__('Click "Add Vehicle" if your personnel will be arriving in vehicles.')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
                                        {vehiculos.map((veh, index) => (
                                            <div key={index} className={cn("pt-6 space-y-4", index === 0 && "pt-0")}>
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {__('Vehicle')} #{index + 1}
                                                    </h4>
                                                    <Button variant="ghost" size="sm" onClick={() => removeVehiculo(index)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label>{__('Tipo de Vehículo')} *</Label>
                                                        <Select 
                                                            value={veh.tipo_vehiculo} 
                                                            onValueChange={(val) => {
                                                                const newVehs = [...vehiculos];
                                                                newVehs[index].tipo_vehiculo = val;
                                                                setVehiculos(newVehs);
                                                            }}
                                                        >
                                                            <SelectTrigger className="mt-1.5 w-full">
                                                                <SelectValue placeholder={__('Seleccionar tipo de vehículo')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="sedan">{__('Sedan')}</SelectItem>
                                                                <SelectItem value="suv">{__('SUV')}</SelectItem>
                                                                <SelectItem value="pickup">{__('Pick-up / Camioneta')}</SelectItem>
                                                                <SelectItem value="camion">{__('Camión')}</SelectItem>
                                                                <SelectItem value="furgon">{__('Furgón / Van')}</SelectItem>
                                                                <SelectItem value="motocicleta">{__('Motocicleta')}</SelectItem>
                                                                <SelectItem value="otro">{__('Otro')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label>{__('Marca')} *</Label>
                                                        <Input 
                                                            className="mt-1.5 w-full"
                                                            placeholder="ej. Ford, Toyota"
                                                            value={veh.marca}
                                                            onChange={(e) => {
                                                                const newVehs = [...vehiculos];
                                                                newVehs[index].marca = e.target.value;
                                                                setVehiculos(newVehs);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>{__('Modelo')} *</Label>
                                                        <Input 
                                                            className="mt-1.5 w-full"
                                                            placeholder="ej. Hilux, F-150"
                                                            value={veh.modelo}
                                                            onChange={(e) => {
                                                                const newVehs = [...vehiculos];
                                                                newVehs[index].modelo = e.target.value;
                                                                setVehiculos(newVehs);
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>{__('Año')} *</Label>
                                                        <Input 
                                                            type="number"
                                                            className="mt-1.5 w-full"
                                                            value={veh.year}
                                                            onChange={(e) => {
                                                                const newVehs = [...vehiculos];
                                                                newVehs[index].year = e.target.value;
                                                                setVehiculos(newVehs);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label>{__('Placa / Matrícula')} *</Label>
                                                        <Input 
                                                            className="mt-1.5 w-full"
                                                            placeholder="ej. ABC-123"
                                                            value={veh.placa}
                                                            onChange={(e) => {
                                                                const newVehs = [...vehiculos];
                                                                newVehs[index].placa = e.target.value;
                                                                setVehiculos(newVehs);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Vehicle Photos */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                    {/* 1. Foto Frontal */}
                                                    <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                                        <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                                            {__('Foto Frontal del Vehículo')}
                                                        </Label>
                                                        
                                                        {veh.foto_frontal ? (
                                                            <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-32 flex items-center justify-center">
                                                                <img src={veh.foto_frontal} alt="" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newVehs = [...vehiculos];
                                                                        newVehs[index].foto_frontal = '';
                                                                        setVehiculos(newVehs);
                                                                    }}
                                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                                                <CameraIcon className="h-6 w-6 mb-1 text-slate-400" />
                                                                <span className="text-xs">{__('Sin foto frontal')}</span>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs gap-1 h-8"
                                                                onClick={() => startCamera(index, 'veh_frontal')}
                                                            >
                                                                <CameraIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                                {__('Cámara')}
                                                            </Button>

                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                id={`veh_front_${index}`} 
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, (base64) => {
                                                                    const newVehs = [...vehiculos];
                                                                    newVehs[index].foto_frontal = base64;
                                                                    setVehiculos(newVehs);
                                                                })}
                                                            />
                                                            <label
                                                                htmlFor={`veh_front_${index}`}
                                                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                                            >
                                                                <Upload className="h-3.5 w-3.5 text-blue-600" />
                                                                {__('Subir')}
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* 2. Foto Trasera */}
                                                    <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                                        <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                                            {__('Foto Trasera del Vehículo')}
                                                        </Label>
                                                        
                                                        {veh.foto_trasera ? (
                                                            <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-32 flex items-center justify-center">
                                                                <img src={veh.foto_trasera} alt="" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newVehs = [...vehiculos];
                                                                        newVehs[index].foto_trasera = '';
                                                                        setVehiculos(newVehs);
                                                                    }}
                                                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                                                <CameraIcon className="h-6 w-6 mb-1 text-slate-400" />
                                                                <span className="text-xs">{__('Sin foto trasera')}</span>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs gap-1 h-8"
                                                                onClick={() => startCamera(index, 'veh_trasera')}
                                                            >
                                                                <CameraIcon className="h-3.5 w-3.5 text-emerald-600" />
                                                                {__('Cámara')}
                                                            </Button>

                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                id={`veh_rear_${index}`} 
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(e, (base64) => {
                                                                    const newVehs = [...vehiculos];
                                                                    newVehs[index].foto_trasera = base64;
                                                                    setVehiculos(newVehs);
                                                                })}
                                                            />
                                                            <label
                                                                htmlFor={`veh_rear_${index}`}
                                                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                                            >
                                                                <Upload className="h-3.5 w-3.5 text-blue-600" />
                                                                {__('Subir')}
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stepper Footer Nav */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            {step > 1 ? (
                                <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                                    <ChevronLeft className="h-4 w-4" />
                                    {__('Paso Anterior')}
                                </Button>
                            ) : <div />}

                            {step < 3 ? (
                                <Button onClick={handleNext} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {__('Siguiente Paso')}
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isSubmitting ? __('Enviando...') : __('Completar Registro')}
                                    <Check className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal: Live Webcam Capture */}
            <Dialog open={!!cameraState} onOpenChange={(open) => { if (!open) stopCamera(); }}>
                <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CameraIcon className="h-5 w-5 text-emerald-600" />
                            {cameraState?.target === 'foto'
                                ? __('Tomar Foto del Colaborador')
                                : cameraState?.target === 'frontal'
                                ? __('Tomar Foto Documento Frente')
                                : __('Tomar Foto Documento Reverso')}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center my-2">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        
                        {/* Carnet / ID Overlay Frame for Employee Portrait Photo */}
                        {cameraState?.target === 'foto' ? (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                                <div className="relative w-48 h-60 md:w-56 md:h-68 border-2 border-emerald-400 border-dashed rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-400/60 mb-2 mt-3" />
                                    <div className="w-32 h-16 rounded-t-full border-2 border-b-0 border-dashed border-emerald-400/60" />
                                    
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                                </div>

                                <div className="mt-2.5 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] rounded-full border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                                    <IdCard className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>{__('Alinee el rostro del colaborador dentro del recuadro carnet')}</span>
                                </div>
                            </div>
                        ) : (
                            /* Document Frame Guide for Front/Rear or Vehicle */
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                                <div className="relative w-80 h-52 md:w-96 md:h-60 border-2 border-emerald-400 border-dashed rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                                </div>

                                <div className="mt-2.5 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-[11px] rounded-full border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                                    <IdCard className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>{__('Coloque el objeto dentro del recuadro')}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white border-0 gap-1.5 text-xs"
                            onClick={() => {
                                if (cameraState) {
                                    startCamera(cameraState.empIndex, cameraState.target, facingMode === 'user' ? 'environment' : 'user');
                                }
                            }}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {__('Cambiar Cámara')}
                        </Button>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={stopCamera}>
                            {__('Cancelar')}
                        </Button>
                        <Button type="button" onClick={capturePhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <CameraIcon className="h-4 w-4" />
                            {__('Capturar Foto')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
                &copy; {new Date().getFullYear()} Driscolls App. {__('All rights reserved.')}
            </footer>
        </div>
    );
}

Wizard.layout = (page: React.ReactNode) => page;
