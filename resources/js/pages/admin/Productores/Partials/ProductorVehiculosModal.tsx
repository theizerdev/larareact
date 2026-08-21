import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Car,
    Plus,
    Trash2,
    Pencil,
    Eye,
    UploadCloud,
    CheckCircle,
    ArrowLeft,
    Camera,
    RefreshCw,
    Upload
} from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

interface ProductorVehiculo {
    id: number;
    productor_id: number;
    tipo_vehiculo: string;
    marca: string;
    modelo: string;
    year: number;
    placa: string;
    foto_frontal?: string | null;
    foto_trasera?: string | null;
}

interface ProductorVehiculosModalProps {
    isOpen: boolean;
    onClose: () => void;
    productor: Productor | null;
}

export default function ProductorVehiculosModal({
    isOpen,
    onClose,
    productor,
}: ProductorVehiculosModalProps) {
    const { __ } = useTranslate();
    const [vehicles, setVehicles] = useState<ProductorVehiculo[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [editingVehicle, setEditingVehicle] = useState<ProductorVehiculo | null>(null);
    const [viewingVehicle, setViewingVehicle] = useState<ProductorVehiculo | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Form state
    const [formData, setFormData] = useState({
        tipo_vehiculo: '',
        marca: '',
        modelo: '',
        year: new Date().getFullYear(),
        placa: '',
    });

    const [fotoFrontal, setFotoFrontal] = useState<File | null>(null);
    const [fotoTrasera, setFotoTrasera] = useState<File | null>(null);

    const [previewFrontal, setPreviewFrontal] = useState<string | null>(null);
    const [previewTrasera, setPreviewTrasera] = useState<string | null>(null);

    // Camera capture state
    type PhotoTarget = 'frontal' | 'trasera';
    const [activeCameraTarget, setActiveCameraTarget] = useState<PhotoTarget | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setActiveCameraTarget(null);
    };

    const startCamera = async (target: PhotoTarget, mode?: 'user' | 'environment') => {
        stopCamera();
        const selectedMode = mode || 'environment';
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

    useEffect(() => {
        if (activeCameraTarget && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [activeCameraTarget]);

    const capturePhoto = () => {
        if (!videoRef.current || !activeCameraTarget) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const file = new File([u8arr], `vehiculo_${activeCameraTarget}_${Date.now()}.jpg`, { type: mime });

            if (activeCameraTarget === 'frontal') {
                setFotoFrontal(file);
                setPreviewFrontal(dataUrl);
            } else {
                setFotoTrasera(file);
                setPreviewTrasera(dataUrl);
            }
        }
        stopCamera();
    };

    const fetchVehicles = async () => {
        if (!productor) return;
        setLoading(true);
        try {
            const response = await fetch(`/admin/productores/${productor.id}/vehiculos`);
            const data = await response.json();
            if (data.success) {
                setVehicles(data.vehicles);
            }
        } catch (e) {
            toast.error(__('Error loading vehicles'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && productor) {
            fetchVehicles();
            resetForm();
            setIsAdding(false);
            setEditingVehicle(null);
            setViewingVehicle(null);
        }
    }, [isOpen, productor]);

    const resetForm = () => {
        setFormData({
            tipo_vehiculo: '',
            marca: '',
            modelo: '',
            year: new Date().getFullYear(),
            placa: '',
        });
        setFotoFrontal(null);
        setFotoTrasera(null);
        setPreviewFrontal(null);
        setPreviewTrasera(null);
    };

    const handleEdit = (veh: ProductorVehiculo) => {
        setEditingVehicle(veh);
        setFormData({
            tipo_vehiculo: veh.tipo_vehiculo || '',
            marca: veh.marca || '',
            modelo: veh.modelo || '',
            year: veh.year || new Date().getFullYear(),
            placa: veh.placa || '',
        });
        setPreviewFrontal(veh.foto_frontal ? `/storage/${veh.foto_frontal}` : null);
        setPreviewTrasera(veh.foto_trasera ? `/storage/${veh.foto_trasera}` : null);
        setIsAdding(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm(__('Are you sure you want to delete this vehicle?'))) return;
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const response = await fetch(`/admin/productor-vehiculos/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
            });
            const data = await response.json();
            if (data.success) {
                toast.success(__('Vehicle deleted successfully'));
                fetchVehicles();
            } else {
                toast.error(data.message || __('Error deleting vehicle'));
            }
        } catch (e) {
            toast.error(__('Error deleting vehicle'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productor) return;

        setSubmitting(true);
        const data = new FormData();
        data.append('tipo_vehiculo', formData.tipo_vehiculo);
        data.append('marca', formData.marca);
        data.append('modelo', formData.modelo);
        data.append('year', String(formData.year));
        data.append('placa', formData.placa);

        if (fotoFrontal) data.append('foto_frontal', fotoFrontal);
        if (fotoTrasera) data.append('foto_trasera', fotoTrasera);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const url = editingVehicle 
                ? `/admin/productor-vehiculos/${editingVehicle.id}` 
                : `/admin/productores/${productor.id}/vehiculos`;

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
                toast.success(editingVehicle ? __('Vehicle updated successfully') : __('Vehicle added successfully'));
                fetchVehicles();
                setIsAdding(false);
                setEditingVehicle(null);
                resetForm();
            } else {
                toast.error(resData.message || __('Error saving vehicle'));
            }
        } catch (e) {
            toast.error(__('Error saving vehicle'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!productor) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] max-h-[92vh] overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl">
                <DialogHeader className="border-b pb-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Car className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                    {__('Producer Vehicles')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    {productor.razon_social}
                                </DialogDescription>
                            </div>
                        </div>
                        {!isAdding && !viewingVehicle && (
                            <Button 
                                onClick={() => { resetForm(); setIsAdding(true); setEditingVehicle(null); }}
                                size="sm" 
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Plus className="h-4 w-4" />
                                {__('Add Vehicle')}
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Viewing Vehicle Details */}
                {viewingVehicle ? (
                    <div className="space-y-6 py-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewingVehicle(null)}
                            className="gap-2 text-slate-600 dark:text-slate-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {__('Back to list')}
                        </Button>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                                {viewingVehicle.marca} {viewingVehicle.modelo} ({viewingVehicle.year})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div><span className="text-slate-500">{__('Type')}:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{viewingVehicle.tipo_vehiculo}</span></div>
                                <div><span className="text-slate-500">{__('License Plate')}:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{viewingVehicle.placa}</span></div>
                            </div>
                        </div>

                        {/* Vehicle Photos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-slate-500 mb-2 block">{__('Front Photo')}</Label>
                                {viewingVehicle.foto_frontal ? (
                                    <img src={`/storage/${viewingVehicle.foto_frontal}`} alt="Front" className="w-full h-48 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                    <div className="w-full h-48 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-dashed flex items-center justify-center text-slate-400 text-xs">{__('No photo')}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-xs text-slate-500 mb-2 block">{__('Rear Photo')}</Label>
                                {viewingVehicle.foto_trasera ? (
                                    <img src={`/storage/${viewingVehicle.foto_trasera}`} alt="Rear" className="w-full h-48 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                                ) : (
                                    <div className="w-full h-48 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-dashed flex items-center justify-center text-slate-400 text-xs">{__('No photo')}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : isAdding ? (
                    /* Form for Add/Edit */
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {editingVehicle ? __('Edit Vehicle') : __('New Vehicle')}
                            </h4>
                            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAdding(false)}>
                                {__('Cancel')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="tipo_vehiculo">{__('Tipo de Vehículo')} *</Label>
                                <Select 
                                    value={formData.tipo_vehiculo} 
                                    onValueChange={(val) => setFormData({ ...formData, tipo_vehiculo: val })}
                                >
                                    <SelectTrigger id="tipo_vehiculo" className="mt-1.5 w-full">
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
                                <Label htmlFor="marca">{__('Marca')} *</Label>
                                <Input 
                                    id="marca"
                                    required 
                                    className="mt-1.5 w-full"
                                    placeholder="ej. Ford, Chevrolet, Toyota"
                                    value={formData.marca}
                                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="modelo">{__('Modelo')} *</Label>
                                <Input 
                                    id="modelo"
                                    required 
                                    className="mt-1.5 w-full"
                                    placeholder="ej. F-150, Hilux"
                                    value={formData.modelo}
                                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="year">{__('Año')} *</Label>
                                <Input 
                                    id="year"
                                    type="number"
                                    required
                                    className="mt-1.5 w-full"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="placa">{__('Placa / Matrícula')} *</Label>
                                <Input 
                                    id="placa"
                                    required
                                    className="mt-1.5 w-full"
                                    placeholder="ej. ABC-123"
                                    value={formData.placa}
                                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Photos section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* 1. Foto Frontal */}
                            <div className="border rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 text-center">
                                <Label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                                    {__('Foto Frontal del Vehículo')}
                                </Label>
                                
                                {previewFrontal ? (
                                    <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-36 flex items-center justify-center">
                                        <img src={previewFrontal} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFotoFrontal(null);
                                                setPreviewFrontal(null);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-36 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                                        <span className="text-xs">{__('Sin foto frontal')}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1 h-8"
                                        onClick={() => startCamera('frontal')}
                                    >
                                        <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                        {__('Cámara')}
                                    </Button>

                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="foto_frontal"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFotoFrontal(file);
                                                setPreviewFrontal(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="foto_frontal"
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
                                
                                {previewTrasera ? (
                                    <div className="relative group rounded-lg overflow-hidden border bg-white dark:bg-slate-950 h-36 flex items-center justify-center">
                                        <img src={previewTrasera} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFotoTrasera(null);
                                                setPreviewTrasera(null);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-36 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 bg-white dark:bg-slate-950">
                                        <Camera className="h-6 w-6 mb-1 text-slate-400" />
                                        <span className="text-xs">{__('Sin foto trasera')}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1 h-8"
                                        onClick={() => startCamera('trasera')}
                                    >
                                        <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                        {__('Cámara')}
                                    </Button>

                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="foto_trasera"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setFotoTrasera(file);
                                                setPreviewTrasera(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="foto_trasera"
                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 cursor-pointer gap-1"
                                    >
                                        <Upload className="h-3.5 w-3.5 text-blue-600" />
                                        {__('Subir')}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>
                                {__('Cancel')}
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {submitting ? __('Saving...') : __('Save Vehicle')}
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* Vehicle Table List */
                    <div className="py-4 space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-sm">{__('Loading vehicles...')}</div>
                        ) : vehicles.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl p-8">
                                <Car className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-semibold">{__('No vehicles registered')}</p>
                                <p className="text-xs mt-1 text-slate-400">{__('Click "Add Vehicle" to register vehicles for this producer.')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                                {vehicles.map((veh) => (
                                    <div key={veh.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                                <Car className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                                                    {veh.marca} {veh.modelo} ({veh.year})
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{veh.placa}</span>
                                                    <span>• {veh.tipo_vehiculo}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setViewingVehicle(veh)}>
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(veh)}>
                                                <Pencil className="h-4 w-4 text-indigo-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(veh.id)}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Modal: Live Webcam Capture for Vehicles */}
                <Dialog open={!!activeCameraTarget} onOpenChange={(open) => { if (!open) stopCamera(); }}>
                    <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-[100]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Camera className="h-5 w-5 text-emerald-600" />
                                {activeCameraTarget === 'frontal'
                                    ? __('Tomar Foto Frontal del Vehículo')
                                    : __('Tomar Foto Trasera del Vehículo')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center my-2">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white border-0 gap-1.5 text-xs"
                                onClick={() => {
                                    if (activeCameraTarget) {
                                        startCamera(activeCameraTarget, facingMode === 'user' ? 'environment' : 'user');
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
                                <Camera className="h-4 w-4" />
                                {__('Capturar Foto')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
