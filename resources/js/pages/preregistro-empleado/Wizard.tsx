import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Users, 
    Car, 
    CheckCircle, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    ShieldAlert, 
    User as UserIcon,
    AlertTriangle,
    FileText,
    Check,
    Camera as CameraIcon,
    Upload,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    };
    paises: Pais[];
    mapbox_api_key?: string | null;
    mapbox_active?: boolean;
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

const defaultJornada = [
    { dia: 'Lunes', activo: true, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Martes', activo: true, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Miércoles', activo: true, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Jueves', activo: true, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Viernes', activo: true, hora_ingreso: '08:00', hora_salida: '17:00' },
    { dia: 'Sábado', activo: false, hora_ingreso: '08:00', hora_salida: '13:00' },
    { dia: 'Domingo', activo: false, hora_ingreso: '08:00', hora_salida: '13:00' },
];

export default function Wizard({ preRegistro, paises }: PreRegistroProps) {
    const { __ } = useTranslate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Step 1: Profile & Shift Data
    const [profileData, setProfileData] = useState({
        documento_identidad: '',
        correo: '',
        genero: '',
        jornada_laboral: defaultJornada,
    });

    // Step 2: Photo States (Base64)
    const [photos, setPhotos] = useState({
        foto_empleado: '',
        foto_empleado_2: '',
        foto_documento: '',
        foto_documento_reverso: '',
    });

    // Step 3: Vehicles List
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

    // Camera States
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<{ type: 'photo' | 'vehicle', fieldName: string } | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
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

    const handleOpenCamera = (type: 'photo' | 'vehicle', fieldName: string) => {
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
                    if (type === 'photo') {
                        setPhotos(prev => ({ ...prev, [fieldName]: dataUrl }));
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

    // Refs for file uploads
    const fileRefs = {
        foto_empleado: useRef<HTMLInputElement>(null),
        foto_empleado_2: useRef<HTMLInputElement>(null),
        foto_documento: useRef<HTMLInputElement>(null),
        foto_documento_reverso: useRef<HTMLInputElement>(null),
        vehiculo_frontal: useRef<HTMLInputElement>(null),
        vehiculo_trasera: useRef<HTMLInputElement>(null),
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'photo' | 'vehicle') => {
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
            if (type === 'photo') {
                setPhotos(prev => ({ ...prev, [fieldName]: base64 }));
            } else {
                setNewVehicle(prev => ({ ...prev, [fieldName]: base64 }));
            }
        };
    };

    // Step navigation validation
    const validateStep = () => {
        const stepErrors: Record<string, string> = {};

        if (step === 1) {
            if (!profileData.documento_identidad.trim()) {
                stepErrors.documento_identidad = __('National ID / Passport number is required.');
            }
        } else if (step === 2) {
            if (!photos.foto_empleado) stepErrors.foto_empleado = __('First employee photo is required.');
            if (!photos.foto_empleado_2) stepErrors.foto_empleado_2 = __('Second employee photo is required.');
            if (!photos.foto_documento) stepErrors.foto_documento = __('ID Document Front photo is required.');
            if (!photos.foto_documento_reverso) stepErrors.foto_documento_reverso = __('ID Document Reverse photo is required.');
        }

        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        const payload = {
            ...profileData,
            ...photos,
            vehiculos: vehicles,
        };

        try {
            const response = await fetch(`/preregistro-empleado/${preRegistro.token}`, {
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

    const activePais = paises.find(p => p.id === Number(preRegistro.pais_telefono_id));

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-800 dark:text-slate-100">
                <Head title={__('Registration Completed')} />
                <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-955 dark:text-slate-50">{__('Pre-registration Completed!')}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {__('Your information has been registered and is under administrative review.')}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-xs text-slate-500 dark:text-slate-400 text-left space-y-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-300 block">{__('What happens next?')}</span>
                        <p>{__('1. The security/HR department will validate your details, photos, and shift information.')}</p>
                        <p>{__('2. You will receive a WhatsApp message once your access is approved and registered.')}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 flex flex-col">
            <Head title={__('Employee Pre-Registration')} />

            {/* Top Navigation / Language & Title */}
            <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <span className="font-bold text-lg tracking-wider text-slate-800 dark:text-slate-100">{__('PRE-REGISTRATION')}</span>
                </div>
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                </div>
            </header>

            {/* Progress indicator */}
            <div className="w-full bg-white dark:bg-slate-950 py-3 border-b border-slate-100 dark:border-slate-800/20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className={cn(step >= 1 && "text-indigo-600 dark:text-indigo-400")}>{__('1. Profile & Schedule')}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className={cn(step >= 2 && "text-indigo-600 dark:text-indigo-400")}>{__('2. Photos')}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className={cn(step >= 3 && "text-indigo-600 dark:text-indigo-400")}>{__('3. Vehicles')}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                        <span className={cn(step >= 4 && "text-indigo-600 dark:text-indigo-400")}>{__('4. Summary')}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 dark:bg-indigo-400 h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Main content body */}
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
                    
                    {/* STEP 1: General Profile & Shift Schedule */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Personal Information')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Please verify your details and fill in the missing fields.')}</p>
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
                                <div className="space-y-1.5">
                                    <Label>{__('Gender')}</Label>
                                    <Select 
                                        value={profileData.genero} 
                                        onValueChange={(v) => setProfileData(p => ({ ...p, genero: v }))}
                                    >
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                            <SelectValue placeholder={__('Select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M">{__('Male')}</SelectItem>
                                            <SelectItem value="F">{__('Female')}</SelectItem>
                                            <SelectItem value="Otro">{__('Other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('National ID / Passport *')}</Label>
                                    <Input 
                                        value={profileData.documento_identidad} 
                                        onChange={(e) => setProfileData(p => ({ ...p, documento_identidad: e.target.value }))}
                                        className={cn("bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800", errors.documento_identidad && "border-rose-500")}
                                        placeholder="Ej: A-12345678"
                                    />
                                    {errors.documento_identidad && <span className="text-xs text-rose-500">{errors.documento_identidad}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>{__('Email Address')}</Label>
                                    <Input 
                                        type="email"
                                        value={profileData.correo} 
                                        onChange={(e) => setProfileData(p => ({ ...p, correo: e.target.value }))}
                                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{__('Proposed Shift Schedule')}</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {__('Indicate the days and hours you will be working at the facilities.')}
                                </p>

                                <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                    {profileData.jornada_laboral.map((jornada, idx) => (
                                        <div key={jornada.dia} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b last:border-0 border-slate-100 dark:border-slate-800/50">
                                            <div className="flex items-center gap-3 w-36">
                                                <Switch
                                                    checked={jornada.activo}
                                                    onCheckedChange={(checked) => {
                                                        const updated = [...profileData.jornada_laboral];
                                                        updated[idx].activo = checked;
                                                        setProfileData(p => ({ ...p, jornada_laboral: updated }));
                                                    }}
                                                />
                                                <Label className="font-semibold text-sm cursor-pointer">{__(jornada.dia)}</Label>
                                            </div>

                                            <div className="flex items-center gap-4 flex-1 max-w-md">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-xs text-slate-500">{__('In:')}</span>
                                                    <Input
                                                        type="time"
                                                        value={jornada.hora_ingreso}
                                                        disabled={!jornada.activo}
                                                        onChange={(e) => {
                                                            const updated = [...profileData.jornada_laboral];
                                                            updated[idx].hora_ingreso = e.target.value;
                                                            setProfileData(p => ({ ...p, jornada_laboral: updated }));
                                                        }}
                                                        className="h-8 py-1 px-2 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-805"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-xs text-slate-500">{__('Out:')}</span>
                                                    <Input
                                                        type="time"
                                                        value={jornada.hora_salida}
                                                        disabled={!jornada.activo}
                                                        onChange={(e) => {
                                                            const updated = [...profileData.jornada_laboral];
                                                            updated[idx].hora_salida = e.target.value;
                                                            setProfileData(p => ({ ...p, jornada_laboral: updated }));
                                                        }}
                                                        className="h-8 py-1 px-2 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-805"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Photographs Upload */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Required Photographs')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Please upload or capture your profile photos and ID document.')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Photo 1 */}
                                <div className="flex flex-col gap-2">
                                    <Label className="font-semibold">{__('Employee Photo 1 *')}</Label>
                                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[160px] bg-slate-50/50 dark:bg-slate-950/20">
                                        {photos.foto_empleado ? (
                                            <div className="relative w-28 h-28 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg group">
                                                <img src={photos.foto_empleado} className="w-full h-full object-cover" />
                                                <Button type="button" size="xs" variant="destructive" className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => setPhotos(p => ({ ...p, foto_empleado: '' }))}>{__('Delete')}</Button>
                                            </div>
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-slate-400" />
                                        )}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.foto_empleado.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />{__('Upload')}</Button>
                                            <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('photo', 'foto_empleado')}><CameraIcon className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                        </div>
                                        <input type="file" accept="image/*" ref={fileRefs.foto_empleado} className="hidden" onChange={(e) => handleFileChange(e, 'foto_empleado', 'photo')} />
                                    </div>
                                    {errors.foto_empleado && <span className="text-xs text-rose-500">{errors.foto_empleado}</span>}
                                </div>

                                {/* Photo 2 */}
                                <div className="flex flex-col gap-2">
                                    <Label className="font-semibold">{__('Employee Photo 2 *')}</Label>
                                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[160px] bg-slate-50/50 dark:bg-slate-950/20">
                                        {photos.foto_empleado_2 ? (
                                            <div className="relative w-28 h-28 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg group">
                                                <img src={photos.foto_empleado_2} className="w-full h-full object-cover" />
                                                <Button type="button" size="xs" variant="destructive" className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => setPhotos(p => ({ ...p, foto_empleado_2: '' }))}>{__('Delete')}</Button>
                                            </div>
                                        ) : (
                                            <UserIcon className="w-10 h-10 text-slate-400" />
                                        )}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.foto_empleado_2.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />{__('Upload')}</Button>
                                            <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('photo', 'foto_empleado_2')}><CameraIcon className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                        </div>
                                        <input type="file" accept="image/*" ref={fileRefs.foto_empleado_2} className="hidden" onChange={(e) => handleFileChange(e, 'foto_empleado_2', 'photo')} />
                                    </div>
                                    {errors.foto_empleado_2 && <span className="text-xs text-rose-500">{errors.foto_empleado_2}</span>}
                                </div>

                                {/* ID Front */}
                                <div className="flex flex-col gap-2">
                                    <Label className="font-semibold">{__('ID Document Photo (Front) *')}</Label>
                                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[160px] bg-slate-50/50 dark:bg-slate-950/20">
                                        {photos.foto_documento ? (
                                            <div className="relative w-44 aspect-[3/2] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md group">
                                                <img src={photos.foto_documento} className="w-full h-full object-cover" />
                                                <Button type="button" size="xs" variant="destructive" className="absolute inset-0 bg-red-660/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => setPhotos(p => ({ ...p, foto_documento: '' }))}>{__('Delete')}</Button>
                                            </div>
                                        ) : (
                                            <FileText className="w-10 h-10 text-slate-400" />
                                        )}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.foto_documento.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />{__('Upload')}</Button>
                                            <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('photo', 'foto_documento')}><CameraIcon className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                        </div>
                                        <input type="file" accept="image/*" ref={fileRefs.foto_documento} className="hidden" onChange={(e) => handleFileChange(e, 'foto_documento', 'photo')} />
                                    </div>
                                    {errors.foto_documento && <span className="text-xs text-rose-500">{errors.foto_documento}</span>}
                                </div>

                                {/* ID Reverse */}
                                <div className="flex flex-col gap-2">
                                    <Label className="font-semibold">{__('ID Document Photo (Reverse) *')}</Label>
                                    <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 min-h-[160px] bg-slate-50/50 dark:bg-slate-950/20">
                                        {photos.foto_documento_reverso ? (
                                            <div className="relative w-44 aspect-[3/2] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md group">
                                                <img src={photos.foto_documento_reverso} className="w-full h-full object-cover" />
                                                <Button type="button" size="xs" variant="destructive" className="absolute inset-0 bg-red-660/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={() => setPhotos(p => ({ ...p, foto_documento_reverso: '' }))}>{__('Delete')}</Button>
                                            </div>
                                        ) : (
                                            <FileText className="w-10 h-10 text-slate-400" />
                                        )}
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.foto_documento_reverso.current?.click()}><Upload className="w-3.5 h-3.5 mr-1" />{__('Upload')}</Button>
                                            <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('photo', 'foto_documento_reverso')}><CameraIcon className="w-3.5 h-3.5 mr-1" />{__('Camera')}</Button>
                                        </div>
                                        <input type="file" accept="image/*" ref={fileRefs.foto_documento_reverso} className="hidden" onChange={(e) => handleFileChange(e, 'foto_documento_reverso', 'photo')} />
                                    </div>
                                    {errors.foto_documento_reverso && <span className="text-xs text-rose-500">{errors.foto_documento_reverso}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Vehicle Registration */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-4 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Vehicles')}</h2>
                                    <p className="text-xs text-slate-550 dark:text-slate-400">{__('Register the vehicle you will be driving to the office (optional).')}</p>
                                </div>
                                {!showVehicleForm && (
                                    <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowVehicleForm(true)}>
                                        <Plus className="w-4 h-4 mr-1" /> {__('Add Vehicle')}
                                    </Button>
                                )}
                            </div>

                            {showVehicleForm && (
                                <div className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>{__('Vehicle Type *')}</Label>
                                            <Select
                                                value={newVehicle.tipo_vehiculo}
                                                onValueChange={(val) => setNewVehicle(prev => ({ ...prev, tipo_vehiculo: val }))}
                                            >
                                                <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
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
                                                className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>{__('Model *')}</Label>
                                            <Input
                                                value={newVehicle.modelo}
                                                onChange={(e) => setNewVehicle(prev => ({ ...prev, modelo: e.target.value }))}
                                                placeholder="Ej: Hilux, Aveo"
                                                className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>{__('Year *')}</Label>
                                            <Input
                                                type="number"
                                                value={newVehicle.year}
                                                onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                                                placeholder="Ej: 2020"
                                                className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label>{__('License Plate *')}</Label>
                                            <Input
                                                value={newVehicle.placa}
                                                onChange={(e) => setNewVehicle(prev => ({ ...prev, placa: e.target.value }))}
                                                placeholder="Ej: ABC-1234"
                                                className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                                            />
                                        </div>

                                        {/* Front Photo */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-xs font-semibold">{__('Front Photo')}</Label>
                                            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-2 min-h-[120px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {newVehicle.foto_frontal ? (
                                                    <div className="relative w-24 h-16 rounded overflow-hidden border">
                                                        <img src={newVehicle.foto_frontal} className="w-full h-full object-cover" />
                                                        <Button type="button" size="xs" variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 rounded-none animate-none" onClick={() => setNewVehicle(prev => ({ ...prev, foto_frontal: '' }))}>X</Button>
                                                    </div>
                                                ) : <span className="text-xs text-slate-500">{__('No photo')}</span>}
                                                <div className="flex gap-1.5">
                                                    <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.vehiculo_frontal.current?.click()}>{__('Upload')}</Button>
                                                    <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('vehicle', 'foto_frontal')}>{__('Camera')}</Button>
                                                </div>
                                            </div>
                                            <input type="file" accept="image/*" ref={fileRefs.vehiculo_frontal} className="hidden" onChange={(e) => handleFileChange(e, 'foto_frontal', 'vehicle')} />
                                        </div>

                                        {/* Rear Photo */}
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-xs font-semibold">{__('Rear Photo')}</Label>
                                            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center gap-2 min-h-[120px] bg-slate-50/50 dark:bg-slate-900/10">
                                                {newVehicle.foto_trasera ? (
                                                    <div className="relative w-24 h-16 rounded overflow-hidden border">
                                                        <img src={newVehicle.foto_trasera} className="w-full h-full object-cover" />
                                                        <Button type="button" size="xs" variant="destructive" className="absolute top-0 right-0 h-4 w-4 p-0 rounded-none animate-none" onClick={() => setNewVehicle(prev => ({ ...prev, foto_trasera: '' }))}>X</Button>
                                                    </div>
                                                ) : <span className="text-xs text-slate-500">{__('No photo')}</span>}
                                                <div className="flex gap-1.5">
                                                    <Button type="button" variant="outline" size="xs" onClick={() => fileRefs.vehiculo_trasera.current?.click()}>{__('Upload')}</Button>
                                                    <Button type="button" variant="outline" size="xs" onClick={() => handleOpenCamera('vehicle', 'foto_trasera')}>{__('Camera')}</Button>
                                                </div>
                                            </div>
                                            <input type="file" accept="image/*" ref={fileRefs.vehiculo_trasera} className="hidden" onChange={(e) => handleFileChange(e, 'foto_trasera', 'vehicle')} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850 mt-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => setShowVehicleForm(false)}>{__('Cancel')}</Button>
                                        <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
                                            if (!newVehicle.tipo_vehiculo || !newVehicle.marca || !newVehicle.modelo || !newVehicle.year || !newVehicle.placa) {
                                                alert(__('All vehicle fields are required.'));
                                                return;
                                            }
                                            setVehicles(prev => [...prev, newVehicle]);
                                            setNewVehicle({ tipo_vehiculo: '', marca: '', modelo: '', year: '', placa: '', foto_frontal: '', foto_trasera: '' });
                                            setShowVehicleForm(false);
                                        }}>{__('Save Vehicle')}</Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {(vehicles.length === 0) ? (
                                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/10">
                                        <Car className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                        <p className="text-sm font-medium">{__('No vehicles registered.')}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {vehicles.map((veh, i) => (
                                            <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                                                        {veh.foto_frontal ? <img src={veh.foto_frontal} className="w-full h-full object-cover" /> : <Car className="w-6 h-6 text-slate-400 dark:text-slate-750" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-sm block text-slate-800 dark:text-slate-200">{veh.marca} {veh.modelo} ({veh.year})</span>
                                                        <span className="text-xs text-slate-500 font-mono">{__('License Plate:')} {veh.placa} • {__((veh.tipo_vehiculo || '').toUpperCase())}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setVehicles(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Review Summary & Declaration */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{__('Review & Declaration')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{__('Review the information carefully before submitting.')}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{__('Personal Details')}</h3>
                                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                                        <div><span className="text-slate-500">{__('Name:')}</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{preRegistro.nombres} {preRegistro.apellidos}</span></div>
                                        <div><span className="text-slate-500">{__('ID / Passport:')}</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{profileData.documento_identidad}</span></div>
                                        <div><span className="text-slate-500">{__('Phone:')}</span> <span className="text-slate-700 dark:text-slate-300 font-medium">+{activePais?.codigo_telefonico} {preRegistro.telefono}</span></div>
                                        <div><span className="text-slate-500">{__('Email:')}</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{profileData.correo || '-'}</span></div>
                                        <div><span className="text-slate-500">{__('Reason for registration:')}</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{preRegistro.motivo_registro}</span></div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{__('Registered Photographs')}</h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center space-y-1">
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><img src={photos.foto_empleado} className="w-full h-full object-cover" /></div>
                                            <span className="text-[10px] text-slate-500 block">{__('Photo 1')}</span>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><img src={photos.foto_empleado_2} className="w-full h-full object-cover" /></div>
                                            <span className="text-[10px] text-slate-500 block">{__('Photo 2')}</span>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><img src={photos.foto_documento} className="w-full h-full object-cover" /></div>
                                            <span className="text-[10px] text-slate-500 block">{__('ID Front')}</span>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><img src={photos.foto_documento_reverso} className="w-full h-full object-cover" /></div>
                                            <span className="text-[10px] text-slate-500 block">{__('ID Reverse')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{__('Registered Vehicles')} ({vehicles.length})</h3>
                                    {vehicles.length === 0 ? (
                                        <span className="text-xs text-slate-500">{__('No vehicles registered.')}</span>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {vehicles.map((v, i) => (
                                                <div key={i} className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 flex items-center gap-2">
                                                    <Car className="w-4 h-4 text-slate-450" />
                                                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{v.marca} {v.modelo} - {v.placa}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-5 space-y-3 mt-6">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <h4 className="text-sm font-bold">{__('Declaration of Responsibility')}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {__('By clicking "Submit Registration", you declare under oath that all information provided in this wizard, including attached photographs (profile pictures and ID document scans) is true and current, assuming any corresponding legal responsibility.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation Buttons */}
                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/85 pt-6 mt-4">
                        {step > 1 ? (
                            <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} className="border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900">
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                {__('Back')}
                            </Button>
                        ) : (
                            <div></div>
                        )}

                        {step < 4 ? (
                            <Button type="button" onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {__('Next')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6">
                                {isSubmitting ? __('Processing...') : __('Submit Registration')}
                            </Button>
                        )}
                    </div>
                </div>
            </main>

            {/* Webcam Camera Modal Window */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-center p-6">
                    <div className="relative max-w-md w-full bg-slate-950 border border-slate-850 rounded-3xl p-6 flex flex-col items-center gap-4 text-white">
                        <span className="text-sm font-bold tracking-wide text-slate-200">{__('Capture Photograph')}</span>
                        <div className="relative aspect-[4/3] w-full max-h-[300px] bg-black rounded-2xl overflow-hidden border border-slate-800">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                        </div>
                        <div className="flex gap-4">
                            <Button type="button" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white" onClick={() => setIsCameraOpen(false)}>{__('Cancel')}</Button>
                            <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={capturePhoto}><CameraIcon className="w-4 h-4 mr-1.5" />{__('Capture')}</Button>
                        </div>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                </div>
            )}
        </div>
    );
}
