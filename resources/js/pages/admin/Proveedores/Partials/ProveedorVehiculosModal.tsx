import React, { useState, useEffect } from 'react';
import {
    X,
    Car,
    Plus,
    Trash2,
    Pencil,
    Eye,
    Tag,
    Calendar,
    ShieldAlert,
    UploadCloud,
    Check,
    Camera,
    Info,
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

interface ProveedorVehiculo {
    id: number;
    proveedor_id: number;
    tipo_vehiculo: string;
    marca: string;
    modelo: string;
    year: number;
    placa: string;
    foto_frontal?: string | null;
    foto_trasera?: string | null;
}

interface ProveedorVehiculosModalProps {
    isOpen: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
}

const initialForm = {
    tipo_vehiculo: '',
    marca: '',
    modelo: '',
    year: new Date().getFullYear(),
    placa: '',
    foto_frontal: null as File | null,
    foto_trasera: null as File | null,
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
    
    // Formulario local
    const [form, setForm] = useState({ ...initialForm });
    
    // Previsualizaciones de archivos cargados
    const [previews, setPreviews] = useState({
        foto_frontal: '',
        foto_trasera: '',
    });

    // Visor de fotos (Lightbox)
    const [viewingDocsVehicle, setViewingDocsVehicle] = useState<ProveedorVehiculo | null>(null);

    // Cámara Web
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeCameraField, setActiveCameraField] = useState<'foto_frontal' | 'foto_trasera' | null>(null);
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
        setPreviews({ foto_frontal: '', foto_trasera: '' });
        setEditingVehicle(null);
        setValidationErrors({});
    };

    // Cargar vehículo en el formulario de edición (Izquierda)
    const handleEditClick = (veh: ProveedorVehiculo) => {
        setEditingVehicle(veh);
        setValidationErrors({});
        setForm({
            tipo_vehiculo: veh.tipo_vehiculo || '',
            marca: veh.marca || '',
            modelo: veh.modelo || '',
            year: veh.year || new Date().getFullYear(),
            placa: veh.placa || '',
            foto_frontal: null,
            foto_trasera: null,
        });

        setPreviews({
            foto_frontal: veh.foto_frontal ? `/storage/${veh.foto_frontal}` : '',
            foto_trasera: veh.foto_trasera ? `/storage/${veh.foto_trasera}` : '',
        });
    };

    // ── Cámara Web Handlers ───────────────────────────────────────────────────
    const handleOpenCamera = async (field: 'foto_frontal' | 'foto_trasera') => {
        setActiveCameraField(field);
        setIsCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } } // Prioridad cámara trasera para autos
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

    // ── Enviar Formulario (Creación o Actualización) ───────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proveedor) return;

        try {
            setIsSubmitting(true);
            setValidationErrors({});

            const formData = new FormData();
            formData.append('tipo_vehiculo', form.tipo_vehiculo);
            formData.append('marca', form.marca);
            formData.append('modelo', form.modelo);
            formData.append('year', String(form.year));
            formData.append('placa', form.placa);

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

    // ── Eliminar Vehículo del Carrito ──────────────────────────────────────────
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
            <DialogContent className="sm:max-w-[94vw] lg:max-w-[1260px] xl:max-w-[1360px] w-full max-h-[92vh] overflow-y-auto p-8 flex flex-col">
                
                <DialogHeader className="border-b pb-5">
                    <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800 dark:text-slate-100">
                        <Car className="w-8 h-8 text-[#104a29]" />
                        {__('Supplier Vehicles')}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        {__('Manage the vehicles belonging to')} <span className="font-semibold text-slate-800 dark:text-slate-200">{proveedor?.razon_social}</span>.
                    </DialogDescription>
                </DialogHeader>

                {/* ══ Estructura Dividida: Formulario (Izq) y Carrito (Der) ══ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 flex-1 min-h-0">
                    
                    {/* ── Columna Izquierda: Formulario (42%) ── */}
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800/80 h-fit space-y-6">
                        <div className="flex items-center justify-between border-b pb-3 mb-2">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
                                <Car className="w-5 h-5 text-[#104a29]" />
                                {editingVehicle ? __('Edit Vehicle') : __('Add Vehicle')}
                            </h3>
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

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Tipo de Vehículo */}
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="veh_tipo" className="text-sm font-medium">{__('Vehicle Type')} *</Label>
                                    <Select
                                        value={form.tipo_vehiculo}
                                        onValueChange={(v) => setForm((prev) => ({ ...prev, tipo_vehiculo: v }))}
                                    >
                                        <SelectTrigger id="veh_tipo" className="h-10 text-sm w-full">
                                            <SelectValue placeholder={__('Select Vehicle Type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedan">{__('Sedan')}</SelectItem>
                                            <SelectItem value="suv">{__('SUV')}</SelectItem>
                                            <SelectItem value="pickup">{__('Pick-up')}</SelectItem>
                                            <SelectItem value="camion">{__('Truck')}</SelectItem>
                                            <SelectItem value="furgon">{__('Van')}</SelectItem>
                                            <SelectItem value="motocicleta">{__('Motorcycle')}</SelectItem>
                                            <SelectItem value="otro">{__('Other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {validationErrors.tipo_vehiculo && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.tipo_vehiculo}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Marca */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="veh_marca" className="text-sm font-medium">{__('Brand')} *</Label>
                                    <Input
                                        id="veh_marca"
                                        value={form.marca}
                                        onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.marca && 'border-rose-500')}
                                        placeholder="Ej: Toyota, Ford"
                                        required
                                    />
                                    {validationErrors.marca && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.marca}</p>
                                    )}
                                </div>

                                {/* Modelo */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="veh_modelo" className="text-sm font-medium">{__('Model')} *</Label>
                                    <Input
                                        id="veh_modelo"
                                        value={form.modelo}
                                        onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                                        className={cn('h-10 text-sm', validationErrors.modelo && 'border-rose-500')}
                                        placeholder="Ej: Hilux, F-150"
                                        required
                                    />
                                    {validationErrors.modelo && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.modelo}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Año */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="veh_year" className="text-sm font-medium">{__('Year')} *</Label>
                                    <Input
                                        id="veh_year"
                                        type="number"
                                        value={form.year}
                                        onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                                        className={cn('h-10 text-sm', validationErrors.year && 'border-rose-500')}
                                        required
                                    />
                                    {validationErrors.year && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.year}</p>
                                    )}
                                </div>

                                {/* Placa */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="veh_placa" className="text-sm font-medium">{__('License Plate')} *</Label>
                                    <Input
                                        id="veh_placa"
                                        value={form.placa}
                                        onChange={(e) => setForm((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))}
                                        className={cn('h-10 text-sm font-mono uppercase', validationErrors.placa && 'border-rose-500')}
                                        placeholder="ABC-123"
                                        required
                                    />
                                    {validationErrors.placa && (
                                        <p className="text-xs text-rose-500 mt-1">{validationErrors.placa}</p>
                                    )}
                                </div>
                            </div>

                            {/* ── File Uploaders (Foto Frontal + Foto Trasera) ── */}
                            <div className="space-y-4 pt-3 border-t">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {__('Photos & Documentation')}
                                </Label>

                                {/* Uploader 1: Foto Frontal */}
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground block font-medium">{__('Front Photo (Foto Frontal)')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                            {previews.foto_frontal ? (
                                                <img src={previews.foto_frontal} className="object-cover w-full h-full" alt="Front Preview" />
                                            ) : (
                                                <Car className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors px-2">
                                                <UploadCloud className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span className="truncate">{form.foto_frontal ? __('Change') : __('Upload')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'foto_frontal')}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleOpenCamera('foto_frontal')}
                                                className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 border-dashed hover:bg-slate-50 shrink-0"
                                            >
                                                <Camera className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span>{__('Take Photo')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {validationErrors.foto_frontal && (
                                        <p className="text-xs text-rose-500">{validationErrors.foto_frontal}</p>
                                    )}
                                </div>

                                {/* Uploader 2: Foto Trasera */}
                                <div className="space-y-1.5">
                                    <span className="text-xs text-muted-foreground block font-medium">{__('Back Photo (Foto Trasera)')}</span>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-14 h-14 rounded-lg border bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                                            {previews.foto_trasera ? (
                                                <img src={previews.foto_trasera} className="object-cover w-full h-full" alt="Back Preview" />
                                            ) : (
                                                <Car className="w-7 h-7 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <label className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-dashed rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors px-2">
                                                <UploadCloud className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span className="truncate">{form.foto_trasera ? __('Change') : __('Upload')}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'foto_trasera')}
                                                />
                                            </label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleOpenCamera('foto_trasera')}
                                                className="h-10 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 border-dashed hover:bg-slate-50 shrink-0"
                                            >
                                                <Camera className="w-4 h-4 text-[#104a29] shrink-0" />
                                                <span>{__('Take Photo')}</span>
                                            </Button>
                                        </div>
                                    </div>
                                    {validationErrors.foto_trasera && (
                                        <p className="text-xs text-rose-500">{validationErrors.foto_trasera}</p>
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
                                        <span>{editingVehicle ? __('Update Vehicle') : __('Add Vehicle')}</span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* ── Columna Derecha: El Carrito de Vehículos (58%) ── */}
                    <div className="lg:col-span-7 flex flex-col min-h-[300px]">
                        
                        {/* Cabecera del Carrito */}
                        <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                                    {__('Added Vehicles')}
                                </span>
                                <span className="bg-[#104a29]/10 text-[#104a29] dark:bg-[#104a29]/20 text-sm px-3 py-0.5 rounded-full font-bold">
                                    {vehicles.length}
                                </span>
                            </div>
                        </div>

                        {/* Lista del Carrito con Scroll */}
                        <div className="flex-1 pr-1 space-y-4">
                            {isLoadingList ? (
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                                    {__('Loading vehicles list...')}
                                </div>
                            ) : vehicles.length === 0 ? (
                                <div className="h-56 border border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/10">
                                    <Car className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm font-semibold text-slate-500">{__('No vehicles added yet')}</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                                        {__('Use the form on the left to start adding vehicles to this supplier.')}
                                    </p>
                                </div>
                            ) : (
                                vehicles.map((veh) => (
                                    <div
                                        key={veh.id}
                                        className={cn(
                                            'p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-800',
                                            editingVehicle?.id === veh.id && 'border-[#104a29]/40 ring-1 ring-[#104a29]/20 bg-[#104a29]/5 dark:bg-[#104a29]/5'
                                        )}
                                    >
                                        {/* Datos e Imagen */}
                                        <div className="flex items-center gap-4">
                                            {/* Foto frontal miniatura */}
                                            <div className="w-14 h-14 rounded-lg border bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                                {veh.foto_frontal ? (
                                                    <img
                                                        src={`/storage/${veh.foto_frontal}`}
                                                        className="object-cover w-full h-full"
                                                        alt={`${veh.marca} profile`}
                                                    />
                                                ) : (
                                                    <Car className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>

                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">
                                                    {veh.marca} {veh.modelo}
                                                </p>
                                                
                                                {/* Meta-badges */}
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    <span className="text-[11px] font-mono bg-[#104a29]/10 text-[#104a29] px-2 py-0.5 rounded font-bold uppercase">
                                                        {veh.placa}
                                                    </span>
                                                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded capitalize">
                                                        {__(veh.tipo_vehiculo)}
                                                    </span>
                                                    <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 shrink-0" />
                                                        {veh.year}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Botones de acción al final */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            
                                            {/* Botón Ver Documentos (Visor de ID) */}
                                            {(veh.foto_frontal || veh.foto_trasera) && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setViewingDocsVehicle(veh)}
                                                    className="h-9 text-xs flex items-center gap-1 px-3 border-slate-200 hover:bg-slate-100"
                                                >
                                                    <Eye className="w-4 h-4 text-[#104a29]" />
                                                    <span>{__('Photos')}</span>
                                                </Button>
                                            )}

                                            {/* Editar */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(veh)}
                                                className="h-9 w-9 text-slate-600 hover:text-slate-900"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>

                                            {/* Eliminar */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(veh.id)}
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

            {/* ══ SUB-DIALOG: Visor Lightbox de Fotos del Vehículo Frontal y Trasera ══ */}
            <Dialog open={viewingDocsVehicle !== null} onOpenChange={(open) => !open && setViewingDocsVehicle(null)}>
                <DialogContent className="max-w-4xl p-6">
                    <DialogHeader className="border-b pb-3">
                        <DialogTitle className="flex items-center gap-2 text-md">
                            <Car className="w-5 h-5 text-[#104a29]" />
                            {__('Vehicle Photos')} - {viewingDocsVehicle?.marca} {viewingDocsVehicle?.modelo} ({viewingDocsVehicle?.placa})
                        </DialogTitle>
                    </DialogHeader>

                    {/* Visor side-by-side de fotos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        
                        {/* Cara Frontal */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                {__('Front Side (Anverso)')}
                            </h4>
                            <div className="aspect-[1.6/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm relative group">
                                {viewingDocsVehicle?.foto_frontal ? (
                                    <img
                                        src={`/storage/${viewingDocsVehicle.foto_frontal}`}
                                        className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        alt="Vehicle Front"
                                    />
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">{__('No image uploaded')}</span>
                                )}
                            </div>
                        </div>

                        {/* Cara Trasera */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                {__('Back Side (Reverso)')}
                            </h4>
                            <div className="aspect-[1.6/1] border rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-sm relative group">
                                {viewingDocsVehicle?.foto_trasera ? (
                                    <img
                                        src={`/storage/${viewingDocsVehicle.foto_trasera}`}
                                        className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        alt="Vehicle Back"
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
                            onClick={() => setViewingDocsVehicle(null)}
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
                                activeCameraField === 'foto_frontal' ? __('Front Photo') : __('Back Photo')
                            }
                        </DialogTitle>
                    </DialogHeader>

                    {/* Live Stream View (Sin espejo para leer placas correctamente) */}
                    <div className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
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
