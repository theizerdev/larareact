import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    Cpu,
    FileSpreadsheet,
    Image as ImageIcon,
    Layers,
    MapPin,
    Maximize2,
    MoreVertical,
    Network,
    Pencil,
    Plus,
    Ruler,
    Server,
    Sparkles,
    ToggleRight,
    Trash2,
    Upload,
    Wrench,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePermission } from '@/hooks/use-permission';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifyError } from '@/utils/notifications';
import EquiposUbicacionesImportModal from '../Partials/EquiposUbicacionesImportModal';

interface UbicacionOption {
    id: number;
    numero_localidad: number | null;
    planta: string;
    estado: string | null;
    ciudad: string | null;
    legacy: string | null;
    direccion: string | null;
}

interface RelojEquipoBiometrico {
    id: number;
    empresa_id: number | null;
    reloj_ubicacion_id: number | null;
    legacy: string | null;
    localidad_nombre: string;
    numero_localidad: number | null;
    ubicacion_fisica: string | null;

    // Características de instalación
    dimensiones: string | null;
    instalacion_fisica: string | null;
    instalacion_comentario: string | null;
    instalacion_foto: string | null;

    // Equipo Inicial (Actual)
    actual_marca: string | null;
    actual_modelo: string | null;
    actual_no_serie: string | null;
    actual_ip: string | null;
    actual_mascara: string | null;
    actual_gateway: string | null;
    actual_mac_address: string | null;
    actual_instalado: boolean;
    actual_comentario: string | null;
    actual_foto: string | null;

    // Equipo Final (Nuevo)
    nuevo_marca: string | null;
    nuevo_modelo: string | null;
    nuevo_no_serie: string | null;
    nuevo_ip: string | null;
    nuevo_mascara: string | null;
    nuevo_gateway: string | null;
    nuevo_mac_address: string | null;
    nuevo_instalado: boolean;
    nuevo_comentario: string | null;
    nuevo_foto: string | null;

    activo: boolean;
    ubicacion?: UbicacionOption | null;
}

interface BiometricosSetupPageProps {
    biometricos: Paginated<RelojEquipoBiometrico>;
    stats: {
        total: number;
        actual_instalados: number;
        actual_no_instalados: number;
        nuevo_instalados: number;
        pendientes_ubicacion: number;
        por_legacy: Record<string, number>;
    };
    ubicacionesCatalogo: UbicacionOption[];
    legaciesDisponibles: string[];
    empresas: { id: number; razon_social: string }[];
    filters: {
        search?: string;
        legacy?: string;
        reloj_ubicacion_id?: string;
        numero_localidad?: string;
        actual_instalado?: string;
        nuevo_instalado?: string;
        status?: string;
        perPage?: string;
    };
}

const initialForm = {
    empresa_id: '' as string | number,
    reloj_ubicacion_id: '' as string | number,
    legacy: '',
    localidad_nombre: '',
    numero_localidad: '' as string | number,
    ubicacion_fisica: '',

    // Características de instalación
    dimensiones: '',
    instalacion_fisica: '',
    instalacion_comentario: '',
    instalacion_foto: '',

    // Equipo Inicial
    actual_marca: '',
    actual_modelo: '',
    actual_no_serie: '',
    actual_ip: '',
    actual_mascara: '',
    actual_gateway: '',
    actual_mac_address: '',
    actual_instalado: true,
    actual_comentario: '',
    actual_foto: '',

    // Equipo Final
    nuevo_marca: '',
    nuevo_modelo: '',
    nuevo_no_serie: '',
    nuevo_ip: '',
    nuevo_mascara: '',
    nuevo_gateway: '',
    nuevo_mac_address: '',
    nuevo_instalado: false,
    nuevo_comentario: '',
    nuevo_foto: '',

    activo: true,
};

function getLegacyBadgeStyle(legacy?: string | null) {
    const val = (legacy || '').toUpperCase();
    if (val.includes('FSK NA')) {
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800';
    }
    if (val.includes('FSK MX') || val.includes('FSKM')) {
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800';
    }
    if (val.includes('FWR GG') || val.includes('FWRGG')) {
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
    }
    if (val.includes('BIB')) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

/**
 * Componente Drag & Drop para carga de fotografías con optimización en canvas y vista previa
 */
function PhotoDropzone({
    label,
    description,
    value,
    onChange,
    onViewFull,
    id,
}: {
    label: string;
    description?: string;
    value?: string | null;
    onChange: (val: string) => void;
    onViewFull?: (src: string, title: string) => void;
    id?: string;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            notifyError('Solo se permiten archivos de imagen (PNG, JPG o WEBP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const rawDataUrl = event.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const maxDim = 1920;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    onChange(optimizedDataUrl);
                } else {
                    onChange(rawDataUrl);
                }
            };
            img.onerror = () => {
                onChange(rawDataUrl);
            };
            img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div className="space-y-1.5">
            <Label htmlFor={id} className="text-xs font-semibold flex items-center justify-between">
                <span>{label}</span>
                {value && (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Foto adjunta
                    </span>
                )}
            </Label>
            {description && <p className="text-[11px] text-muted-foreground">{description}</p>}

            <input
                ref={fileInputRef}
                id={id}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        processFile(e.target.files[0]);
                    }
                }}
            />

            {value ? (
                <div className="relative group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 overflow-hidden flex items-center gap-3">
                    <div
                        className="relative h-20 w-24 rounded-lg overflow-hidden border bg-background shrink-0 cursor-pointer shadow-xs group/img"
                        onClick={() => onViewFull && onViewFull(value, label)}
                        title="Haz clic para ampliar la imagen"
                    >
                        <img src={value} alt={label} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="h-4 w-4 drop-shadow" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-medium text-foreground truncate">
                            {value.startsWith('data:') ? 'Nueva fotografía seleccionada' : 'Fotografía guardada en el servidor'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                            {value.startsWith('data:')
                                ? 'Se subirá y almacenará al guardar el formulario'
                                : 'Disponible para consulta y ampliación'}
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Cambiar foto
                            </Button>
                            {onViewFull && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2.5"
                                    onClick={() => onViewFull(value, label)}
                                >
                                    <Maximize2 className="h-3 w-3 mr-1" />
                                    Ver grande
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => onChange('')}
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Quitar
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors text-center',
                        isDragging
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    )}
                >
                    <div className="rounded-full bg-primary/10 p-2.5 mb-2 text-primary">
                        <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-foreground">
                        Arrastra y suelta aquí tu foto, o <span className="text-primary underline">haz clic para explorar</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG o WEBP (máx. 10MB)</p>
                </div>
            )}
        </div>
    );
}

export default function BiometricosSetupIndexPage({
    biometricos,
    stats,
    ubicacionesCatalogo,
    legaciesDisponibles,
    empresas,
    filters,
}: BiometricosSetupPageProps) {
    const { can } = usePermission();
    const canManage = can('asistencia.configuracion');

    const breadcrumbs = [
        { title: 'Panel de control', href: '/dashboard' },
        { title: 'Reloj Checador', href: '/admin/asistencia/biometricos-setup' },
        { title: 'Biométricos Setup', href: '/admin/asistencia/biometricos-setup' },
    ];

    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [legacyFilter, setLegacyFilter] = useState(filters.legacy || 'all');
    const [ubicacionFilter, setUbicacionFilter] = useState(filters.reloj_ubicacion_id || 'all');
    const [numLocalidadFilter, setNumLocalidadFilter] = useState(filters.numero_localidad || '');
    const [actualInstaladoFilter, setActualInstaladoFilter] = useState(filters.actual_instalado || 'all');
    const [nuevoInstaladoFilter, setNuevoInstaladoFilter] = useState(filters.nuevo_instalado || 'all');
    const [perPageFilter, setPerPageFilter] = useState(filters.perPage || '15');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RelojEquipoBiometrico | null>(null);
    const [deletingItem, setDeletingItem] = useState<RelojEquipoBiometrico | null>(null);

    // Lightbox para vista ampliada de imágenes
    const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

    const { data, setData, reset, errors, processing } = useForm(initialForm);

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/admin/asistencia/biometricos-setup',
                cleanParams({
                    search: searchTerm,
                    legacy: legacyFilter === 'all' ? '' : legacyFilter,
                    reloj_ubicacion_id: ubicacionFilter === 'all' ? '' : ubicacionFilter,
                    numero_localidad: numLocalidadFilter,
                    actual_instalado: actualInstaladoFilter === 'all' ? '' : actualInstaladoFilter,
                    nuevo_instalado: nuevoInstaladoFilter === 'all' ? '' : nuevoInstaladoFilter,
                    perPage: perPageFilter,
                }),
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, legacyFilter, ubicacionFilter, numLocalidadFilter, actualInstaladoFilter, nuevoInstaladoFilter, perPageFilter]);

    const handleCreateClick = () => {
        setEditingItem(null);
        reset();
        setData({
            ...initialForm,
            empresa_id: empresas.length === 1 ? empresas[0].id : '',
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (item: RelojEquipoBiometrico) => {
        setEditingItem(item);
        setData({
            empresa_id: item.empresa_id ?? (empresas[0]?.id || ''),
            reloj_ubicacion_id: item.reloj_ubicacion_id ?? '',
            legacy: item.legacy || '',
            localidad_nombre: item.localidad_nombre || '',
            numero_localidad: item.numero_localidad ?? '',
            ubicacion_fisica: item.ubicacion_fisica || '',

            dimensiones: item.dimensiones || '',
            instalacion_fisica: item.instalacion_fisica || '',
            instalacion_comentario: item.instalacion_comentario || '',
            instalacion_foto: item.instalacion_foto || '',

            actual_marca: item.actual_marca || '',
            actual_modelo: item.actual_modelo || '',
            actual_no_serie: item.actual_no_serie || '',
            actual_ip: item.actual_ip || '',
            actual_mascara: item.actual_mascara || '',
            actual_gateway: item.actual_gateway || '',
            actual_mac_address: item.actual_mac_address || '',
            actual_instalado: Boolean(item.actual_instalado),
            actual_comentario: item.actual_comentario || '',
            actual_foto: item.actual_foto || '',

            nuevo_marca: item.nuevo_marca || '',
            nuevo_modelo: item.nuevo_modelo || '',
            nuevo_no_serie: item.nuevo_no_serie || '',
            nuevo_ip: item.nuevo_ip || '',
            nuevo_mascara: item.nuevo_mascara || '',
            nuevo_gateway: item.nuevo_gateway || '',
            nuevo_mac_address: item.nuevo_mac_address || '',
            nuevo_instalado: Boolean(item.nuevo_instalado),
            nuevo_comentario: item.nuevo_comentario || '',
            nuevo_foto: item.nuevo_foto || '',

            activo: Boolean(item.activo),
        });
        setIsModalOpen(true);
    };

    const handleSelectUbicacionCatalogo = (val: string) => {
        if (val === 'none') {
            setData('reloj_ubicacion_id', '');
            return;
        }
        const ubId = Number(val);
        const found = ubicacionesCatalogo.find((u) => u.id === ubId);
        if (found) {
            setData({
                ...data,
                reloj_ubicacion_id: found.id,
                localidad_nombre: data.localidad_nombre || found.planta,
                numero_localidad: found.numero_localidad ?? data.numero_localidad,
                legacy: found.legacy || data.legacy,
            });
        } else {
            setData('reloj_ubicacion_id', ubId);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            reloj_ubicacion_id: data.reloj_ubicacion_id === '' ? null : Number(data.reloj_ubicacion_id),
            numero_localidad: data.numero_localidad === '' ? null : Number(data.numero_localidad),
        };

        if (editingItem) {
            router.put(`/admin/asistencia/biometricos-setup/${editingItem.id}`, payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    reset();
                },
                onError: () => notifyError('Por favor revisa los campos del formulario.'),
            });
        } else {
            router.post('/admin/asistencia/biometricos-setup', payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
                onError: () => notifyError('Por favor revisa los campos del formulario.'),
            });
        }
    };

    const handleToggleStatus = (item: RelojEquipoBiometrico) => {
        router.patch(`/admin/asistencia/biometricos-setup/${item.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDeleteConfirm = () => {
        if (!deletingItem) return;
        router.delete(`/admin/asistencia/biometricos-setup/${deletingItem.id}`, {
            onSuccess: () => setDeletingItem(null),
        });
    };

    const openLightbox = (src: string, title: string) => {
        setLightboxImage({ src, title });
    };

    const columns: ColumnDef<RelojEquipoBiometrico>[] = [
        {
            header: 'Localidad & Ubicación',
            cell: (item) => {
                const isPendingUbi = !item.ubicacion_fisica || item.ubicacion_fisica === '???';
                return (
                    <div className="space-y-1.5 min-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                            {item.numero_localidad !== null && (
                                <span className="inline-flex h-6 px-2 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                                    #{item.numero_localidad}
                                </span>
                            )}
                            {item.legacy && (
                                <span
                                    className={cn(
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                        getLegacyBadgeStyle(item.legacy)
                                    )}
                                >
                                    {item.legacy}
                                </span>
                            )}
                            <span className="font-semibold text-sm text-foreground">{item.localidad_nombre}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isPendingUbi ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    Ubicación por definir (???)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-foreground">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    {item.ubicacion_fisica}
                                </span>
                            )}
                        </div>

                        {item.ubicacion && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[290px]" title={item.ubicacion.direccion || ''}>
                                {[item.ubicacion.ciudad, item.ubicacion.estado].filter(Boolean).join(', ')}
                                {item.ubicacion.direccion ? ` — ${item.ubicacion.direccion}` : ''}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Características de Instalación',
            cell: (item) => {
                const hasInstalacionData =
                    item.dimensiones ||
                    item.instalacion_fisica ||
                    item.instalacion_comentario ||
                    item.instalacion_foto;

                return (
                    <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 p-2.5 space-y-1.5 min-w-[220px]">
                        <div className="flex items-center justify-between gap-2 border-b pb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Wrench className="h-3 w-3 text-amber-600" />
                                Instalación
                            </span>
                            {item.instalacion_foto && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openLightbox(item.instalacion_foto!, `Instalación - ${item.localidad_nombre}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-medium"
                                >
                                    <Camera className="h-3 w-3" /> Ver foto
                                </button>
                            )}
                        </div>

                        {hasInstalacionData ? (
                            <div className="space-y-1 text-xs">
                                {item.dimensiones && (
                                    <p className="flex items-center gap-1 text-[11px]">
                                        <Ruler className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">Dim:</span>
                                        <strong className="text-foreground">{item.dimensiones}</strong>
                                    </p>
                                )}
                                {item.instalacion_fisica && (
                                    <p className="text-[11px] text-foreground font-medium truncate max-w-[240px]">
                                        {item.instalacion_fisica}
                                    </p>
                                )}
                                {item.instalacion_comentario && (
                                    <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                                        “{item.instalacion_comentario}”
                                    </p>
                                )}
                                {item.instalacion_foto && (
                                    <div
                                        className="mt-1 h-12 w-20 rounded-md overflow-hidden border bg-background cursor-pointer hover:opacity-85 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(item.instalacion_foto!, `Instalación - ${item.localidad_nombre}`);
                                        }}
                                        title="Clic para ampliar foto de instalación"
                                    >
                                        <img
                                            src={item.instalacion_foto}
                                            alt="Foto instalación"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic py-1">Sin detalles de instalación</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Equipo Inicial',
            cell: (item) => {
                const hasActualData =
                    item.actual_marca ||
                    item.actual_modelo ||
                    item.actual_no_serie ||
                    item.actual_ip ||
                    item.actual_mac_address ||
                    item.actual_gateway ||
                    item.actual_comentario ||
                    item.actual_foto;

                return (
                    <div className="rounded-xl border bg-slate-50/60 dark:bg-slate-900/40 p-2.5 space-y-1 min-w-[230px]">
                        <div className="flex items-center justify-between gap-2 border-b pb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <Server className="h-3 w-3 text-indigo-600" />
                                Inicial
                            </span>
                            <div className="flex items-center gap-1.5">
                                {item.actual_foto && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(item.actual_foto!, `Equipo Inicial - ${item.localidad_nombre}`);
                                        }}
                                        className="text-primary hover:text-primary/80"
                                        title="Ver foto equipo inicial"
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px]',
                                        item.actual_instalado
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                            : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    )}
                                >
                                    {item.actual_instalado ? 'Instalado: Sí' : 'Instalado: No'}
                                </Badge>
                            </div>
                        </div>

                        {hasActualData ? (
                            <div className="space-y-0.5 text-xs">
                                {(item.actual_marca || item.actual_modelo) && (
                                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                        {[item.actual_marca, item.actual_modelo].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                                <p className="font-mono text-[11px]">
                                    <span className="text-muted-foreground">S/N:</span>{' '}
                                    <strong className="text-foreground">{item.actual_no_serie || 'S/N'}</strong>
                                </p>
                                {item.actual_ip && (
                                    <p className="font-mono text-[11px] flex items-center gap-1">
                                        <Network className="h-3 w-3 text-indigo-500" />
                                        <span>{item.actual_ip}</span>
                                        {item.actual_mascara && (
                                            <span className="text-muted-foreground text-[10px]">({item.actual_mascara})</span>
                                        )}
                                    </p>
                                )}
                                {item.actual_mac_address && (
                                    <p className="font-mono text-[10px] text-muted-foreground">MAC: {item.actual_mac_address}</p>
                                )}
                                {item.actual_gateway && (
                                    <p className="font-mono text-[10px] text-muted-foreground">GW: {item.actual_gateway}</p>
                                )}
                                {item.actual_comentario && item.actual_comentario !== 'S/N' && (
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 italic pt-0.5">
                                        “{item.actual_comentario}”
                                    </p>
                                )}
                                {item.actual_foto && (
                                    <div
                                        className="mt-1 h-10 w-16 rounded-md overflow-hidden border bg-background cursor-pointer hover:opacity-85 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(item.actual_foto!, `Equipo Inicial - ${item.localidad_nombre}`);
                                        }}
                                        title="Clic para ampliar foto del equipo inicial"
                                    >
                                        <img src={item.actual_foto} alt="Foto inicial" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic py-1">Sin datos de equipo inicial</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Equipo Final',
            cell: (item) => {
                const hasNuevoData =
                    item.nuevo_marca ||
                    item.nuevo_modelo ||
                    item.nuevo_no_serie ||
                    item.nuevo_ip ||
                    item.nuevo_mac_address ||
                    item.nuevo_gateway ||
                    item.nuevo_comentario ||
                    item.nuevo_foto;

                return (
                    <div
                        className={cn(
                            'rounded-xl border p-2.5 space-y-1 min-w-[230px]',
                            hasNuevoData || item.nuevo_instalado
                                ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                : 'border-dashed border-slate-200 dark:border-slate-800 bg-transparent'
                        )}
                    >
                        <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-900/40 pb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Final
                            </span>
                            <div className="flex items-center gap-1.5">
                                {item.nuevo_foto && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(item.nuevo_foto!, `Equipo Final - ${item.localidad_nombre}`);
                                        }}
                                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                        title="Ver foto equipo final"
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px]',
                                        item.nuevo_instalado
                                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    )}
                                >
                                    {item.nuevo_instalado ? 'Instalado: Sí' : 'Pendiente'}
                                </Badge>
                            </div>
                        </div>

                        {hasNuevoData ? (
                            <div className="space-y-0.5 text-xs">
                                {(item.nuevo_marca || item.nuevo_modelo) && (
                                    <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                                        {[item.nuevo_marca, item.nuevo_modelo].filter(Boolean).join(' • ')}
                                    </p>
                                )}
                                <p className="font-mono text-[11px]">
                                    <span className="text-muted-foreground">S/N:</span>{' '}
                                    <strong className="text-foreground">{item.nuevo_no_serie || '—'}</strong>
                                </p>
                                {item.nuevo_ip && (
                                    <p className="font-mono text-[11px] flex items-center gap-1">
                                        <Network className="h-3 w-3 text-emerald-600" />
                                        <span>{item.nuevo_ip}</span>
                                        {item.nuevo_mascara && (
                                            <span className="text-muted-foreground text-[10px]">({item.nuevo_mascara})</span>
                                        )}
                                    </p>
                                )}
                                {item.nuevo_mac_address && (
                                    <p className="font-mono text-[10px] text-muted-foreground">MAC: {item.nuevo_mac_address}</p>
                                )}
                                {item.nuevo_gateway && (
                                    <p className="font-mono text-[10px] text-muted-foreground">GW: {item.nuevo_gateway}</p>
                                )}
                                {item.nuevo_comentario && (
                                    <p className="text-[11px] text-muted-foreground italic pt-0.5">“{item.nuevo_comentario}”</p>
                                )}
                                {item.nuevo_foto && (
                                    <div
                                        className="mt-1 h-10 w-16 rounded-md overflow-hidden border bg-background cursor-pointer hover:opacity-85 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLightbox(item.nuevo_foto!, `Equipo Final - ${item.localidad_nombre}`);
                                        }}
                                        title="Clic para ampliar foto del equipo final"
                                    >
                                        <img src={item.nuevo_foto} alt="Foto final" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic py-1">Por asignar nuevo biométrico</p>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Estatus',
            stopRowClick: true,
            cell: (item) => (
                <div className="flex items-center gap-2">
                    <Switch
                        disabled={!canManage}
                        checked={Boolean(item.activo)}
                        onCheckedChange={() => canManage && handleToggleStatus(item)}
                    />
                </div>
            ),
        },
        {
            header: 'Acciones',
            className: 'text-right',
            hideable: false,
            stopRowClick: true,
            cell: (item) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {item.numero_localidad && (
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/asistencia/ubicaciones?search=${item.numero_localidad}`}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Ver Ubicación #{item.numero_localidad}
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <>
                                <DropdownMenuItem onClick={() => handleEditClick(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar Biométrico Setup
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    {item.activo ? 'Desactivar' : 'Activar'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setDeletingItem(item)}
                                    className="text-red-600 focus:text-red-600 dark:text-red-400"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title="Biométricos Setup - Reloj Checador" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <ModuleHeader
                    icon={<Cpu className="h-6 w-6 text-white" />}
                    title="Biométricos Setup (Inventario Inicial y Final)"
                    description="Gestiona la configuración de red, números de serie, direcciones IP/MAC, características de instalación y transición de Equipos Iniciales a Finales por localidad."
                    colorClassName="bg-emerald-600"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                            <Link href="/admin/asistencia/ubicaciones">
                                <MapPin className="mr-2 h-4 w-4" />
                                Catálogo de Ubicaciones
                            </Link>
                        </Button>
                        {canManage && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="gap-2"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    Importar Excel Maestro
                                </Button>
                                <Button onClick={handleCreateClick}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Biométrico
                                </Button>
                            </>
                        )}
                    </div>
                </ModuleHeader>

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Cpu className="h-6 w-6" />}
                        title="TOTAL EQUIPOS / POSICIONES"
                        value={stats.total}
                        colorClassName="bg-indigo-100 text-indigo-600"
                    />
                    <StatCard
                        icon={<Server className="h-6 w-6" />}
                        title="EQUIPOS INICIALES INSTALADOS"
                        value={stats.actual_instalados}
                        colorClassName="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        title="NUEVOS BIOMÉTRICOS INSTALADOS"
                        value={stats.nuevo_instalados}
                        colorClassName="bg-sky-100 text-sky-600"
                    />
                    <StatCard
                        icon={<AlertTriangle className="h-6 w-6" />}
                        title="UBICACIÓN POR DEFINIR (???)"
                        value={stats.pendientes_ubicacion}
                        colorClassName="bg-amber-100 text-amber-600"
                    />
                </div>

                {/* Filtros */}
                <FilterBar>
                    <div className="flex flex-wrap items-end gap-3">
                        <FilterField label="Buscar">
                            <Input
                                placeholder="Buscar por localidad, IP, serie, MAC, ubicación..."
                                className="w-full md:w-72"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </FilterField>

                        <FilterField label="Legacy">
                            <Select value={legacyFilter} onValueChange={setLegacyFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Legacy</SelectItem>
                                    {legaciesDisponibles.map((leg) => (
                                        <SelectItem key={leg} value={leg}>
                                            {leg}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Planta / Ubicación">
                            <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                                <SelectTrigger className="w-full md:w-64">
                                    <SelectValue placeholder="Todas las plantas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las plantas</SelectItem>
                                    {ubicacionesCatalogo.map((ub) => (
                                        <SelectItem key={ub.id} value={String(ub.id)}>
                                            {ub.numero_localidad ? `#${ub.numero_localidad} - ` : ''}
                                            {ub.planta}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Inicial Instalado">
                            <Select value={actualInstaladoFilter} onValueChange={setActualInstaladoFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Sí (Instalado)</SelectItem>
                                    <SelectItem value="0">No instalado</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        <FilterField label="Final Instalado">
                            <Select value={nuevoInstaladoFilter} onValueChange={setNuevoInstaladoFilter}>
                                <SelectTrigger className="w-full md:w-40">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Sí (Instalado)</SelectItem>
                                    <SelectItem value="0">Pendiente</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>

                        {(numLocalidadFilter || ubicacionFilter !== 'all' || legacyFilter !== 'all' || searchTerm) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setLegacyFilter('all');
                                    setUbicacionFilter('all');
                                    setNumLocalidadFilter('');
                                    setActualInstaladoFilter('all');
                                    setNuevoInstaladoFilter('all');
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                </FilterBar>

                {/* Tabla Principal */}
                <DataTable
                    data={biometricos}
                    columns={columns}
                    filters={filters}
                    onRowClick={(item) => canManage && handleEditClick(item)}
                />
            </div>

            {/* Modal Crear / Editar Biométrico Setup */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[95vw] lg:max-w-[1040px] max-h-[92vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingItem ? 'Editar Biométrico Setup' : 'Registrar Biométrico Setup'}
                        </DialogTitle>
                        <DialogDescription>
                            Configura la localidad, características de instalación física y especificaciones de Equipos Inicial y Final.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                        {/* Sección 1: Localidad y Ubicación Física */}
                        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                1. Localidad y Ubicación Física
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-6 space-y-2">
                                    <Label>Vincular con Catálogo de Ubicaciones</Label>
                                    <Select
                                        value={data.reloj_ubicacion_id ? String(data.reloj_ubicacion_id) : 'none'}
                                        onValueChange={handleSelectUbicacionCatalogo}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar planta del catálogo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin vincular / Manual</SelectItem>
                                            {ubicacionesCatalogo.map((ub) => (
                                                <SelectItem key={ub.id} value={String(ub.id)}>
                                                    {ub.numero_localidad ? `[#${ub.numero_localidad}] ` : ''}
                                                    {ub.planta} {ub.legacy ? `(${ub.legacy})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="numero_localidad">Núm. Localidad</Label>
                                    <Input
                                        id="numero_localidad"
                                        type="number"
                                        placeholder="Ej. 26"
                                        value={data.numero_localidad}
                                        onChange={(e) => setData('numero_localidad', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="legacy">Legacy</Label>
                                    <Select
                                        value={data.legacy || 'none'}
                                        onValueChange={(val) => setData('legacy', val === 'none' ? '' : val)}
                                    >
                                        <SelectTrigger id="legacy">
                                            <SelectValue placeholder="Seleccionar Legacy..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin Legacy</SelectItem>
                                            <SelectItem value="fSK NA">fSK NA</SelectItem>
                                            <SelectItem value="fSK NA (PS)">fSK NA (PS)</SelectItem>
                                            <SelectItem value="fSK MX">fSK MX</SelectItem>
                                            <SelectItem value="fWR GG">fWR GG</SelectItem>
                                            <SelectItem value="BIB">BIB</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="localidad_nombre">Nombre de Localidad *</Label>
                                    <Input
                                        id="localidad_nombre"
                                        placeholder="Ej. CONSUMER PACKAGING TIJUANA (LSKNA)"
                                        value={data.localidad_nombre}
                                        onChange={(e) => setData('localidad_nombre', e.target.value)}
                                        required
                                    />
                                    {errors.localidad_nombre && (
                                        <p className="text-xs text-red-500">{errors.localidad_nombre}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="ubicacion_fisica">Ubicación Física en Planta</Label>
                                    <Input
                                        id="ubicacion_fisica"
                                        placeholder="Ej. Recepción, Comedor, Caseta 1, o ???"
                                        value={data.ubicacion_fisica}
                                        onChange={(e) => setData('ubicacion_fisica', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Características de Instalación */}
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10 p-4 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-2">
                                <Wrench className="h-4 w-4 text-amber-600" />
                                2. Características de Instalación
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="dimensiones" className="flex items-center gap-1.5">
                                        <Ruler className="h-3.5 w-3.5 text-amber-600" />
                                        2. Dimensiones
                                    </Label>
                                    <Input
                                        id="dimensiones"
                                        placeholder="Ej. 185 x 85 x 20 mm / 7.2 x 3.3 in"
                                        value={data.dimensiones}
                                        onChange={(e) => setData('dimensiones', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="instalacion_fisica" className="flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-amber-600" />
                                        3. Instalación física
                                    </Label>
                                    <Input
                                        id="instalacion_fisica"
                                        placeholder="Ej. Montaje en pared, pedestal metálico, soporte brazo..."
                                        value={data.instalacion_fisica}
                                        onChange={(e) => setData('instalacion_fisica', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-1.5">
                                    <Label htmlFor="instalacion_comentario">4. Comentarios de Instalación</Label>
                                    <Textarea
                                        id="instalacion_comentario"
                                        rows={2}
                                        placeholder="Detalles de cableado UTP, alimentación PoE/12V, altura de montaje, canalización..."
                                        value={data.instalacion_comentario}
                                        onChange={(e) => setData('instalacion_comentario', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <PhotoDropzone
                                        id="instalacion_foto"
                                        label="5. Foto de la Instalación Física"
                                        description="Arrastra y suelta aquí la fotografía de la instalación, o haz clic para seleccionarla."
                                        value={data.instalacion_foto}
                                        onChange={(val) => setData('instalacion_foto', val)}
                                        onViewFull={openLightbox}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Equipos Biométricos con Tabs (Inicial y Final) */}
                        <div className="rounded-xl border bg-card p-4 space-y-3">
                            <Tabs defaultValue="inicial" className="w-full">
                                <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-primary" />
                                        3. Equipos Biométricos
                                    </h3>
                                    <TabsList className="grid w-full sm:w-64 grid-cols-2">
                                        <TabsTrigger value="inicial" className="gap-1.5 font-medium">
                                            <Server className="h-3.5 w-3.5 text-indigo-600" />
                                            Inicial
                                        </TabsTrigger>
                                        <TabsTrigger value="final" className="gap-1.5 font-medium">
                                            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                            Final
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* TAB INICIAL */}
                                <TabsContent value="inicial" className="space-y-4 pt-3">
                                    <div className="rounded-xl border bg-slate-50/70 dark:bg-slate-900/30 p-4 space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2.5">
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                    <Server className="h-4 w-4 text-indigo-600" />
                                                    Equipo Inicial (Configuración y Foto)
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Datos del reloj checador inicial / existente en la posición.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="actual_instalado_switch" className="text-xs font-medium cursor-pointer">
                                                    Instalado
                                                </Label>
                                                <Switch
                                                    id="actual_instalado_switch"
                                                    checked={Boolean(data.actual_instalado)}
                                                    onCheckedChange={(v) => setData('actual_instalado', v)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_marca">Marca</Label>
                                                <Input
                                                    id="actual_marca"
                                                    placeholder="Ej. ZKTeco, Suprema, GTI..."
                                                    value={data.actual_marca}
                                                    onChange={(e) => setData('actual_marca', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_modelo">Modelo</Label>
                                                <Input
                                                    id="actual_modelo"
                                                    placeholder="Ej. iFace 800, BioStation 2..."
                                                    value={data.actual_modelo}
                                                    onChange={(e) => setData('actual_modelo', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_no_serie">No. Serie</Label>
                                                <Input
                                                    id="actual_no_serie"
                                                    placeholder="Ej. 543726588"
                                                    value={data.actual_no_serie}
                                                    onChange={(e) => setData('actual_no_serie', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_ip">Dirección IP</Label>
                                                <Input
                                                    id="actual_ip"
                                                    placeholder="Ej. 10.42.134.134"
                                                    value={data.actual_ip}
                                                    onChange={(e) => setData('actual_ip', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_mascara">Mask / subnet</Label>
                                                <Input
                                                    id="actual_mascara"
                                                    placeholder="Ej. 255.255.255.192"
                                                    value={data.actual_mascara}
                                                    onChange={(e) => setData('actual_mascara', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="actual_gateway">Gateway</Label>
                                                <Input
                                                    id="actual_gateway"
                                                    placeholder="Ej. 10.42.134.129"
                                                    value={data.actual_gateway}
                                                    onChange={(e) => setData('actual_gateway', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                                                <Label htmlFor="actual_mac_address">Mac Address</Label>
                                                <Input
                                                    id="actual_mac_address"
                                                    placeholder="Ej. 00:17:61:11:F0:FC"
                                                    value={data.actual_mac_address}
                                                    onChange={(e) => setData('actual_mac_address', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                                                <Label htmlFor="actual_comentario">Comentario</Label>
                                                <Textarea
                                                    id="actual_comentario"
                                                    rows={2}
                                                    placeholder="Ej. S/N, cierre de planta, oficinas en remodelación..."
                                                    value={data.actual_comentario}
                                                    onChange={(e) => setData('actual_comentario', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3">
                                                <PhotoDropzone
                                                    id="actual_foto"
                                                    label="Foto del Equipo Inicial (Drag & Drop)"
                                                    description="Arrastra y suelta aquí la imagen del equipo inicial / actual o haz clic para seleccionarla."
                                                    value={data.actual_foto}
                                                    onChange={(val) => setData('actual_foto', val)}
                                                    onViewFull={openLightbox}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB FINAL */}
                                <TabsContent value="final" className="space-y-4 pt-3">
                                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/15 p-4 space-y-4">
                                        <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/50 pb-2.5">
                                            <div>
                                                <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-emerald-600" />
                                                    Equipo Final (Configuración y Foto)
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Datos del nuevo biométrico final a operar en esta localidad.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="nuevo_instalado_switch" className="text-xs font-medium cursor-pointer">
                                                    Instalado
                                                </Label>
                                                <Switch
                                                    id="nuevo_instalado_switch"
                                                    checked={Boolean(data.nuevo_instalado)}
                                                    onCheckedChange={(v) => setData('nuevo_instalado', v)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_marca">Marca</Label>
                                                <Input
                                                    id="nuevo_marca"
                                                    placeholder="Ej. ZKTeco, Suprema, GTI..."
                                                    value={data.nuevo_marca}
                                                    onChange={(e) => setData('nuevo_marca', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_modelo">Modelo</Label>
                                                <Input
                                                    id="nuevo_modelo"
                                                    placeholder="Ej. SpeedFace-V5L, ProFace X, SFace900..."
                                                    value={data.nuevo_modelo}
                                                    onChange={(e) => setData('nuevo_modelo', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_no_serie">No. Serie</Label>
                                                <Input
                                                    id="nuevo_no_serie"
                                                    placeholder="Número de serie nuevo"
                                                    value={data.nuevo_no_serie}
                                                    onChange={(e) => setData('nuevo_no_serie', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_ip">Dirección IP</Label>
                                                <Input
                                                    id="nuevo_ip"
                                                    placeholder="Ej. 10.52.134.50"
                                                    value={data.nuevo_ip}
                                                    onChange={(e) => setData('nuevo_ip', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_mascara">Mask / subnet</Label>
                                                <Input
                                                    id="nuevo_mascara"
                                                    placeholder="Ej. 255.255.255.0"
                                                    value={data.nuevo_mascara}
                                                    onChange={(e) => setData('nuevo_mascara', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="nuevo_gateway">Gateway</Label>
                                                <Input
                                                    id="nuevo_gateway"
                                                    placeholder="Ej. 10.52.134.1"
                                                    value={data.nuevo_gateway}
                                                    onChange={(e) => setData('nuevo_gateway', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                                                <Label htmlFor="nuevo_mac_address">Mac Address</Label>
                                                <Input
                                                    id="nuevo_mac_address"
                                                    placeholder="Ej. 00:17:61:A4:5B:22"
                                                    value={data.nuevo_mac_address}
                                                    onChange={(e) => setData('nuevo_mac_address', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                                                <Label htmlFor="nuevo_comentario">Comentario</Label>
                                                <Textarea
                                                    id="nuevo_comentario"
                                                    rows={2}
                                                    placeholder="Observaciones de instalación del equipo final..."
                                                    value={data.nuevo_comentario}
                                                    onChange={(e) => setData('nuevo_comentario', e.target.value)}
                                                />
                                            </div>

                                            <div className="sm:col-span-2 lg:col-span-3">
                                                <PhotoDropzone
                                                    id="nuevo_foto"
                                                    label="Foto del Equipo Final (Drag & Drop)"
                                                    description="Arrastra y suelta aquí la imagen del equipo nuevo final o haz clic para seleccionarla."
                                                    value={data.nuevo_foto}
                                                    onChange={(val) => setData('nuevo_foto', val)}
                                                    onViewFull={openLightbox}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Biométrico Setup'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Importación Masiva */}
            <EquiposUbicacionesImportModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                defaultScope="ambos"
            />

            {/* Modal Lightbox para visualización ampliada de fotos */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent className="max-w-3xl p-5">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Camera className="h-4 w-4 text-primary" />
                            {lightboxImage?.title || 'Visualización de Fotografía'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 flex items-center justify-center bg-black/5 dark:bg-black/30 rounded-xl overflow-hidden max-h-[75vh] border">
                        {lightboxImage?.src && (
                            <img
                                src={lightboxImage.src}
                                alt={lightboxImage.title}
                                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                            />
                        )}
                    </div>
                    <DialogFooter className="mt-3">
                        <Button type="button" variant="outline" onClick={() => setLightboxImage(null)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmación de Eliminación */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Registro de Biométrico Setup</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar el equipo de{' '}
                            <strong>{deletingItem?.localidad_nombre}</strong> ({deletingItem?.ubicacion_fisica || '???'})?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
