import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    CheckCircle, 
    ChevronLeft, 
    ChevronRight, 
    ShieldAlert, 
    User as UserIcon,
    AlertTriangle,
    FileText,
    Check,
    Camera as CameraIcon,
    Upload,
    Building2,
    Calendar,
    Clock,
    Plus,
    LoaderCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PhoneInputGroup from '../admin/Empresas/Partials/PhoneInputGroup';
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

interface TipoServicio {
    id: number;
    nombre: string;
}

interface PreRegistroProps {
    preRegistro: {
        id: number;
        nombres: string;
        apellidos: string;
        pais_telefono_id: number;
        telefono: string;
        motivo_registro: string;
        token: string;
        empresa_id: number;
        sucursal_id: number;
        empleado_id?: number | null;
        responsable_id?: number | null;
    };
    paises: Pais[];
    tipoServicios: TipoServicio[];
    mapbox_api_key?: string | null;
    mapbox_active?: boolean;
}

export default function Wizard({ preRegistro, paises, tipoServicios }: PreRegistroProps) {
    const { __ } = useTranslate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [localTipoServicios, setLocalTipoServicios] = useState<TipoServicio[]>(tipoServicios);
    const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
    const [newServiceTypeName, setNewServiceTypeName] = useState('');
    const [isSavingNewServiceType, setIsSavingNewServiceType] = useState(false);

    const handleCreateServiceType = async () => {
        if (!newServiceTypeName.trim()) return;
        setIsSavingNewServiceType(true);

        try {
            const response = await fetch(`/preregistro-visita/${preRegistro.token}/tipo-servicio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ nombre: newServiceTypeName }),
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const createdType = result.tipo_servicio;
                setLocalTipoServicios(prev => [...prev, createdType].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                setProfileData(prev => ({ ...prev, tipo_servicio_id: String(createdType.id) }));
                setNewServiceTypeName('');
                setIsNewServiceModalOpen(false);
            } else {
                alert(result.message || __('An error occurred while creating the service type.'));
            }
        } catch (err) {
            alert(__('Network error. Could not connect to the server.'));
        } finally {
            setIsSavingNewServiceType(false);
        }
    };

    // Step 1: Profile & Dates
    const [profileData, setProfileData] = useState({
        documento_identidad: '',
        tipo_servicio_id: '',
        fecha_ingreso: '',
        hora_ingreso: '',
        fecha_salida: '',
        hora_salida: '',
    });

    // Step 2: Photos (Base64)
    const [photos, setPhotos] = useState({
        foto_carnet: '',
        foto_documento: '',
    });

    // Camera States
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: 640, height: 480 } 
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

    const handleOpenCamera = (fieldName: string) => {
        setActiveCameraField(fieldName);
        setIsCameraOpen(true);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                if (activeCameraField) {
                    setPhotos(prev => ({ ...prev, [activeCameraField]: dataUrl }));
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

    // Refs for file uploads
    const fileRefs = {
        foto_carnet: useRef<HTMLInputElement>(null),
        foto_documento: useRef<HTMLInputElement>(null),
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            alert(__('The image must not exceed 3MB.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            setPhotos(prev => ({ ...prev, [fieldName]: base64 }));
        };
    };

    // Check if current mode is simplified delivery (Service Type ID 1 or 6)
    const isEntregaMode = profileData.tipo_servicio_id === '1' || profileData.tipo_servicio_id === '6';

    // Step validation
    const validateStep = () => {
        const stepErrors: Record<string, string> = {};

        if (step === 1) {
            if (!isEntregaMode) {
                if (!profileData.documento_identidad.trim()) {
                    stepErrors.documento_identidad = __('National ID / Passport number is required.');
                }
                if (!profileData.fecha_ingreso) {
                    stepErrors.fecha_ingreso = __('Entry date is required.');
                }
                if (!profileData.hora_ingreso) {
                    stepErrors.hora_ingreso = __('Entry time is required.');
                }
                if (!profileData.fecha_salida) {
                    stepErrors.fecha_salida = __('Exit date is required.');
                }
                if (!profileData.hora_salida) {
                    stepErrors.hora_salida = __('Exit time is required.');
                }
            }
        } else if (step === 2) {
            if (!isEntregaMode) {
                if (!photos.foto_carnet) stepErrors.foto_carnet = __('Profile photo is required.');
                if (!photos.foto_documento) stepErrors.foto_documento = __('ID Document Front photo is required.');
            }
        }

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            if (isEntregaMode && step === 1) {
                setStep(3); // Skip photos step (step 2) in delivery mode
            } else {
                setStep(prev => prev + 1);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (isEntregaMode && step === 3) {
            setStep(1); // Go directly back to details step in delivery mode
        } else {
            setStep(prev => prev - 1);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        const payload = {
            ...profileData,
            ...photos,
        };

        try {
            const response = await fetch(`/preregistro-visita/${preRegistro.token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setIsSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setErrorMsg(result.message || __('An error occurred while submitting your pre-registration.'));
                if (result.errors) {
                    setErrors(result.errors);
                }
            }
        } catch (err) {
            setErrorMsg(__('Network error. Could not connect to the server.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-955 flex flex-col justify-center items-center p-6 text-slate-800 dark:text-slate-100">
                <Head title={__('Registration Completed')} />
                <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{__('Pre-registration Completed!')}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {__('Your information has been registered and is under administrative review.')}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400 text-left space-y-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-300 block">{__('What happens next?')}</span>
                        <p>{__('1. The security department will validate your details, schedule, and photos.')}</p>
                        <p>{__('2. You will receive a WhatsApp message once your access is approved.')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 flex flex-col">
            <Head title={__('Visitor Pre-Registration')} />

            {/* Top Navigation */}
            <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-lg tracking-wider text-slate-800 dark:text-slate-100">{__('VISITOR PRE-REGISTRATION')}</span>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                </div>
            </header>

            {/* Progress indicator */}
            <div className="w-full bg-white dark:bg-slate-955 py-3 border-b border-slate-100 dark:border-slate-800/20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className={cn(step >= 1 && "text-emerald-600 dark:text-emerald-400")}>{__('1. Schedule & Details')}</span>
                        {!isEntregaMode && (
                            <>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                <span className={cn(step >= 2 && "text-emerald-600 dark:text-emerald-400")}>{__('2. Photo Upload')}</span>
                            </>
                        )}
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className={cn(step >= 3 && "text-emerald-600 dark:text-emerald-400")}>
                            {isEntregaMode ? __('2. Summary') : __('3. Summary')}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="bg-emerald-600 dark:bg-emerald-400 h-full transition-all duration-300" 
                            style={{ 
                                width: isEntregaMode 
                                    ? `${step === 1 ? 50 : 100}%` 
                                    : `${(step / 3) * 100}%` 
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
                {errorMsg && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-start gap-3 mb-6">
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-sm block">{__('Validation Error')}</span>
                            <span className="text-xs">{errorMsg}</span>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                    
                    {/* STEP 1: Details & Schedule */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Visit Registration Details')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Please confirm your personal details and enter your document of identity and visit schedule.')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>{__('First Name')}</Label>
                                    <Input value={preRegistro.nombres} disabled className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Last Name')}</Label>
                                    <Input value={preRegistro.apellidos} disabled className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Phone')}</Label>
                                    <PhoneInputGroup
                                        paises={paises}
                                        selectedPaisId={preRegistro.pais_telefono_id}
                                        phoneValue={preRegistro.telefono}
                                        onPaisChange={() => {}}
                                        onPhoneChange={() => {}}
                                        disabled
                                    />
                                </div>
                                {!isEntregaMode && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="doc_id">{__('National ID / Passport Number')}</Label>
                                        <Input 
                                            id="doc_id" 
                                            value={profileData.documento_identity || profileData.documento_identidad} 
                                            onChange={(e) => setProfileData(p => ({ ...p, documento_identidad: e.target.value }))}
                                            placeholder="e.g. 12345678-A"
                                            className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.documento_identidad && "border-rose-500")}
                                        />
                                        {errors.documento_identidad && <p className="text-xs text-rose-500 mt-1">{errors.documento_identidad}</p>}
                                    </div>
                                )}
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="tipo_servicio">{__('Service Type (Optional)')}</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select 
                                                value={profileData.tipo_servicio_id} 
                                                onValueChange={(v) => {
                                                    setProfileData(p => ({ ...p, tipo_servicio_id: v }));
                                                    // Reset errors when type changes
                                                    setErrors({});
                                                }}
                                            >
                                                <SelectTrigger id="tipo_servicio" className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <SelectValue placeholder={__('Select a service type')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tipoServicesOption(localTipoServicios)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsNewServiceModalOpen(true)}
                                            className="shrink-0 border-slate-200 dark:border-slate-800"
                                            title={__('Add New Service Type')}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {errors.tipo_servicio_id && <p className="text-xs text-rose-500 mt-1">{errors.tipo_servicio_id}</p>}
                                </div>
                            </div>

                            {!isEntregaMode && (
                                <>
                                    <hr className="border-slate-100 dark:border-slate-800/80" />

                                    <div>
                                        <h3 className="text-md font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            {__('Schedule of your Visit')}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{__('Select when your visit will start and end.')}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="fecha_ingreso">{__('Entry Date')}</Label>
                                            <Input 
                                                type="date"
                                                id="fecha_ingreso"
                                                value={profileData.fecha_ingreso}
                                                onChange={(e) => setProfileData(p => ({ ...p, fecha_ingreso: e.target.value }))}
                                                className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.fecha_ingreso && "border-rose-500")}
                                            />
                                            {errors.fecha_ingreso && <p className="text-xs text-rose-500 mt-1">{errors.fecha_ingreso}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="hora_ingreso">{__('Entry Time')}</Label>
                                            <Input 
                                                type="time"
                                                id="hora_ingreso"
                                                value={profileData.hora_ingreso}
                                                onChange={(e) => setProfileData(p => ({ ...p, hora_ingreso: e.target.value }))}
                                                className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.hora_ingreso && "border-rose-500")}
                                            />
                                            {errors.hora_ingreso && <p className="text-xs text-rose-500 mt-1">{errors.hora_ingreso}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="fecha_salida">{__('Exit Date')}</Label>
                                            <Input 
                                                type="date"
                                                id="fecha_salida"
                                                value={profileData.fecha_salida}
                                                onChange={(e) => setProfileData(p => ({ ...p, fecha_salida: e.target.value }))}
                                                className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.fecha_salida && "border-rose-500")}
                                            />
                                            {errors.fecha_salida && <p className="text-xs text-rose-500 mt-1">{errors.fecha_salida}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="hora_salida">{__('Exit Time')}</Label>
                                            <Input 
                                                type="time"
                                                id="hora_salida"
                                                value={profileData.hora_salida}
                                                onChange={(e) => setProfileData(p => ({ ...p, hora_salida: e.target.value }))}
                                                className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.hora_salida && "border-rose-500")}
                                            />
                                            {errors.hora_salida && <p className="text-xs text-rose-500 mt-1">{errors.hora_salida}</p>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Photos */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Photo Verification')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {__('We require a selfie and a picture of your national ID/passport for security validation.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Profile Photo */}
                                <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-semibold">{__('Selfie / Profile Picture')}</Label>
                                        <p className="text-xs text-slate-500">{__('A clear picture of your face without glasses or cap.')}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-4">
                                        {photos.foto_carnet ? (
                                            <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                                                <img src={photos.foto_carnet} alt="Selfie" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setPhotos(prev => ({ ...prev, foto_carnet: '' }))}
                                                    className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xs font-semibold opacity-0 hover:opacity-100 transition-opacity"
                                                >
                                                    {__('Change Photo')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-40 h-40 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
                                                <UserIcon className="w-12 h-12 stroke-[1.2]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => handleOpenCamera('foto_carnet')}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 text-xs h-9"
                                        >
                                            <CameraIcon className="w-4 h-4" />
                                            {__('Take Picture')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileRefs.foto_carnet.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {__('Upload')}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileRefs.foto_carnet}
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'foto_carnet')}
                                            className="hidden"
                                        />
                                    </div>
                                    {errors.foto_carnet && <p className="text-xs text-rose-500 mt-1 text-center">{errors.foto_carnet}</p>}
                                </div>

                                {/* ID Photo */}
                                <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-semibold">{__('National ID (Front Side)')}</Label>
                                        <p className="text-xs text-slate-500">{__('Ensure all text and details on the card are fully readable.')}</p>
                                    </div>
                                    <div className="flex flex-col items-center justify-center py-4">
                                        {photos.foto_documento ? (
                                            <div className="relative w-full max-w-[220px] aspect-[1.586/1] rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                                <img src={photos.foto_documento} alt="ID Document" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setPhotos(prev => ({ ...prev, foto_documento: '' }))}
                                                    className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-xs font-semibold opacity-0 hover:opacity-100 transition-opacity"
                                                >
                                                    {__('Change Photo')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-[220px] aspect-[1.586/1] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
                                                <FileText className="w-12 h-12 stroke-[1.2]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={() => handleOpenCamera('foto_documento')}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 text-xs h-9"
                                        >
                                            <CameraIcon className="w-4 h-4" />
                                            {__('Take Picture')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileRefs.foto_documento.current?.click()}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs h-9 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                        >
                                            <Upload className="w-4 h-4" />
                                            {__('Upload')}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileRefs.foto_documento}
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'foto_documento')}
                                            className="hidden"
                                        />
                                    </div>
                                    {errors.foto_documento && <p className="text-xs text-rose-500 mt-1 text-center">{errors.foto_documento}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Summary */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Review & Submit')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Double check all the information before completing the pre-registration.')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Visitor Name')}</span>
                                        <span className="text-sm font-semibold">{preRegistro.nombres} {preRegistro.apellidos}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Phone')}</span>
                                        <span className="text-sm font-semibold">{preRegistro.telefono}</span>
                                    </div>
                                    {!isEntregaMode && (
                                        <div>
                                            <span className="text-xs text-slate-400 block font-semibold uppercase">{__('National ID / Passport')}</span>
                                            <span className="text-sm font-semibold">{profileData.documento_identidad}</span>
                                        </div>
                                    )}
                                    {profileData.tipo_servicio_id && (
                                        <div>
                                            <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Service Type')}</span>
                                            <span className="text-sm font-semibold">
                                                {tipoServicios.find(t => String(t.id) === profileData.tipo_servicio_id)?.nombre || ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Reason for Visit')}</span>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{preRegistro.motivo_registro}</span>
                                    </div>
                                    {!isEntregaMode && (
                                        <div className="flex gap-6">
                                            <div>
                                                <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Check-In Schedule')}</span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {profileData.fecha_ingreso}
                                                    <Clock className="w-3.5 h-3.5 ml-1" />
                                                    {profileData.hora_ingreso}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block font-semibold uppercase">{__('Check-Out Schedule')}</span>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {profileData.fecha_salida}
                                                    <Clock className="w-3.5 h-3.5 ml-1" />
                                                    {profileData.hora_salida}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isEntregaMode && (
                                <div className="grid grid-cols-2 gap-4 justify-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-semibold">{__('Selfie')}</span>
                                        <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <img src={photos.foto_carnet} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-semibold">{__('ID Document')}</span>
                                        <div className="w-32 aspect-[1.586/1] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                            <img src={photos.foto_documento} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step Navigation Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
                        {step > 1 ? (
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleBack}
                                className="flex items-center gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                {__('Back')}
                            </Button>
                        ) : <div />}

                        {step < 3 ? (
                            <Button 
                                type="button" 
                                onClick={handleNext}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                            >
                                {__('Next')}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button 
                                type="button" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 min-w-[120px]"
                            >
                                {isSubmitting ? __('Submitting...') : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {__('Submit pre-registration')}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </main>

            {/* CAMERA DIALOG */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
                        <h3 className="text-lg font-semibold">{__('Capture Image')}</h3>
                        
                        <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover scale-x-[-1]"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="flex gap-2 justify-center">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCameraOpen(false)}
                                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                {__('Cancel')}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={capturePhoto}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            >
                                <CameraIcon className="w-4 h-4" />
                                {__('Capture')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW SERVICE TYPE DIALOG */}
            <Dialog open={isNewServiceModalOpen} onOpenChange={setIsNewServiceModalOpen}>
                <DialogContent className="max-w-md w-full rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {__('New Service Type')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                            {__('Enter new service type name...')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="new_service_name">{__('Name')}</Label>
                            <Input
                                id="new_service_name"
                                value={newServiceTypeName}
                                onChange={(e) => setNewServiceTypeName(e.target.value)}
                                placeholder={__('Enter new service type...')}
                                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 justify-end border-t border-slate-100 dark:border-slate-800/80 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsNewServiceModalOpen(false);
                                setNewServiceTypeName('');
                            }}
                            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        >
                            {__('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateServiceType}
                            disabled={isSavingNewServiceType || !newServiceTypeName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                        >
                            {isSavingNewServiceType && (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            )}
                            {__('Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function tipoServicesOption(tipoServicios: TipoServicio[]) {
    return tipoServicios.map((t) => (
        <SelectItem key={t.id} value={String(t.id)}>
            {t.nombre}
        </SelectItem>
    ));
}
