import React, { useState, useEffect, useRef } from 'react';
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
    RefreshCw,
    SwitchCamera,
} from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

interface Productor {
    id: number;
    razon_social: string;
}

interface ProductorEmpleado {
    id: number;
    productor_id: number;
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

interface ProductorEmpleadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    productor: Productor | null;
}

type PhotoTarget = 'foto' | 'frontal' | 'reverso';

export default function ProductorEmpleadosModal({
    isOpen,
    onClose,
    productor,
}: ProductorEmpleadosModalProps) {
    const { __ } = useTranslate();
    const [employees, setEmployees] = useState<ProductorEmpleado[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [editingEmployee, setEditingEmployee] = useState<ProductorEmpleado | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<ProductorEmpleado | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Camera state
    const [activeCameraTarget, setActiveCameraTarget] = useState<PhotoTarget | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        documento_identidad: '',
        genero: '',
        fecha_nacimiento: '',
        correo: '',
        cargo: '',
    });

    const [fotoCarnet, setFotoCarnet] = useState<File | null>(null);
    const [docFrontal, setDocFrontal] = useState<File | null>(null);
    const [docReverso, setDocReverso] = useState<File | null>(null);

    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const [previewFrontal, setPreviewFrontal] = useState<string | null>(null);
    const [previewReverso, setPreviewReverso] = useState<string | null>(null);

    // Fetch employees
    const fetchEmployees = async () => {
        if (!productor) return;
        setLoading(true);
        try {
            const response = await fetch(`/admin/productores/${productor.id}/empleados`);
            const data = await response.json();
            if (data.success) {
                setEmployees(data.employees);
            }
        } catch (e) {
            toast.error(__('Error al cargar colaboradores'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && productor) {
            fetchEmployees();
            resetForm();
            setIsAdding(false);
            setEditingEmployee(null);
            setViewingEmployee(null);
            stopCamera();
        }
    }, [isOpen, productor]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setActiveCameraTarget(null);
    };

    const startCamera = async (target: PhotoTarget, mode?: 'user' | 'environment') => {
        stopCamera();
        const selectedMode = mode || (target === 'foto' ? 'user' : 'environment');
        setFacingMode(selectedMode);
        setActiveCameraTarget(target);

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
            toast.error(__('No se pudo acceder a la cámara. Por favor otorgue permisos.'));
            setActiveCameraTarget(null);
        }
    };

    // Attach stream to video element when activeCameraTarget changes
    useEffect(() => {
        if (activeCameraTarget && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [activeCameraTarget]);

    const capturePhoto = () => {
        if (!videoRef.current || !activeCameraTarget) return;

        const video = videoRef.current;
        const vWidth = video.videoWidth || 640;
        const vHeight = video.videoHeight || 480;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (activeCameraTarget === 'foto') {
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

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const fileName = `${activeCameraTarget}_${Date.now()}.jpg`;
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                const previewUrl = URL.createObjectURL(blob);

                if (activeCameraTarget === 'foto') {
                    setFotoCarnet(file);
                    setPreviewFoto(previewUrl);
                } else if (activeCameraTarget === 'frontal') {
                    setDocFrontal(file);
                    setPreviewFrontal(previewUrl);
                } else if (activeCameraTarget === 'reverso') {
                    setDocReverso(file);
                    setPreviewReverso(previewUrl);
                }

                toast.success(__('Fotografía capturada correctamente'));
                stopCamera();
            },
            'image/jpeg',
            0.9
        );
    };

    const resetForm = () => {
        setFormData({
            nombres: '',
            apellidos: '',
            documento_identidad: '',
            genero: '',
            fecha_nacimiento: '',
            correo: '',
            cargo: '',
        });
        setFotoCarnet(null);
        setDocFrontal(null);
        setDocReverso(null);
        setPreviewFoto(null);
        setPreviewFrontal(null);
        setPreviewReverso(null);
        stopCamera();
    };

    const handleEdit = (emp: ProductorEmpleado) => {
        setEditingEmployee(emp);
        setFormData({
            nombres: emp.nombres || '',
            apellidos: emp.apellidos || '',
            documento_identidad: emp.documento_identidad || '',
            genero: emp.genero || '',
            fecha_nacimiento: emp.fecha_nacimiento ? emp.fecha_nacimiento.split('T')[0] : '',
            correo: emp.correo || '',
            cargo: emp.cargo || '',
        });
        setPreviewFoto(emp.foto_carnet ? `/storage/${emp.foto_carnet}` : null);
        setPreviewFrontal(emp.documento_frontal ? `/storage/${emp.documento_frontal}` : null);
        setPreviewReverso(emp.documento_reverso ? `/storage/${emp.documento_reverso}` : null);
        setIsAdding(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(__('¿Está seguro de que desea eliminar a este colaborador?'))) return;
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const response = await fetch(`/admin/productor-empleados/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.success(__('Colaborador eliminado correctamente'));
                fetchEmployees();
            } else {
                toast.error(data.message || __('Error al eliminar colaborador'));
            }
        } catch (e) {
            toast.error(__('Error al eliminar colaborador'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productor) return;

        setSubmitting(true);
        const data = new FormData();
        data.append('nombres', formData.nombres);
        data.append('apellidos', formData.apellidos);
        data.append('documento_identidad', formData.documento_identidad);
        if (formData.genero) data.append('genero', formData.genero);
        if (formData.fecha_nacimiento) data.append('fecha_nacimiento', formData.fecha_nacimiento);
        if (formData.correo) data.append('correo', formData.correo);
        if (formData.cargo) data.append('cargo', formData.cargo);

        if (fotoCarnet) data.append('foto_carnet', fotoCarnet);
        if (docFrontal) data.append('documento_frontal', docFrontal);
        if (docReverso) data.append('documento_reverso', docReverso);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const url = editingEmployee 
                ? `/admin/productor-empleados/${editingEmployee.id}` 
                : `/admin/productores/${productor.id}/empleados`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: data,
            });

            const resData = await response.json();
            if (resData.success) {
                toast.success(editingEmployee ? __('Colaborador actualizado correctamente') : __('Colaborador registrado correctamente'));
                fetchEmployees();
                setIsAdding(false);
                setEditingEmployee(null);
                resetForm();
            } else {
                toast.error(resData.message || __('Error al guardar colaborador'));
            }
        } catch (e) {
            toast.error(__('Error al guardar colaborador'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!productor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { stopCamera(); onClose(); } }}>
            <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                <DialogHeader className="border-b pb-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                    {__('Colaboradores del Productor')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Rancho / Productor: <span className="font-semibold text-slate-700 dark:text-slate-300">{productor.razon_social}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        {!isAdding && !viewingEmployee && (
                            <Button 
                                onClick={() => { resetForm(); setIsAdding(true); setEditingEmployee(null); }}
                                size="sm" 
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <UserPlus className="h-4 w-4" />
                                {__('Agregar Colaborador')}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Overlay Cámara Web */}
                {activeCameraTarget && (
                    <div className="p-4 bg-slate-950 rounded-xl space-y-4 my-2 border border-slate-800 animate-in fade-in-50">
                        <div className="flex items-center justify-between text-white">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Camera className="h-4 w-4 text-emerald-400" />
                                {activeCameraTarget === 'foto' && __('Tomar Foto del Colaborador')}
                                {activeCameraTarget === 'frontal' && __('Tomar Foto Documento Frente')}
                                {activeCameraTarget === 'reverso' && __('Tomar Foto Documento Reverso')}
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="text-slate-400 hover:text-white"
                                onClick={() => startCamera(activeCameraTarget, facingMode === 'user' ? 'environment' : 'user')}
                            >
                                <SwitchCamera className="h-4 w-4 mr-1.5" />
                                {__('Cambiar Cámara')}
                            </Button>
                        </div>

                        <div className="relative aspect-video max-h-96 w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-slate-800">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="h-full w-full object-cover"
                            />

                            {/* Carnet / ID Overlay Frame for Employee Portrait Photo */}
                            {activeCameraTarget === 'foto' ? (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="relative w-52 h-64 md:w-60 md:h-72 border-2 border-emerald-400 border-dashed rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col items-center justify-center">
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/60 mb-2 mt-4" />
                                        <div className="w-36 h-20 rounded-t-full border-2 border-b-0 border-dashed border-emerald-400/60" />
                                        
                                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                                    </div>

                                    <div className="mt-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                                        <IdCard className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>{__('Alinee el rostro del colaborador dentro del recuadro carnet')}</span>
                                    </div>
                                </div>
                            ) : (
                                /* Document Frame Guide for ID Front / ID Reverse */
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                    <div className="relative w-80 h-52 md:w-96 md:h-60 border-2 border-emerald-400 border-dashed rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                                    </div>

                                    <div className="mt-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full border border-emerald-500/40 flex items-center gap-1.5 shadow-lg">
                                        <IdCard className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>{__('Coloque el documento dentro del recuadro')}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button variant="outline" type="button" onClick={stopCamera} className="text-slate-300 border-slate-700 hover:bg-slate-800">
                                {__('Cancelar')}
                            </Button>
                            <Button type="button" onClick={capturePhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                <Camera className="h-4 w-4" />
                                {__('Capturar Foto')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Viewing Employee Details */}
                {viewingEmployee ? (
                    <div className="space-y-6 py-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewingEmployee(null)}
                            className="gap-2 text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {__('Volver a la lista')}
                        </Button>
                        <div className="flex flex-col md:flex-row gap-6 items-start bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                            {viewingEmployee.foto_carnet ? (
                                <img 
                                    src={`/storage/${viewingEmployee.foto_carnet}`} 
                                    alt="Foto" 
                                    className="w-36 h-36 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                                />
                            ) : (
                                <div className="w-36 h-36 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <User className="h-14 w-14" />
                                </div>
                            )}
                            <div className="space-y-3 flex-1">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {viewingEmployee.nombres} {viewingEmployee.apellidos}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-slate-500">{__('RFC / Documento')}:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingEmployee.documento_identidad}</span></div>
                                    <div><span className="text-slate-500">{__('Cargo / Puesto')}:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingEmployee.cargo || '-'}</span></div>
                                    <div><span className="text-slate-500">{__('Género')}:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingEmployee.genero || '-'}</span></div>
                                    <div><span className="text-slate-500">{__('Fecha de Nacimiento')}:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingEmployee.fecha_nacimiento ? String(viewingEmployee.fecha_nacimiento).split('T')[0] : '-'}</span></div>
                                    <div><span className="text-slate-500">{__('Correo Electrónico')}:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingEmployee.correo || '-'}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3 block flex items-center gap-2">
                                    <IdCard className="h-4 w-4 text-[#104a29]" />
                                    {__('Documento Frente')}
                                </Label>
                                {viewingEmployee.documento_frontal ? (
                                    <img src={`/storage/${viewingEmployee.documento_frontal}`} alt="Front" className="w-full h-56 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                    <div className="w-full h-56 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-dashed flex items-center justify-center text-slate-400 text-xs">{__('Sin documento frontal')}</div>
                                )}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3 block flex items-center gap-2">
                                    <IdCard className="h-4 w-4 text-[#104a29]" />
                                    {__('Documento Reverso')}
                                </Label>
                                {viewingEmployee.documento_reverso ? (
                                    <img src={`/storage/${viewingEmployee.documento_reverso}`} alt="Reverse" className="w-full h-56 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                    <div className="w-full h-56 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-dashed flex items-center justify-center text-slate-400 text-xs">{__('Sin documento reverso')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : isAdding ? (
                    /* Form for Add/Edit */
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {editingEmployee ? __('Editar Colaborador') : __('Nuevo Colaborador')}
                            </h4>
                            <Button variant="ghost" size="sm" type="button" onClick={() => { stopCamera(); setIsAdding(false); }}>
                                {__('Cancelar')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label htmlFor="nombres">{__('Nombres')} *</Label>
                                <Input 
                                    id="nombres"
                                    required 
                                    className="mt-1.5 w-full"
                                    value={formData.nombres}
                                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="apellidos">{__('Apellidos')} *</Label>
                                <Input 
                                    id="apellidos"
                                    required 
                                    className="mt-1.5 w-full"
                                    value={formData.apellidos}
                                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="documento_identidad">{__('RFC / Documento de Identidad')} *</Label>
                                <Input 
                                    id="documento_identidad"
                                    required 
                                    className="mt-1.5 w-full"
                                    placeholder="ej. ABC123456789"
                                    value={formData.documento_identidad}
                                    onChange={(e) => setFormData({ ...formData, documento_identidad: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cargo">{__('Cargo / Puesto')}</Label>
                                <Input 
                                    id="cargo"
                                    className="mt-1.5 w-full"
                                    placeholder="ej. Supervisor de Cosecha"
                                    value={formData.cargo}
                                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="genero">{__('Género')}</Label>
                                <Select value={formData.genero} onValueChange={(val) => setFormData({ ...formData, genero: val })}>
                                    <SelectTrigger id="genero" className="mt-1.5 w-full">
                                        <SelectValue placeholder={__('Seleccionar género')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="masculino">{__('Masculino')}</SelectItem>
                                        <SelectItem value="femenino">{__('Femenino')}</SelectItem>
                                        <SelectItem value="otro">{__('Otro')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="fecha_nacimiento">{__('Fecha de Nacimiento')}</Label>
                                <Input 
                                    id="fecha_nacimiento"
                                    type="date"
                                    className="mt-1.5 w-full"
                                    value={formData.fecha_nacimiento}
                                    onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="correo">{__('Correo Electrónico')}</Label>
                                <Input 
                                    id="correo"
                                    type="email"
                                    className="mt-1.5 w-full"
                                    placeholder="ej. colaborador@ejemplo.com"
                                    value={formData.correo}
                                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Photos & Document Capture section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                            {/* 1. Foto del Colaborador */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{__('Foto del Colaborador')}</Label>
                                
                                <div className="relative h-40 w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                    {previewFoto ? (
                                        <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-3 text-slate-400">
                                            <Camera className="h-8 w-8 mx-auto mb-1 text-slate-400" />
                                            <span className="text-xs font-medium block">{__('Sin fotografía')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="foto_carnet"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFotoCarnet(file);
                                                setPreviewFoto(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label htmlFor="foto_carnet" className="cursor-pointer">
                                        <Button variant="outline" size="sm" type="button" className="w-full text-xs gap-1 pointer-events-none">
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            {__('Subir')}
                                        </Button>
                                    </label>
                                    <Button 
                                        type="button" 
                                        variant="default" 
                                        size="sm" 
                                        onClick={() => startCamera('foto', 'user')}
                                        className="w-full text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        {__('Cámara')}
                                    </Button>
                                </div>
                            </div>

                            {/* 2. Documento Frente */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{__('Documento Frente')}</Label>
                                
                                <div className="relative h-40 w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                    {previewFrontal ? (
                                        <img src={previewFrontal} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-3 text-slate-400">
                                            <IdCard className="h-8 w-8 mx-auto mb-1 text-slate-400" />
                                            <span className="text-xs font-medium block">{__('Sin documento frente')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="doc_frontal"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setDocFrontal(file);
                                                setPreviewFrontal(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label htmlFor="doc_frontal" className="cursor-pointer">
                                        <Button variant="outline" size="sm" type="button" className="w-full text-xs gap-1 pointer-events-none">
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            {__('Subir')}
                                        </Button>
                                    </label>
                                    <Button 
                                        type="button" 
                                        variant="default" 
                                        size="sm" 
                                        onClick={() => startCamera('frontal', 'environment')}
                                        className="w-full text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        {__('Cámara')}
                                    </Button>
                                </div>
                            </div>

                            {/* 3. Documento Reverso */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{__('Documento Reverso')}</Label>
                                
                                <div className="relative h-40 w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                                    {previewReverso ? (
                                        <img src={previewReverso} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-3 text-slate-400">
                                            <IdCard className="h-8 w-8 mx-auto mb-1 text-slate-400" />
                                            <span className="text-xs font-medium block">{__('Sin documento reverso')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="doc_reverso"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setDocReverso(file);
                                                setPreviewReverso(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label htmlFor="doc_reverso" className="cursor-pointer">
                                        <Button variant="outline" size="sm" type="button" className="w-full text-xs gap-1 pointer-events-none">
                                            <UploadCloud className="h-3.5 w-3.5" />
                                            {__('Subir')}
                                        </Button>
                                    </label>
                                    <Button 
                                        type="button" 
                                        variant="default" 
                                        size="sm" 
                                        onClick={() => startCamera('reverso', 'environment')}
                                        className="w-full text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        {__('Cámara')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <Button variant="outline" type="button" onClick={() => { stopCamera(); setIsAdding(false); }}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                <Check className="h-4 w-4" />
                                {submitting ? __('Guardando...') : __('Guardar Colaborador')}
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* Employee Table List */
                    <div className="py-4 space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-sm">{__('Cargando colaboradores...')}</div>
                        ) : employees.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl p-8">
                                <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-semibold">{__('No hay colaboradores registrados')}</p>
                                <p className="text-xs mt-1 text-slate-400">{__('Haga clic en "Agregar Colaborador" para registrar empleados de este productor.')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                                {employees.map((emp) => (
                                    <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {emp.foto_carnet ? (
                                                <img src={`/storage/${emp.foto_carnet}`} alt="" className="w-11 h-11 rounded-full object-cover border" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                                    {emp.nombres[0]}{emp.apellidos[0]}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                                                    {emp.nombres} {emp.apellidos}
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                    <span>RFC/ID: {emp.documento_identidad}</span>
                                                    {emp.cargo && <span>• {emp.cargo}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setViewingEmployee(emp)}>
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)}>
                                                <Pencil className="h-4 w-4 text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
