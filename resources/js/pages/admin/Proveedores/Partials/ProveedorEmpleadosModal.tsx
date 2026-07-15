import React, { useState, useEffect } from 'react';
import {
    X,
    Users,
    UserPlus,
    Trash2,
    Pencil,
    Eye,
    Mail,
    Briefcase,
    Calendar,
    ShieldAlert,
    UploadCloud,
    CheckCircle,
    User,
    FileText,
    IdCard,
    ArrowLeft,
    Check,
    Camera,
} from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface Pais {
    id: number;
    nombre: string;
    codigo_iso2: string;
}

interface Proveedor {
    id: number;
    razon_social: string;
}

interface ProveedorEmpleado {
    id: number;
    proveedor_id: number;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    genero?: string | null;
    fecha_nacimiento?: string | null;
    edad?: number | null;
    correo?: string | null;
    cargo?: string | null;
    foto_carnet?: string | null;
    documento_frontal?: string | null;
    documento_reverso?: string | null;
}

interface ProveedorEmpleadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
    paises: Pais[];
}

const initialForm = {
    nombres: '',
    apellidos: '',
    documento_identidad: '',
    genero: '',
    fecha_nacimiento: '',
    edad: 0,
    correo: '',
    cargo: '',
    foto_carnet: null as File | null,
    documento_frontal: null as File | null,
    documento_reverso: null as File | null,
};

export default function ProveedorEmpleadosModal({
    isOpen,
    onClose,
    proveedor,
    paises,
}: ProveedorEmpleadosModalProps) {
    const { __ } = useTranslate();

    // ── Estados ────────────────────────────────────────────────────────────────
    const [employees, setEmployees] = useState<ProveedorEmpleado[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<ProveedorEmpleado | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    
    // Formulario local
    const [form, setForm] = useState({ ...initialForm });
    
    // Previsualizaciones de archivos cargados
    const [previews, setPreviews] = useState({
        foto_carnet: '',
        documento_frontal: '',
        documento_reverso: '',
    });

    // Visor de documentos (Lightbox)
    const [viewingDocsEmployee, setViewingDocsEmployee] = useState<ProveedorEmpleado | null>(null);

    // Cámara Web
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<'foto_carnet' | 'documento_frontal' | 'documento_reverso' | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    // Limpieza de cámara en desmontaje
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [cameraStream]);

    // ── Cargar empleados cuando abre el modal ──────────────────────────────────
    useEffect(() => {
        if (isOpen && proveedor) {
            loadEmployees();
            handleResetForm();
        }
    }, [isOpen, proveedor]);

    // ── Calcular edad automáticamente a partir de fecha_nacimiento ─────────────
    useEffect(() => {
        if (form.fecha_nacimiento) {
            const birthDate = new Date(form.fecha_nacimiento);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                calculatedAge--;
            }
            setForm((prev) => ({
                ...prev,
                edad: calculatedAge >= 0 ? calculatedAge : 0,
            }));
        } else {
            setForm((prev) => ({ ...prev, edad: 0 }));
        }
    }, [form.fecha_nacimiento]);

    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    const loadEmployees = async () => {
        if (!proveedor) return;
        try {
            setIsLoadingList(true);
            const response = await fetch(`/admin/proveedores/${proveedor.id}/empleados`, {
                headers: {
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setEmployees(data.employees || []);
                }
            }
        } catch (_) {
            toast.error(__('Failed to load employees list.'));
        } finally {
            setIsLoadingList(false);
        }
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
        setPreviews({ foto_carnet: '', documento_frontal: '', documento_reverso: '' });
        setEditingEmployee(null);
        setValidationErrors({});
    };

    const handleOpenCamera = async (field: 'foto_carnet' | 'documento_frontal' | 'documento_reverso') => {
        setActiveCameraField(field);
        setIsCameraOpen(true);

        const facingMode = field === 'foto_carnet' ? 'user' : { ideal: 'environment' };

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
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
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (activeCameraField === 'foto_carnet') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
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

    // Cargar empleado en el formulario de edición (Izquierda)
    const handleEditClick = (emp: ProveedorEmpleado) => {
        setEditingEmployee(emp);
        setValidationErrors({});
        setForm({
            nombres: emp.nombres || '',
            apellidos: emp.apellidos || '',
            documento_identidad: emp.documento_identidad || '',
            genero: emp.genero || '',
            fecha_nacimiento: emp.fecha_nacimiento || '',
            edad: emp.edad || 0,
            correo: emp.correo || '',
            cargo: emp.cargo || '',
            foto_carnet: null,
            documento_frontal: null,
            documento_reverso: null,
        });

        setPreviews({
            foto_carnet: emp.foto_carnet ? `/storage/${emp.foto_carnet}` : '',
            documento_frontal: emp.documento_frontal ? `/storage/${emp.documento_frontal}` : '',
            documento_reverso: emp.documento_reverso ? `/storage/${emp.documento_reverso}` : '',
        });
    };

    // ── Enviar Formulario (Creación o Actualización) ───────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedor) return;

        try {
            setIsSubmitting(true);
            setValidationErrors({});

            const formData = new FormData();
            formData.append('nombres', form.nombres);
            formData.append('apellidos', form.apellidos);
            formData.append('documento_identidad', form.documento_identidad);
            formData.append('genero', form.genero);
            formData.append('fecha_nacimiento', form.fecha_nacimiento);
            formData.append('edad', String(form.edad));
            formData.append('correo', form.correo);
            formData.append('cargo', form.cargo);

            if (form.foto_carnet) formData.append('foto_carnet', form.foto_carnet);
            if (form.documento_frontal) formData.append('documento_frontal', form.documento_frontal);
            if (form.documento_reverso) formData.append('documento_reverso', form.documento_reverso);

            let url = `/admin/proveedores/${proveedor.id}/empleados`;
            if (editingEmployee) {
                // Post con _method para soportar imágenes en la actualización
                formData.append('_method', 'POST');
                url = `/admin/proveedor-empleados/${editingEmployee.id}`;
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
                toast.success(editingEmployee ? __('Employee updated successfully.') : __('Employee added successfully.'));
                handleResetForm();
                loadEmployees();
            } else if (response.status === 422) {
                const errors = resData.errors || {};
                const flatErrors: Record<string, string> = {};
                Object.keys(errors).forEach((key) => {
                    flatErrors[key] = errors[key][0];
                });
                setValidationErrors(flatErrors);
                toast.error(__('Please correct the errors in the form.'));
            } else {
                toast.error(__('An error occurred while saving the employee.'));
            }
        } catch (error) {
            toast.error(__('An error occurred while saving the employee.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Eliminar Empleado del Carrito ──────────────────────────────────────────
    const handleDeleteClick = async (empId: number) => {
        if (!confirm(__('Are you sure you want to remove this employee?'))) return;

        try {
            const response = await fetch(`/admin/proveedor-empleados/${empId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                }
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.success) {
                    toast.success(__('Employee removed successfully.'));
                    loadEmployees();
                    if (editingEmployee?.id === empId) {
                        handleResetForm();
                    }
                }
            }
        } catch (_) {
            toast.error(__('Failed to delete employee.'));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[94vw] lg:max-w-[1260px] xl:max-w-[1360px] w-full max-h-[92vh] overflow-y-auto p-8 flex flex-col">
                
                <DialogHeader className="border-b pb-5">
                    <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800 dark:text-slate-100">
                        <Users className="w-8 h-8 text-[#104a29]" />
                        {__('Supplier Employees')}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {__('Manage the payroll of employees belonging to')} <span className="font-semibold text-slate-800 dark:text-slate-200">{proveedor?.razon_social}</span>.
                    </DialogDescription>
                </DialogHeader>

                {/* ══ Estructura Dividida: Formulario (Izq) y Carrito (Der) ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 flex-1 min-h-0">
                    
                    {/* ── Columna Izquierda: Formulario (42%) ── */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800/80 h-fit space-y-6">
                        <div className="flex items-center justify-between border-b pb-3 mb-2">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
                                <UserPlus className="w-5 h-5 text-[#104a29]" />
                                {editingEmployee ? __('Edit Employee') : __('Add Employee')}
                            </h3>
                            {editingEmployee && (
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

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Nombres */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_nombres" className="text-sm font-medium">{__('First Name')} *</Label>
                                    <Input
                                        id="emp_nombres"
                                        value={form.nombres}
                                        onChange={(e) => setForm((prev) => ({ ...prev, nombres: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.nombres && 'border-rose-500')}
                                        required
                                    />
                                    {validationErrors.nombres && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.nombres}</p>
                                    )}
                                </div>

                                {/* Apellidos */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_apellidos" className="text-sm font-medium">{__('Last Name')} *</Label>
                                    <Input
                                        id="emp_apellidos"
                                        value={form.apellidos}
                                        onChange={(e) => setForm((prev) => ({ ...prev, apellidos: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.apellidos && 'border-rose-500')}
                                        required
                                    />
                                    {validationErrors.apellidos && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.apellidos}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Documento Identidad */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_doc" className="text-sm font-medium">{__('Identity Document')} *</Label>
                                    <Input
                                        id="emp_doc"
                                        value={form.documento_identidad}
                                        onChange={(e) => setForm((prev) => ({ ...prev, documento_identidad: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.documento_identidad && 'border-rose-500')}
                                        required
                                    />
                                    {validationErrors.documento_identidad && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.documento_identidad}</p>
                                    )}
                                </div>

                                {/* Género */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_genero" className="text-sm font-medium">{__('Gender')}</Label>
                                    <Select
                                        value={form.genero}
                                        onValueChange={(v) => setForm((prev) => ({ ...prev, genero: v }))}
                                    >
                                        <SelectTrigger id="emp_genero" className="h-10 text-sm w-full">
                                            <SelectValue placeholder={__('Select')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="masculino">{__('Masculino')}</SelectItem>
                                            <SelectItem value="femenino">{__('Femenino')}</SelectItem>
                                            <SelectItem value="otro">{__('Otro')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Fecha de Nacimiento */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_birth" className="text-sm font-medium">{__('Date of Birth')}</Label>
                                    <Input
                                        id="emp_birth"
                                        type="date"
                                        value={form.fecha_nacimiento}
                                        onChange={(e) => setForm((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))}
                                        className="h-10 text-sm cursor-pointer"
                                    />
                                </div>

                                {/* Edad (Auto-calculada) */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_age" className="text-sm font-medium">{__('Age')}</Label>
                                    <Input
                                        id="emp_age"
                                        type="number"
                                        value={form.edad}
                                        readOnly
                                        className="h-10 text-sm bg-muted text-muted-foreground select-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Correo */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_email" className="text-sm font-medium">{__('Email')}</Label>
                                    <Input
                                        id="emp_email"
                                        type="email"
                                        value={form.correo}
                                        onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.correo && 'border-rose-500')}
                                    />
                                    {validationErrors.correo && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.correo}</p>
                                    )}
                                </div>

                                {/* Cargo */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="emp_cargo" className="text-sm font-medium">{__('Position')}</Label>
                                    <Input
                                        id="emp_cargo"
                                        value={form.cargo}
                                        onChange={(e) => setForm((prev) => ({ ...prev, cargo: e.target.value }))}
                                        className="h-10 text-sm"
                                        placeholder="Ej: Conductor, Supervisor"
                                    />
                                </div>
                            </div>

                            {/* ── File Uploaders (Carnet + Doc Front + Doc Back) ── */}
                            <div className="space-y-4 pt-3 border-t">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {__('Photos & Documentation')}
                                </Label>

                                {/* Uploader 1: Foto Carnet */}
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground block font-medium">{__('ID Badge Photo (Foto Carnet)')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                            {previews.foto_carnet ? (
                                                <img src={previews.foto_carnet} className="object-cover w-full h-full" alt="Carnet Preview" />
                                            ) : (
                                                <User className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors px-2">
                                                <UploadCloud className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span className="truncate">{form.foto_carnet ? __('Change') : __('Upload')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'foto_carnet')}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleOpenCamera('foto_carnet')}
                                                className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 border-dashed hover:bg-slate-50 shrink-0"
                                            >
                                                <Camera className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span>{__('Take Photo')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {validationErrors.foto_carnet && (
                                        <p className="text-xs text-rose-500">{validationErrors.foto_carnet}</p>
                                    )}
                                </div>

                                {/* Uploader 2: Documentación Frontal */}
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground block font-medium">{__('Document Front Side (Cara Frontal)')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                            {previews.documento_frontal ? (
                                                <img src={previews.documento_frontal} className="object-cover w-full h-full" alt="Front Preview" />
                                            ) : (
                                                <IdCard className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors px-2">
                                                <UploadCloud className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span className="truncate">{form.documento_frontal ? __('Change') : __('Upload')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'documento_frontal')}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleOpenCamera('documento_frontal')}
                                                className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 border-dashed hover:bg-slate-50 shrink-0"
                                            >
                                                <Camera className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span>{__('Take Photo')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {validationErrors.documento_frontal && (
                                        <p className="text-xs text-rose-500">{validationErrors.documento_frontal}</p>
                                    )}
                                </div>

                                {/* Uploader 3: Documentación Reverso */}
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground block font-medium">{__('Document Back Side (Cara Reverso)')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                            {previews.documento_reverso ? (
                                                <img src={previews.documento_reverso} className="object-cover w-full h-full" alt="Back Preview" />
                                            ) : (
                                                <IdCard className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors px-2">
                                                <UploadCloud className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span className="truncate">{form.documento_reverso ? __('Change') : __('Upload')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'documento_reverso')}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleOpenCamera('documento_reverso')}
                                                className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 border-dashed hover:bg-slate-50 shrink-0"
                                            >
                                                <Camera className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span>{__('Take Photo')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {validationErrors.documento_reverso && (
                                        <p className="text-xs text-rose-500">{validationErrors.documento_reverso}</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#104a29] hover:bg-[#0c371e] text-white h-11 text-sm font-semibold flex items-center justify-center gap-2 mt-6"
                            >
                                {isSubmitting ? (
                                    <span>{__('Saving...')}</span>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>{editingEmployee ? __('Update Employee') : __('Add Employee')}</span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* ── Columna Derecha: El Carrito (58%) ── */}
                    <div className="lg:col-span-7 flex flex-col min-h-[300px]">
                        
                        {/* Cabecera del Carrito */}
                        <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                    {__('Added Employees')}
                                </span>
                                <span className="bg-[#104a29]/10 text-[#104a29] dark:bg-[#104a29]/20 text-sm px-3 py-0.5 rounded-full font-bold">
                                    {employees.length}
                                </span>
                            </div>
                        </div>

                        {/* Lista del Carrito con Scroll */}
                        <div className="flex-1 pr-1 space-y-4">
                            {isLoadingList ? (
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                                    {__('Loading payroll list...')}
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="h-56 border border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/10">
                                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm font-semibold text-slate-500">{__('No employees added yet')}</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                                        {__('Use the form on the left to start adding employees to this supplier.')}
                                    </p>
                                </div>
                            ) : (
                                employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className={cn(
                                            'p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-800',
                                            editingEmployee?.id === emp.id && 'border-[#104a29]/40 ring-1 ring-[#104a29]/20 bg-[#104a29]/5 dark:bg-[#104a29]/5'
                                        )}
                                    >
                                        {/* Datos e Imagen */}
                                        <div className="flex items-center gap-4">
                                            {/* Foto de carnet miniatura */}
                                            <div className="w-14 h-14 rounded-full border bg-slate-100 overflow-hidden shrink-0">
                                                {emp.foto_carnet ? (
                                                    <img
                                                        src={`/storage/${emp.foto_carnet}`}
                                                        className="object-cover w-full h-full"
                                                        alt={`${emp.nombres} profile`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-sm uppercase">
                                                        {emp.nombres[0]}{emp.apellidos[0]}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                                                    {emp.nombres} {emp.apellidos}
                                                </p>
                                                
                                                {/* Meta-badges */}
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                                                        {emp.documento_identidad}
                                                    </span>
                                                    {emp.cargo && (
                                                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Briefcase className="w-3 h-3 shrink-0" />
                                                            {emp.cargo}
                                                        </span>
                                                    )}
                                                    {emp.edad !== null && (
                                                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Calendar className="w-3 h-3 shrink-0" />
                                                            {emp.edad} {__('years')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de acción al final */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            
                                            {/* Botón Ver Documentos (Visor de ID) */}
                                            {(emp.documento_frontal || emp.documento_reverso) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewingDocsEmployee(emp)}
                                                    className="h-9 text-xs flex items-center gap-1 px-3 border-slate-200 hover:bg-slate-100"
                                                >
                                                    <Eye className="w-4 h-4 text-[#104a29]" />
                                                    <span>{__('Docs')}</span>
                                                </Button>
                                            )}

                                            {/* Editar */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(emp)}
                                                className="h-9 w-9 text-slate-600 hover:text-slate-900"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>

                                            {/* Eliminar */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(emp.id)}
                                                className="h-9 w-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>

                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>

                </div>

            </DialogContent>

            {/* ══ SUB-DIALOG: Visor Lightbox de Documentos Lado a Lado (Identificación) ══ */}
            <Dialog open={viewingDocsEmployee !== null} onOpenChange={(open) => !open && setViewingDocsEmployee(null)}>
                <DialogContent className="max-w-4xl p-6">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="flex items-center gap-2 text-md">
                            <IdCard className="w-5 h-5 text-[#104a29]" />
                            {__('Documentation View')} - {viewingDocsEmployee?.nombres} {viewingDocsEmployee?.apellidos}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Visor side-by-side estilo tarjetas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        
                        {/* Lado Frontal */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                {__('Front Side (Anverso)')}
                            </h4>
                            <div className="aspect-[1.6/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm relative group">
                                {viewingDocsEmployee?.documento_frontal ? (
                                    <img
                                        src={`/storage/${viewingDocsEmployee.documento_frontal}`}
                                        className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        alt="Document Front"
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">{__('No image uploaded')}</span>
                                )}
                            </div>
                        </div>

                        {/* Lado Reverso */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                {__('Back Side (Reverso)')}
                            </h4>
                            <div className="aspect-[1.6/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm relative group">
                                {viewingDocsEmployee?.documento_reverso ? (
                                    <img
                                        src={`/storage/${viewingDocsEmployee.documento_reverso}`}
                                        className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        alt="Document Back"
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">{__('No image uploaded')}</span>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end mt-6 border-t pt-4">
                        <Button
                            type="button"
                            onClick={() => setViewingDocsEmployee(null)}
                            className="bg-slate-800 text-white hover:bg-slate-700 h-9 px-4 text-xs"
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
                            {__('Take Photo')} - {
                                activeCameraField === 'foto_carnet' ? __('Profile Photo') :
                                activeCameraField === 'documento_frontal' ? __('Document Front') : __('Document Back')
                            }
                        </DialogTitle>
                    </DialogHeader>

                    {/* Live Stream View */}
                    <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ transform: activeCameraField === 'foto_carnet' ? 'scaleX(-1)' : 'none' }}
                        />
                    </div>

                    <div className="flex justify-between w-full mt-6 gap-3 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseCamera}
                            className="h-10 px-4 text-xs"
                        >
                            {__('Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCapturePhoto}
                            className="bg-[#104a29] hover:bg-[#0c371e] text-white h-10 px-6 text-xs font-semibold flex items-center gap-2"
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
