import React, { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Building2, 
    Users, 
    Car, 
    CheckCircle, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    Image as ImageIcon, 
    ShieldAlert, 
    Navigation,
    User as UserIcon,
    AlertTriangle,
    Eye,
    Globe,
    FileText,
    Check,
    Camera as CameraIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PhoneInputGroup from '../admin/Empresas/Partials/PhoneInputGroup';
import { cn } from '@/lib/utils';
import { useTranslate } from '@/hooks/use-translate';
import LanguageToggle from '@/components/language-toggle';

// Lazy load MapComponent
const ProveedorMapComponent = lazy(() => {
    return import('../admin/Empresas/Partials/MapComponent').then((mod) => ({ default: mod.default }));
});

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
        nombre_comercial: string;
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form errors state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Step 1: Provider Data
    const [providerData, setProviderData] = useState({
        razon_social: '',
        nombre_comercial: preRegistro.nombre_comercial,
        documento_identidad: '',
        responsable: '',
        direccion: '',
        pais_telefono_id: preRegistro.pais_telefono_id,
        telefono: preRegistro.telefono,
        pais_id: String(paises[0]?.id || ''),
        latitud: '' as any,
        longitud: '' as any,
    });

    // Step 2: Employees List & Adding state
    const [employees, setEmployees] = useState<EmpleadoForm[]>([]);
    const [showEmployeeForm, setShowEmployeeForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState<EmpleadoForm>({
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
    });

    // Step 3: Vehicles List & Adding state
    const [vehicles, setVehicles] = useState<VehiculoForm[]>([]);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [newVehicle, setNewVehicle] = useState<VehiculoForm>({
        tipo_vehiculo: '',
        marca: '',
        modelo: '',
        year: '',
        placa: '',
        foto_frontal: '',
        foto_trasera: '',
    });

    // Coordinates setup for the Map
    const [mapCenter, setMapCenter] = useState<[number, number]>([19.4326, -99.1332]);
    const [mapZoom, setMapZoom] = useState(12);

    // Camera States
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<{ type: 'employee' | 'vehicle', fieldName: string } | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert(__('Unable to access camera. Please check camera permissions.'));
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const handleOpenCamera = (type: 'employee' | 'vehicle', fieldName: string) => {
        setActiveCameraField({ type, fieldName });
        setIsCameraOpen(true);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                if (activeCameraField) {
                    const { type, fieldName } = activeCameraField;
                    if (type === 'employee') {
                        setNewEmployee(prev => ({ ...prev, [fieldName]: dataUrl }));
                    } else if (type === 'vehicle') {
                        setNewVehicle(prev => ({ ...prev, [fieldName]: dataUrl }));
                    }
                }
                stopCamera();
                setIsCameraOpen(false);
            }
        }
    };

    useEffect(() => {
        if (isCameraOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCameraOpen]);

    const handlePaisChange = (val: string) => {
        setProviderData(prev => ({ ...prev, pais_id: val }));
        
        const selectedPais = paises.find(p => p.id === Number(val));
        if (selectedPais && selectedPais.latitud !== undefined && selectedPais.longitud !== undefined) {
            const lat = Number(selectedPais.latitud);
            const lng = Number(selectedPais.longitud);
            setProviderData(prev => ({
                ...prev,
                latitud: lat,
                longitud: lng
            }));
            setMapCenter([lat, lng]);
            setMapZoom(5);
        }
    };

    // Helper to convert File to base64
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'employee' | 'vehicle') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert(__('The image must not exceed 2MB.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            if (type === 'employee') {
                setNewEmployee(prev => ({ ...prev, [fieldName]: base64 }));
            } else {
                setNewVehicle(prev => ({ ...prev, [fieldName]: base64 }));
            }
        };
    };

    const handleLocationSelected = async (lat: number, lng: number, address?: string) => {
        setProviderData(prev => ({
            ...prev,
            latitud: lat,
            longitud: lng,
            ...(address ? { direccion: address } : {})
        }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`);
            if (res.ok) {
                const result = await res.json();
                const countryCode = result.address?.country_code?.toUpperCase();
                if (countryCode) {
                    const matchedPais = paises.find(p => p.codigo_iso2.toUpperCase() === countryCode);
                    if (matchedPais) {
                        setProviderData(prev => ({
                            ...prev,
                            pais_id: String(matchedPais.id),
                            ...(address ? {} : { direccion: result.display_name ?? '' })
                        }));
                    }
                }
            }
        } catch (err) {
            console.error("Error reverse geocoding:", err);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert(__('Geolocation is not supported by your browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapCenter([latitude, longitude]);
                setMapZoom(15);
                handleLocationSelected(latitude, longitude);
            },
            (error) => {
                alert(__('Could not obtain current location. Please grant permissions.'));
            }
        );
    };

    // Step 1 Validation
    const validateStep1 = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!providerData.razon_social.trim()) newErrors.razon_social = __('Business name is required.');
        if (!providerData.documento_identidad.trim()) newErrors.documento_identidad = __('ID document is required.');
        if (!providerData.responsable.trim()) newErrors.responsable = __('Representative is required.');
        if (!providerData.pais_id) newErrors.pais_id = __('Country is required.');
        if (!providerData.direccion.trim()) newErrors.direccion = __('Address is required.');
        if (!providerData.latitud || !providerData.longitud) newErrors.location = __('You must select a location on the map.');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Step 2 Validation: Must have at least 1 employee
    const validateStep2 = (): boolean => {
        if (employees.length === 0) {
            alert(__('You must register at least one collaborator (employee) for access.'));
            return false;
        }
        return true;
    };

    // Navigation handles
    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Add employee to array
    const handleAddEmployee = () => {
        if (!newEmployee.nombres.trim() || !newEmployee.apellidos.trim() || !newEmployee.documento_identidad.trim()) {
            alert(__('First name, last name and ID are required.'));
            return;
        }

        setEmployees(prev => [...prev, newEmployee]);
        setNewEmployee({
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
        });
        setShowEmployeeForm(false);
    };

    const handleRemoveEmployee = (index: number) => {
        setEmployees(prev => prev.filter((_, i) => i !== index));
    };

    // Add vehicle to array
    const handleAddVehicle = () => {
        if (!newVehicle.tipo_vehiculo.trim() || !newVehicle.marca.trim() || !newVehicle.modelo.trim() || !newVehicle.year || !newVehicle.placa.trim()) {
            alert(__('All vehicle fields are required.'));
            return;
        }

        setVehicles(prev => [...prev, newVehicle]);
        setNewVehicle({
            tipo_vehiculo: '',
            marca: '',
            modelo: '',
            year: '',
            placa: '',
            foto_frontal: '',
            foto_trasera: '',
        });
        setShowVehicleForm(false);
    };

    const handleRemoveVehicle = (index: number) => {
        setVehicles(prev => prev.filter((_, i) => i !== index));
    };

    // Form final Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const payload = {
            ...providerData,
            empleados: employees,
            vehiculos: vehicles
        };

        try {
            const response = await fetch(`/preregistro/${preRegistro.token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(payload)
            });

            let data: any = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                throw new Error(__('El servidor respondió con código :status: :statusText', { status: String(response.status), statusText: response.statusText }));
            }

            if (response.ok && data.success) {
                setIsSuccess(true);
            } else {
                setErrorMsg(data.message || __('Ocurrió un error al procesar el pre-registro.'));
                if (data.errors) {
                    const validationErrors = Object.entries(data.errors)
                        .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
                        .join('\n');
                    setErrorMsg(prev => prev + '\n' + validationErrors);
                }
            }
        } catch (err: any) {
            console.error("Submission error details:", err);
            setErrorMsg(err.message || __('Error de red. No se pudo conectar con el servidor.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                    <div className="bg-white dark:bg-slate-900 py-10 px-8 shadow-2xl border border-slate-100 dark:border-slate-800 rounded-3xl text-center">
                        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-6 border border-emerald-100 dark:border-emerald-900/50 mx-auto animate-bounce">
                            <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-3">
                            {__('Pre-registration submitted successfully!')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                            {__('We have successfully received the provider, collaborators and vehicles details. The registration status is now')} <span className="font-semibold text-amber-600 dark:text-amber-400">{__('Under Review')}</span>.
                        </p>
                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/30 text-xs text-slate-500 dark:text-slate-400 text-left mb-6 space-y-2">
                            <p className="font-medium text-emerald-800 dark:text-emerald-300">{__('What happens now?')}</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>{__('A confirmation message has been sent to your WhatsApp.')}</li>
                                <li>{__('Office administrative staff will validate all documentation.')}</li>
                                <li>{__('Once the details are approved, you will receive a notification on WhatsApp and be granted access to the facilities.')}</li>
                            </ul>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {__('You can now close this tab.')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={__('Supplier Pre-Registration Assistant')} />

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header language switcher & Title */}
                    <div className="flex justify-between items-center mb-6">
                        <div />
                        <LanguageToggle />
                    </div>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#104a29]/10 text-[#104a29] dark:text-[#2d8d53] text-xs font-semibold mb-3">
                            <Building2 className="w-3.5 h-3.5" />
                            {__('Access Pre-Registration')}
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                            {__('Registration Assistant')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                            {__('Complete the form in 4 simple steps to request access. All information will be audited.')}
                        </p>
                    </div>

                    {/* Step indicators */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
                            <div
                                className="absolute left-0 top-1/2 h-0.5 bg-[#104a29] -translate-y-1/2 z-0 transition-all duration-300"
                                style={{ width: `${((step - 1) / 3) * 100}%` }}
                            />

                            {[1, 2, 3, 4].map(s => {
                                let label = '';
                                let icon = null;
                                switch (s) {
                                    case 1: label = __('General'); icon = <Building2 className="w-4 h-4" />; break;
                                    case 2: label = __('Employees'); icon = <Users className="w-4 h-4" />; break;
                                    case 3: label = __('Vehicles'); icon = <Car className="w-4 h-4" />; break;
                                    case 4: label = __('Validation'); icon = <CheckCircle className="w-4 h-4" />; break;
                                }
                                return (
                                    <div key={s} className="flex flex-col items-center relative z-10">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s
                                                    ? 'bg-[#104a29] border-[#104a29] text-white'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                                }`}
                                        >
                                            {icon}
                                        </div>
                                        <span className={`text-[10px] font-medium mt-1 transition-colors duration-300 ${step >= s ? 'text-[#104a29] font-bold dark:text-[#2d8d53]' : 'text-slate-400'
                                            }`}>
                                            {label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden p-6 sm:p-8">
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-300 text-sm whitespace-pre-line">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>{errorMsg}</div>
                            </div>
                        )}

                        {/* STEP 1: Provider Data */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                                    <h2 className="text-xl font-bold">{__('General Supplier Info')}</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="razon_social">{__('Razón Social *')}</Label>
                                        <Input
                                            id="razon_social"
                                            value={providerData.razon_social}
                                            onChange={(e) => setProviderData(prev => ({ ...prev, razon_social: e.target.value }))}
                                            className={errors.razon_social ? 'border-rose-500' : ''}
                                        />
                                        {errors.razon_social && <p className="text-xs text-rose-500">{errors.razon_social}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombre_comercial">{__('Trade Name')}</Label>
                                        <Input
                                            id="nombre_comercial"
                                            value={providerData.nombre_comercial}
                                            disabled
                                            className="bg-muted text-muted-foreground"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="documento_identidad">{__('Documento de Identidad *')}</Label>
                                        <Input
                                            id="documento_identidad"
                                            value={providerData.documento_identidad}
                                            onChange={(e) => setProviderData(prev => ({ ...prev, documento_identidad: e.target.value }))}
                                            className={errors.documento_identidad ? 'border-rose-500' : ''}
                                        />
                                        {errors.documento_identidad && <p className="text-xs text-rose-500">{errors.documento_identidad}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="responsable">{__('Responsable *')}</Label>
                                        <Input
                                            id="responsable"
                                            value={providerData.responsable}
                                            onChange={(e) => setProviderData(prev => ({ ...prev, responsable: e.target.value }))}
                                            className={errors.responsable ? 'border-rose-500' : ''}
                                        />
                                        {errors.responsable && <p className="text-xs text-rose-500">{errors.responsable}</p>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <PhoneInputGroup
                                            paises={paises}
                                            selectedPaisId={providerData.pais_telefono_id}
                                            phoneValue={providerData.telefono}
                                            onPaisChange={() => { }} 
                                            onPhoneChange={() => { }}
                                            className="opacity-70 pointer-events-none bg-muted rounded-md"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="pais_id">{__('Country *')}</Label>
                                        <Select
                                            value={providerData.pais_id}
                                            onValueChange={handlePaisChange}
                                        >
                                            <SelectTrigger id="pais_id" className={cn("w-full", errors.pais_id && 'border-rose-500')}>
                                                <SelectValue placeholder={__('Select Country')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paises.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.pais_id && <p className="text-xs text-rose-500">{errors.pais_id}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label>{__('Geographical Location *')}</Label>
                                            <Button
                                                type="button"
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-[#104a29] text-xs font-semibold"
                                                onClick={handleGetCurrentLocation}
                                            >
                                                <Navigation className="w-3 h-3 mr-1" />
                                                {__('My Location')}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                placeholder={__('Latitude')}
                                                value={providerData.latitud !== null ? String(providerData.latitud) : ''}
                                                readOnly
                                                className="bg-muted text-muted-foreground text-xs"
                                            />
                                            <Input
                                                placeholder={__('Longitude')}
                                                value={providerData.longitud !== null ? String(providerData.longitud) : ''}
                                                readOnly
                                                className="bg-muted text-muted-foreground text-xs"
                                            />
                                        </div>
                                        {errors.location && <p className="text-xs text-rose-500">{errors.location}</p>}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="direccion">{__('Physical Address *')}</Label>
                                        <Textarea
                                            id="direccion"
                                            value={providerData.direccion}
                                            onChange={(e) => setProviderData(prev => ({ ...prev, direccion: e.target.value }))}
                                            className={errors.direccion ? 'border-rose-500' : ''}
                                            rows={2}
                                        />
                                        {errors.direccion && <p className="text-xs text-rose-500">{errors.direccion}</p>}
                                    </div>
                                </div>

                                <div className="h-[450px] w-full rounded-2xl border overflow-hidden relative bg-slate-50">
                                    <Suspense fallback={<p>{__('Loading map...')}</p>}>
                                        <ProveedorMapComponent
                                            center={mapCenter}
                                            zoom={mapZoom}
                                            style={{ height: '100%', width: '100%' }}
                                            markerPosition={
                                                providerData.latitud && providerData.longitud
                                                    ? [Number(providerData.latitud), Number(providerData.longitud)]
                                                    : null
                                            }
                                            onLocationSelected={handleLocationSelected}
                                        />
                                    </Suspense>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Employees */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="border-b pb-4 mb-4 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold">{__('Collaborators')}</h2>
                                    </div>
                                    {!showEmployeeForm && (
                                        <Button
                                            type="button"
                                            onClick={() => setShowEmployeeForm(true)}
                                            className="bg-[#104a29] text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            {__('Add Collaborator')}
                                        </Button>
                                    )}
                                </div>

                                {showEmployeeForm && (
                                    <div className="p-5 border bg-slate-50/50 rounded-2xl space-y-4">
                                        <h3 className="font-semibold text-sm">{__('New Collaborator')}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input placeholder={__('First Names *')} value={newEmployee.nombres} onChange={(e) => setNewEmployee(prev => ({ ...prev, nombres: e.target.value }))} />
                                            <Input placeholder={__('Last Names *')} value={newEmployee.apellidos} onChange={(e) => setNewEmployee(prev => ({ ...prev, apellidos: e.target.value }))} />
                                            <Input placeholder={__('ID Document *')} value={newEmployee.documento_identidad} onChange={(e) => setNewEmployee(prev => ({ ...prev, documento_identidad: e.target.value }))} />
                                            <Input placeholder={__('Role / Position')} value={newEmployee.cargo} onChange={(e) => setNewEmployee(prev => ({ ...prev, cargo: e.target.value }))} />
                                            
                                            <div className="space-y-2 sm:col-span-2 border-t pt-4 mt-2">
                                                <h4 className="text-xs font-semibold text-slate-500">{__('Documentation')}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
                                                    {['foto_carnet', 'documento_frontal', 'documento_reverso'].map((field) => (
                                                        <div key={field} className="space-y-2">
                                                            <Label className="text-xs">{__(field.replace('_', ' ').toUpperCase())}</Label>
                                                            <div className="relative flex items-center justify-center border rounded-xl h-28 bg-white shadow-sm overflow-hidden">
                                                                {newEmployee[field as keyof EmpleadoForm] ? (
                                                                    <img src={newEmployee[field as keyof EmpleadoForm]} className="w-full h-full object-cover" />
                                                                ) : <span className="text-xs italic text-slate-400">{__('No file')}</span>}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-1.5">
                                                                <Button type="button" variant="outline" size="sm" className="relative text-[11px] h-8">
                                                                    <ImageIcon className="w-3 h-3 mr-1" /> {__('Upload')}
                                                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, field, 'employee')} className="absolute inset-0 opacity-0" />
                                                                </Button>
                                                                <Button type="button" variant="outline" size="sm" className="text-[11px] h-8 text-[#104a29]" onClick={() => handleOpenCamera('employee', field)}>
                                                                    <CameraIcon className="w-3 h-3 mr-1" /> {__('Camera')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t">
                                            <Button variant="outline" size="sm" onClick={() => setShowEmployeeForm(false)}>{__('Cancel')}</Button>
                                            <Button size="sm" onClick={handleAddEmployee} className="bg-[#104a29]">{__('Save')}</Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {employees.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground bg-slate-50/20 dark:bg-slate-900/10">
                                            <UserIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm font-medium">{__('No collaborators registered yet.')}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{__('Click \'Add Collaborator\' to register your staff.')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {employees.map((emp, i) => (
                                                <div key={i} className="p-4 border rounded-2xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-slate-50 shrink-0">
                                                            {emp.foto_carnet ? <img src={emp.foto_carnet} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-sm block">{emp.nombres} {emp.apellidos}</span>
                                                            <span className="text-xs text-slate-400 font-mono">{emp.documento_identidad} {emp.cargo ? `• ${emp.cargo}` : ''}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveEmployee(i)} className="text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Vehicles */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="border-b pb-4 mb-4 flex justify-between items-center">
                                    <h2 className="text-xl font-bold">{__('Vehicles')}</h2>
                                    {!showVehicleForm && (
                                        <Button type="button" onClick={() => setShowVehicleForm(true)} className="bg-[#104a29] text-white">
                                            <Plus className="w-4 h-4 mr-1" /> {__('Add Vehicle')}
                                        </Button>
                                    )}
                                </div>

                                {showVehicleForm && (
                                    <div className="p-5 border bg-slate-50/50 rounded-2xl space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label>{__('Vehicle Type *')}</Label>
                                                <Select
                                                    value={newVehicle.tipo_vehiculo}
                                                    onValueChange={(val) => setNewVehicle(prev => ({ ...prev, tipo_vehiculo: val }))}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={__('Select')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Automóvil">{__('Car')}</SelectItem>
                                                        <SelectItem value="Camioneta">{__('Pickup')}</SelectItem>
                                                        <SelectItem value="Camión">{__('Truck')}</SelectItem>
                                                        <SelectItem value="Motocicleta">{__('Motorcycle')}</SelectItem>
                                                        <SelectItem value="Otro">{__('Other')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Make *')}</Label>
                                                <Input
                                                    value={newVehicle.marca}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, marca: e.target.value }))}
                                                    placeholder="Ej: Chevrolet, Toyota"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Model *')}</Label>
                                                <Input
                                                    value={newVehicle.modelo}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, modelo: e.target.value }))}
                                                    placeholder="Ej: Hilux, Aveo"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>{__('Year *')}</Label>
                                                <Input
                                                    type="number"
                                                    value={newVehicle.year}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                                                    placeholder="Ej: 2020"
                                                />
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <Label>{__('License Plate *')}</Label>
                                                <Input
                                                    value={newVehicle.placa}
                                                    onChange={(e) => setNewVehicle(prev => ({ ...prev, placa: e.target.value }))}
                                                    placeholder="Ej: ABC-1234"
                                                />
                                            </div>

                                            {/* Photo uploads */}
                                            <div className="space-y-2 sm:col-span-2 border-t pt-4 mt-2">
                                                <h4 className="text-xs font-semibold text-slate-500">{__('Vehicle Photos')}</h4>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                                                    {/* Foto frontal */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium">{__('Foto Frontal')}</Label>
                                                        <div className="relative flex items-center justify-center border rounded-xl h-28 bg-white overflow-hidden shadow-sm">
                                                            {newVehicle.foto_frontal ? (
                                                                <img src={newVehicle.foto_frontal} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs italic text-slate-400">{__('No front photo')}</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-[11px] h-8 px-1 flex items-center justify-center gap-1 relative"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                {__('Upload')}
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => handleFileChange(e, 'foto_frontal', 'vehicle')}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-[11px] h-8 px-1 flex items-center justify-center gap-1 text-[#104a29] border-[#104a29]/30 hover:bg-[#104a29]/10"
                                                                onClick={() => handleOpenCamera('vehicle', 'foto_frontal')}
                                                            >
                                                                <CameraIcon className="w-3.5 h-3.5" />
                                                                {__('Camera')}
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Foto trasera */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium">{__('Foto Trasera')}</Label>
                                                        <div className="relative flex items-center justify-center border rounded-xl h-28 bg-white overflow-hidden shadow-sm">
                                                            {newVehicle.foto_trasera ? (
                                                                <img src={newVehicle.foto_trasera} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs italic text-slate-400">{__('No rear photo')}</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-[11px] h-8 px-1 flex items-center justify-center gap-1 relative"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                {__('Upload')}
                                                                <input 
                                                                    type="file" 
                                                                    accept="image/*" 
                                                                    onChange={(e) => handleFileChange(e, 'foto_trasera', 'vehicle')}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-[11px] h-8 px-1 flex items-center justify-center gap-1 text-[#104a29] border-[#104a29]/30 hover:bg-[#104a29]/10"
                                                                onClick={() => handleOpenCamera('vehicle', 'foto_trasera')}
                                                            >
                                                                <CameraIcon className="w-3.5 h-3.5" />
                                                                {__('Camera')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setShowVehicleForm(false)}
                                            >
                                                {__('Cancel')}
                                            </Button>
                                            <Button 
                                                type="button" 
                                                size="sm"
                                                onClick={handleAddVehicle}
                                                className="bg-[#104a29] hover:bg-[#0c371e] text-white"
                                            >
                                                {__('Save Vehicle')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Registered Vehicles List */}
                                <div className="space-y-3">
                                    {vehicles.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground bg-slate-50/20 dark:bg-slate-900/10">
                                            <Car className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm font-medium">{__('No vehicles registered.')}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{__('If collaborators will arrive by vehicle, add it here.')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {vehicles.map((veh, i) => (
                                                <div key={i} className="p-4 border rounded-2xl flex justify-between items-center bg-white dark:bg-slate-900 shadow-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 border rounded-lg overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                                            {veh.foto_frontal ? <img src={veh.foto_frontal} className="w-full h-full object-cover" /> : <Car className="w-6 h-6 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-sm block">{veh.marca} {veh.modelo} ({veh.year})</span>
                                                            <span className="text-xs text-slate-400 font-mono">{__('License Plate:')} {veh.placa} • {veh.tipo_vehiculo}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveVehicle(i)} className="text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: Validation / Review */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                                    <h2 className="text-xl font-bold">{__('Data Validation')}</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">{__('Review the information carefully before submitting.')}</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Provider Summary */}
                                    <div className="p-5 border rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                        <h3 className="font-bold text-sm text-[#104a29] flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4" /> {__('Company Details')}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 font-medium">{__('Business Name:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.razon_social}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">{__('Trade Name:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.nombre_comercial}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">{__('Tax ID:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.documento_identidad}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">{__('Representative:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.responsable}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-medium">{__('Phone:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.telefono}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <span className="text-slate-400 font-medium">{__('Physical Address:')}</span>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{providerData.direccion}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Employees Summary */}
                                    <div className="p-5 border rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                        <h3 className="font-bold text-sm text-[#104a29] flex items-center gap-1.5">
                                            <Users className="w-4 h-4" /> {__('Collaborators')} ({employees.length})
                                        </h3>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {employees.map((emp, i) => (
                                                <div key={i} className="flex justify-between items-center py-2 text-xs">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.nombres} {emp.apellidos}</p>
                                                        <span className="text-slate-400 font-mono">DNI: {emp.documento_identidad}</span>
                                                    </div>
                                                    <span className="text-[#104a29] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                                                        {emp.cargo || __('Colaborador')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Vehicles Summary */}
                                    <div className="p-5 border rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                        <h3 className="font-bold text-sm text-[#104a29] flex items-center gap-1.5">
                                            <Car className="w-4 h-4" /> {__('Vehicles')} ({vehicles.length})
                                        </h3>
                                        {vehicles.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">{__('No vehicles registered.')}</p>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {vehicles.map((veh, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 text-xs">
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{veh.marca} {veh.modelo} ({veh.year})</p>
                                                            <span className="text-slate-400 font-mono">{__('License Plate:')} {veh.placa}</span>
                                                        </div>
                                                        <span className="text-slate-500 font-medium">{veh.tipo_vehiculo}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/30 rounded-2xl border text-xs text-slate-500 space-y-2 leading-relaxed">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{__('Declaration of Responsibility')}</p>
                                    <p>{__('By clicking "Submit Registration", the provider declares under oath that all information provided in this wizard, including attached safety documentation (valid ID, safety vest, and photos) is true and current, assuming any corresponding legal responsibility.')}</p>
                                </div>
                            </form>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex items-center gap-1"
                                    disabled={isSubmitting}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    {__('Back')}
                                </Button>
                            ) : (
                                <div />
                            )}

                            {step < 4 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-1 animate-pulse"
                                >
                                    {__('Next')}
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                                >
                                    {isSubmitting ? __('Processing...') : __('Submit Registration')}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* ══ Modal de Cámara ════════════════════════════ */}
            <Dialog open={isCameraOpen} onOpenChange={(open) => {
                if (!open) stopCamera();
                setIsCameraOpen(open);
            }}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle>{__('Take Photo')}</DialogTitle>
                        <DialogDescription>
                            {__('Place the item in front of the camera and click capture.')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <DialogFooter className="mt-4 gap-2 flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                stopCamera();
                                setIsCameraOpen(false);
                            }}
                        >
                            {__('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-[#104a29] hover:bg-[#0c371e] text-white flex items-center gap-1.5"
                        >
                            <CameraIcon className="w-4 h-4" />
                            {__('Capture Photo')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
