import { Head } from '@inertiajs/react';
import {
    ShieldCheck,
    Zap,
    Sparkles,
    Plus,
    Building2,
    RotateCcw,
    Copy,
    Pencil,
    Trash2,
    MoreVertical,
    Check,
    Save,
    Loader2,
    ArrowUp,
    ArrowDown,
    Eye,
    CheckCircle,
    XCircle,
    SlidersHorizontal,
    Layers,
    FileText,
} from 'lucide-react';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

export interface ChecklistItem {
    id: number;
    empresa_id: number;
    sucursal_id?: number | null;
    seccion: 'validacion' | 'limpieza' | 'qc';
    nombre: string;
    descripcion?: string | null;
    icono?: string | null;
    orden: number;
    activo: boolean;
    is_default: boolean;
}

interface SucursalOption {
    id: number;
    nombre: string;
}

interface Props {
    sucursales: SucursalOption[];
    initialItems: ChecklistItem[];
    initialGrouped: Record<string, ChecklistItem[]>;
    initialSucursalId?: number | null;
    isBranchCustomized?: boolean;
}

const EMOJI_CATEGORIES = [
    {
        name: 'Hardware & Pantalla',
        emojis: ['📱', '🖥️', '👆', '📲', '⏏️', '🔌', '📏', '☀️', '🖲️'],
    },
    {
        name: 'Batería & Energía',
        emojis: ['🔋', '⚡', '🔌', '🪫', '💡', '🔥', '⚙️'],
    },
    {
        name: 'Cámaras & Sensores',
        emojis: ['📷', '🤳', '📸', '🔦', '😊', '🗺️', '🔍', '👁️', '🔐'],
    },
    {
        name: 'Audio & Sonido',
        emojis: ['🔊', '🔈', '🎙️', '🔉', '🎧', '📳', '🔇', '🎵'],
    },
    {
        name: 'Conexión & Red',
        emojis: ['📶', '🔵', '📡', '🌐', '📍', '🛰️', '🔄'],
    },
    {
        name: 'Limpieza & Sellos',
        emojis: ['✨', '🧹', '🧼', '🔩', '🔒', '🧽', '🧴', '🏷️', '✅'],
    },
    {
        name: 'QC & Garantía',
        emojis: ['🛡️', '✅', '✔️', '🧪', '📋', '📞', '📦', '🏆', '🧠'],
    },
];

export default function PostReparacionConfig({
    sucursales = [],
    initialItems = [],
    initialGrouped = {},
    initialSucursalId = null,
    isBranchCustomized = false,
}: Props) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Inicio'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: __('Post reparación & QC'), href: '/admin/reparaciones/post-reparacion' },
    ];

    // Estados de datos
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        initialSucursalId ? String(initialSucursalId) : 'general'
    );
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<ChecklistItem[]>(initialItems);
    const [isCustomBranch, setIsCustomBranch] = useState<boolean>(isBranchCustomized);
    const [isLoading, setIsLoading] = useState(false);

    // Modales de Creación y Edición
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItemSection, setNewItemSection] = useState<'validacion' | 'limpieza' | 'qc'>('validacion');
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('📱');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [isSavingNew, setIsSavingNew] = useState(false);

    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Modales de Confirmación
    const [itemToDelete, setItemToDelete] = useState<ChecklistItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [openResetModal, setOpenResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const [openCopyModal, setOpenCopyModal] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Modal de Simulador Técnico / Ficha
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const [previewChecks, setPreviewChecks] = useState<Record<number, boolean>>({});

    const isFetchingRef = useRef(false);

    const getCsrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const fetchItems = useCallback(async (sucursalToFetch?: string) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setIsLoading(true);
        try {
            const branch = sucursalToFetch !== undefined ? sucursalToFetch : selectedSucursal;
            const sucursalParam = branch === 'general' ? '' : `?sucursal_id=${branch}`;
            const res = await fetch(`/admin/reparaciones/checklist${sucursalParam}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data && data.items) {
                setItems(data.items);
                setIsCustomBranch(!!data.isBranchCustomized);
            }
        } catch (err) {
            console.error('Error fetching checklist items:', err);
            notifyError(__('No se pudieron cargar los puntos del checklist.'));
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, [selectedSucursal, __]);

    const handleSucursalChange = (val: string) => {
        setSelectedSucursal(val);
        fetchItems(val);
    };

    // Toggle activo / inactivo
    const handleToggleStatus = async (item: ChecklistItem) => {
        const newActivo = !item.activo;
        setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, activo: newActivo } : it))
        );

        try {
            const res = await fetch(`/admin/reparaciones/checklist/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    activo: newActivo,
                    sucursal_id: selectedSucursal === 'general' ? null : Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (!data.success) {
                notifyError(data.message || __('Error al actualizar el estado.'));
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al comunicarse con el servidor.'));
            fetchItems();
        }
    };

    // Reordenar ítem (Subir / Bajar dentro de su sección)
    const handleMoveItem = async (item: ChecklistItem, direction: 'up' | 'down') => {
        const sameSectionItems = items
            .filter((i) => i.seccion === item.seccion)
            .sort((a, b) => a.orden - b.orden);

        const currentIndex = sameSectionItems.findIndex((i) => i.id === item.id);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= sameSectionItems.length) return;

        const targetItem = sameSectionItems[targetIndex];
        sameSectionItems[currentIndex] = targetItem;
        sameSectionItems[targetIndex] = item;

        const updatedSectionList = sameSectionItems.map((it, idx) => ({
            ...it,
            orden: idx + 1,
        }));

        setItems((prev) => {
            const otherItems = prev.filter((it) => it.seccion !== item.seccion);
            return [...otherItems, ...updatedSectionList].sort((a, b) => {
                if (a.seccion === b.seccion) return a.orden - b.orden;
                return a.seccion.localeCompare(b.seccion);
            });
        });

        try {
            const res = await fetch('/admin/reparaciones/checklist/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    items: updatedSectionList.map((i) => ({ id: i.id, orden: i.orden })),
                }),
            });
            const data = await res.json();
            if (!data.success) {
                notifyError(data.message || __('Error al reordenar.'));
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al guardar el nuevo orden.'));
            fetchItems();
        }
    };

    // Duplicar punto
    const handleDuplicate = async (item: ChecklistItem) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/admin/reparaciones/checklist/${item.id}/duplicate`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al duplicar.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al duplicar punto.'));
        } finally {
            setIsLoading(false);
        }
    };

    // Modal Crear
    const handleOpenCreate = () => {
        setNewItemSection(sectionFilter !== 'all' ? (sectionFilter as any) : 'validacion');
        setNewItemName('');
        setNewItemIcon('📱');
        setNewItemDesc('');
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setIsSavingNew(true);
        try {
            const res = await fetch('/admin/reparaciones/checklist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    seccion: newItemSection,
                    nombre: newItemName.trim(),
                    icono: newItemIcon.trim() || '📌',
                    descripcion: newItemDesc.trim() || null,
                    sucursal_id: selectedSucursal === 'general' ? null : Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Punto agregado exitosamente.'));
                setIsCreateOpen(false);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al crear el punto.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al guardar el nuevo punto.'));
        } finally {
            setIsSavingNew(false);
        }
    };

    // Modal Editar
    const handleOpenEdit = (item: ChecklistItem) => {
        setEditingItem(item);
        setEditName(item.nombre);
        setEditIcon(item.icono || '📱');
        setEditDesc(item.descripcion || '');
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editName.trim()) return;

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/admin/reparaciones/checklist/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    nombre: editName.trim(),
                    icono: editIcon.trim() || null,
                    descripcion: editDesc.trim() || null,
                    sucursal_id: selectedSucursal === 'general' ? null : Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Punto actualizado correctamente.'));
                setEditingItem(null);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al actualizar.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al guardar los cambios.'));
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Confirmar Eliminar
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/admin/reparaciones/checklist/${itemToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Punto eliminado.'));
                setItemToDelete(null);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al eliminar.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al eliminar el punto.'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Confirmar Restablecer
    const handleResetConfirm = async () => {
        setIsResetting(true);
        try {
            const res = await fetch('/admin/reparaciones/checklist/reset-defaults', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    sucursal_id: selectedSucursal === 'general' ? null : Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Valores predeterminados restaurados.'));
                setOpenResetModal(false);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al restablecer.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al procesar la solicitud.'));
        } finally {
            setIsResetting(false);
        }
    };

    // Confirmar Copiar Plantilla
    const handleCopyConfirm = async () => {
        if (selectedSucursal === 'general') return;
        setIsCopying(true);
        try {
            const res = await fetch('/admin/reparaciones/checklist/copy-to-branch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    sucursal_id: Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Configuración copiada exitosamente.'));
                setOpenCopyModal(false);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al copiar configuración.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al copiar configuración.'));
        } finally {
            setIsCopying(false);
        }
    };

    // Filtrado de elementos
    const filteredItems = useMemo(() => {
        return items.filter((it) => {
            // Filtro por sección
            if (sectionFilter !== 'all' && it.seccion !== sectionFilter) {
                return false;
            }

            // Filtro por estado
            if (statusFilter === 'active' && !it.activo) return false;
            if (statusFilter === 'inactive' && it.activo) return false;

            // Filtro por texto
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const matchName = it.nombre.toLowerCase().includes(q);
                const matchDesc = it.descripcion && it.descripcion.toLowerCase().includes(q);
                if (!matchName && !matchDesc) return false;
            }

            return true;
        });
    }, [items, sectionFilter, statusFilter, searchTerm]);

    // Estadísticas
    const totalCount = items.length;
    const activeCount = items.filter((i) => i.activo).length;
    const validacionCount = items.filter((i) => i.seccion === 'validacion').length;
    const limpiezaCount = items.filter((i) => i.seccion === 'limpieza').length;
    const qcCount = items.filter((i) => i.seccion === 'qc').length;

    // Helper de paginación compatible con DataTable
    const paginatedData: Paginated<ChecklistItem> & { from?: number; to?: number } = useMemo(() => {
        return {
            data: filteredItems,
            current_page: 1,
            last_page: 1,
            per_page: filteredItems.length || 10,
            total: filteredItems.length,
            from: filteredItems.length > 0 ? 1 : 0,
            to: filteredItems.length,
            links: [],
        };
    }, [filteredItems]);

    // Columnas estándar de DataTable
    const columns: ColumnDef<ChecklistItem>[] = [
        {
            header: __('Orden'),
            className: 'w-24 text-center',
            cell: (item) => {
                const sameSection = items
                    .filter((i) => i.seccion === item.seccion)
                    .sort((a, b) => a.orden - b.orden);
                const itemIndex = sameSection.findIndex((i) => i.id === item.id);
                const isFirst = itemIndex === 0;
                const isLast = itemIndex === sameSection.length - 1;

                return (
                    <div className="flex items-center justify-center gap-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isFirst}
                            onClick={() => handleMoveItem(item, 'up')}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title={__('Subir posición')}
                        >
                            <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <span className="font-mono text-xs font-bold text-slate-500 w-5 text-center">
                            {item.orden}
                        </span>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isLast}
                            onClick={() => handleMoveItem(item, 'down')}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title={__('Bajar posición')}
                        >
                            <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                );
            },
        },
        {
            header: __('Punto de Control'),
            accessorKey: 'nombre',
            cell: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0 select-none border border-slate-200/60 dark:border-slate-700">
                        {item.icono || '📌'}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'font-bold text-sm text-slate-900 dark:text-slate-100',
                                    !item.activo && 'line-through text-slate-400'
                                )}
                            >
                                {item.nombre}
                            </span>
                            {item.is_default && (
                                <Badge className="text-[9px] px-1.5 py-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-normal">
                                    {__('Defecto')}
                                </Badge>
                            )}
                        </div>
                        {item.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                                {item.descripcion}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: __('Sección'),
            accessorKey: 'seccion',
            cell: (item) => {
                switch (item.seccion) {
                    case 'validacion':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                {__('1. Funciones Electrónicas')}
                            </span>
                        );
                    case 'limpieza':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                {__('2. Limpieza & Protocolos')}
                            </span>
                        );
                    case 'qc':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                {__('3. Control Calidad')}
                            </span>
                        );
                    default:
                        return null;
                }
            },
        },
        {
            header: __('Ámbito'),
            cell: (item) => (
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {item.sucursal_id ? __('Sucursal Propia') : __('General (Empresa)')}
                </span>
            ),
        },
        {
            header: __('Estado'),
            stopRowClick: true,
            cell: (item) => (
                <div className="flex items-center space-x-2">
                    <Switch
                        checked={item.activo}
                        onCheckedChange={() => handleToggleStatus(item)}
                    />
                    <span
                        className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            item.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900'
                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800'
                        )}
                    >
                        {item.activo ? __('Activo') : __('Inactivo')}
                    </span>
                </div>
            ),
        },
        {
            header: __('Acciones'),
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
                        <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {__('Editar')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {__('Duplicar')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setItemToDelete(item)}
                            className="text-rose-600 focus:text-rose-600 dark:text-rose-400"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const selectedSucursalObj = sucursales.find((s) => String(s.id) === selectedSucursal);

    return (
        <>
            <Head title={__('Control de Calidad & Post-Reparación')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ENCABEZADO ESTÁNDAR DEL MÓDULO */}
                <ModuleHeader
                    icon={<ShieldCheck className="h-6 w-6 text-white" />}
                    title={__('Control de Calidad & Post-Reparación')}
                    description={__(
                        'Administre los protocolos de validación electrónica, limpieza y control de calidad antes de la entrega del equipo.'
                    )}
                    colorClassName="bg-purple-600"
                >
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setOpenPreviewModal(true)}
                            className="font-bold gap-2 bg-white/15 hover:bg-white/25 text-white border-0"
                        >
                            <Eye className="h-4 w-4" />
                            {__('Simulador / Ficha')}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleOpenCreate}
                            className="bg-white text-purple-700 hover:bg-slate-100 font-bold gap-2 shadow-xs"
                        >
                            <Plus className="h-4 w-4" />
                            {__('Nuevo Punto')}
                        </Button>
                    </div>
                </ModuleHeader>

                {/* TARJETAS DE ESTADÍSTICAS */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
                    <StatCard
                        icon={<ShieldCheck className="h-6 w-6" />}
                        title={__('TOTAL PUNTOS')}
                        value={totalCount}
                        colorClassName="bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                    />
                    <StatCard
                        icon={<Zap className="h-6 w-6" />}
                        title={__('FUNCIONES ELECTRÓNICAS')}
                        value={validacionCount}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<Sparkles className="h-6 w-6" />}
                        title={__('LIMPIEZA & PROTOCOLOS')}
                        value={limpiezaCount}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title={__('CONTROL DE CALIDAD (QC)')}
                        value={qcCount}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    />
                </div>

                {/* BARRA DE FILTROS ESTÁNDAR */}
                <FilterBar>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end w-full">
                        {/* BUSCAR */}
                        <FilterField label={__('Buscar')}>
                            <Input
                                placeholder={__('Nombre del punto o criterio...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </FilterField>

                        {/* SUCURSAL / ÁMBITO */}
                        <FilterField label={__('Ámbito / Sucursal')}>
                            <Select value={selectedSucursal} onValueChange={handleSucursalChange}>
                                <SelectTrigger className="h-9 text-xs font-medium">
                                    <SelectValue placeholder={__('Seleccionar ámbito')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">
                                        🏢 {__('General de Empresa (Todas)')}
                                    </SelectItem>
                                    {sucursales.map((suc) => (
                                        <SelectItem key={suc.id} value={String(suc.id)}>
                                            📍 {suc.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterField>

                        {/* ESTADO */}
                        <FilterField label={__('Estado')}>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-9 text-xs font-medium">
                                    <SelectValue placeholder={__('Todos los estados')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{__('Todos')}</SelectItem>
                                    <SelectItem value="active">{__('Solo Activos')}</SelectItem>
                                    <SelectItem value="inactive">{__('Solo Inactivos')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* PESTAÑAS (TABS) POR CADA TIPO/SECCIÓN */}
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setSectionFilter('all')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer',
                            sectionFilter === 'all'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{__('Todas las Secciones')}</span>
                        <Badge
                            className={cn(
                                'ml-1 text-[10px] px-1.5 py-0 rounded-md font-mono font-bold',
                                sectionFilter === 'all'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            )}
                        >
                            {totalCount}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSectionFilter('validacion')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer',
                            sectionFilter === 'validacion'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{__('Funciones Electrónicas')}</span>
                        <Badge
                            className={cn(
                                'ml-1 text-[10px] px-1.5 py-0 rounded-md font-mono font-bold',
                                sectionFilter === 'validacion'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                            )}
                        >
                            {validacionCount}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSectionFilter('limpieza')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer',
                            sectionFilter === 'limpieza'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{__('Limpieza & Protocolos')}</span>
                        <Badge
                            className={cn(
                                'ml-1 text-[10px] px-1.5 py-0 rounded-md font-mono font-bold',
                                sectionFilter === 'limpieza'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            )}
                        >
                            {limpiezaCount}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setSectionFilter('qc')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer',
                            sectionFilter === 'qc'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        )}
                    >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{__('Control de Calidad (QC)')}</span>
                        <Badge
                            className={cn(
                                'ml-1 text-[10px] px-1.5 py-0 rounded-md font-mono font-bold',
                                sectionFilter === 'qc'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                            )}
                        >
                            {qcCount}
                        </Badge>
                    </button>
                </div>

                {/* BANNER INFORMATIVO DE HERENCIA PARA SUCURSAL */}
                {selectedSucursal !== 'general' && (
                    <div
                        className={cn(
                            'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs',
                            isCustomBranch
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                                : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200'
                        )}
                    >
                        <div>
                            <strong className="font-bold">
                                {isCustomBranch
                                    ? __('Esta sucursal utiliza una plantilla independiente.')
                                    : __('Esta sucursal está heredando la plantilla general de la Empresa.')}
                            </strong>
                            <p className="text-[11px] opacity-80 mt-0.5">
                                {isCustomBranch
                                    ? __('Los cambios aplicados solo afectarán a esta sucursal.')
                                    : __('Los cambios generales se reflejan aquí a menos que cree una copia específica.')}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {isCustomBranch ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOpenCopyModal(true)}
                                    className="h-8 text-xs font-bold border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                    {__('Restablecer a Plantilla General')}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setOpenCopyModal(true)}
                                    className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Copy className="w-3.5 h-3.5 mr-1" />
                                    {__('Personalizar para esta Sucursal')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* TABLA PRINCIPAL ESTÁNDAR */}
                <DataTable
                    data={paginatedData}
                    columns={columns}
                    isLoading={isLoading}
                    emptyMessage={__('No se encontraron puntos de control para los filtros seleccionados.')}
                />

                {/* BOTÓN RESTABLECER A VALORES POR DEFECTO DEL SISTEMA */}
                <div className="flex items-center justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenResetModal(true)}
                        className="text-xs font-bold text-slate-600 dark:text-slate-400 gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        {__('Restablecer a Valores de Fábrica del Sistema')}
                    </Button>
                </div>

                {/* MODAL CREAR NUEVO PUNTO */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Plus className="w-4 h-4 text-purple-600" />
                                {__('Nuevo Punto de Control')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {__(
                                    'Agregue un nuevo punto de auditoría técnica que el técnico deberá validar.'
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Sección *')}</Label>
                                <Select
                                    value={newItemSection}
                                    onValueChange={(val: any) => setNewItemSection(val)}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="validacion">⚡ {__('1. Funciones Electrónicas')}</SelectItem>
                                        <SelectItem value="limpieza">✨ {__('2. Limpieza & Protocolos')}</SelectItem>
                                        <SelectItem value="qc">🛡️ {__('3. Control de Calidad (QC)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Nombre del Punto *')}</Label>
                                <Input
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder={__('Ej. Reconocimiento Facial, Lector de Huella...')}
                                    className="text-xs"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold">{__('Ícono o Emoji')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newItemIcon}
                                        onChange={(e) => setNewItemIcon(e.target.value)}
                                        className="text-base w-16 text-center font-bold"
                                        maxLength={4}
                                    />
                                    <span className="text-[11px] text-muted-foreground">
                                        {__('Seleccione o escriba un emoji:')}
                                    </span>
                                </div>

                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 max-h-36 overflow-y-auto">
                                    {EMOJI_CATEGORIES.map((cat) => (
                                        <div key={cat.name} className="space-y-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {cat.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {cat.emojis.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        onClick={() => setNewItemIcon(emoji)}
                                                        className={cn(
                                                            'w-7 h-7 text-sm flex items-center justify-center rounded-lg transition-all',
                                                            newItemIcon === emoji
                                                                ? 'bg-purple-600 text-white shadow-xs scale-110'
                                                                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        )}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Descripción (Opcional)')}</Label>
                                <Textarea
                                    value={newItemDesc}
                                    onChange={(e) => setNewItemDesc(e.target.value)}
                                    placeholder={__('Instrucciones o detalle de lo que el técnico debe verificar...')}
                                    className="text-xs min-h-[60px]"
                                />
                            </div>

                            <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="text-xs font-bold"
                                >
                                    {__('Cancelar')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingNew || !newItemName.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5"
                                >
                                    {isSavingNew ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    {__('Guardar Punto')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* MODAL EDITAR PUNTO */}
                <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                    <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-purple-600" />
                                {__('Editar Punto de Control')}
                            </DialogTitle>
                        </DialogHeader>

                        {editingItem && (
                            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">{__('Nombre del Punto *')}</Label>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-xs"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">{__('Ícono o Emoji')}</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editIcon}
                                            onChange={(e) => setEditIcon(e.target.value)}
                                            className="text-base w-16 text-center font-bold"
                                            maxLength={4}
                                        />
                                    </div>
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 max-h-36 overflow-y-auto">
                                        {EMOJI_CATEGORIES.map((cat) => (
                                            <div key={cat.name} className="space-y-1">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {cat.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {cat.emojis.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            onClick={() => setEditIcon(emoji)}
                                                            className={cn(
                                                                'w-7 h-7 text-sm flex items-center justify-center rounded-lg transition-all',
                                                                editIcon === emoji
                                                                    ? 'bg-purple-600 text-white shadow-xs scale-110'
                                                                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                                                            )}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">{__('Descripción')}</Label>
                                    <Textarea
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        className="text-xs min-h-[60px]"
                                    />
                                </div>

                                <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingItem(null)}
                                        className="text-xs font-bold"
                                    >
                                        {__('Cancelar')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSavingEdit || !editName.trim()}
                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5"
                                    >
                                        {isSavingEdit ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5" />
                                        )}
                                        {__('Guardar Cambios')}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MODAL CONFIRMAR ELIMINACIÓN */}
                <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {__('¿Eliminar punto de control?')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {__('Está a punto de eliminar:')}{' '}
                                <strong>"{itemToDelete?.nombre}"</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setItemToDelete(null)}
                                className="text-xs font-bold"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={handleDeleteConfirm}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                )}
                                {__('Eliminar')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL CONFIRMAR RESTABLECER A VALORES DE FÁBRICA */}
                <Dialog open={openResetModal} onOpenChange={setOpenResetModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {__('¿Restablecer a valores de fábrica?')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {__(
                                    'Se restaurará el checklist base del sistema (24 de validación, 5 de limpieza y 6 de control de calidad).'
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenResetModal(false)}
                                className="text-xs font-bold"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isResetting}
                                onClick={handleResetConfirm}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                            >
                                {isResetting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                )}
                                {__('Sí, Restablecer')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL CONFIRMAR COPIAR PLANTILLA GENERAL */}
                <Dialog open={openCopyModal} onOpenChange={setOpenCopyModal}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {__('Copiar plantilla general de empresa')}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {__(
                                    'Se copiarán los puntos de la empresa a la sucursal:'
                                )}{' '}
                                <strong>{selectedSucursalObj?.nombre}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenCopyModal(false)}
                                className="text-xs font-bold"
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={isCopying}
                                onClick={handleCopyConfirm}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                            >
                                {isCopying ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5 mr-1" />
                                )}
                                {__('Copiar a esta Sucursal')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* MODAL SIMULADOR TÉCNICO DE FICHA */}
                <Dialog open={openPreviewModal} onOpenChange={setOpenPreviewModal}>
                    <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 p-0 overflow-hidden">
                        <DialogHeader className="p-5 border-b bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-purple-600" />
                                        {__('Simulador de Ficha Técnica Post-Reparación')}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground">
                                        {__('Vista que completará el técnico durante la inspección del equipo.')}
                                    </DialogDescription>
                                </div>
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                    {selectedSucursal === 'general' ? __('Plantilla Matriz') : selectedSucursalObj?.nombre}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Sección 1 */}
                            <div className="space-y-2.5">
                                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>{__('1. FUNCIONES ELECTRÓNICAS')}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {items
                                        .filter((i) => i.seccion === 'validacion' && i.activo)
                                        .map((item) => {
                                            const isChecked = !!previewChecks[item.id];
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setPreviewChecks((p) => ({ ...p, [item.id]: !p[item.id] }))}
                                                    className={cn(
                                                        'p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer',
                                                        isChecked
                                                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-bold'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                                    )}
                                                >
                                                    <span className="text-base">{item.icono || '⚡'}</span>
                                                    <span className="truncate flex-1">{item.nombre}</span>
                                                    <div
                                                        className={cn(
                                                            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                                            isChecked
                                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                                : 'border-slate-300 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {isChecked && <Check className="w-3 h-3" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Sección 2 */}
                            <div className="space-y-2.5">
                                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>{__('2. LIMPIEZA & PROTOCOLOS')}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {items
                                        .filter((i) => i.seccion === 'limpieza' && i.activo)
                                        .map((item) => {
                                            const isChecked = !!previewChecks[item.id];
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setPreviewChecks((p) => ({ ...p, [item.id]: !p[item.id] }))}
                                                    className={cn(
                                                        'p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer',
                                                        isChecked
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                                    )}
                                                >
                                                    <span className="text-base">{item.icono || '✨'}</span>
                                                    <span className="truncate flex-1">{item.nombre}</span>
                                                    <div
                                                        className={cn(
                                                            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                                            isChecked
                                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                                : 'border-slate-300 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {isChecked && <Check className="w-3 h-3" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Sección 3 */}
                            <div className="space-y-2.5">
                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{__('3. CONTROL DE CALIDAD (QC)')}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {items
                                        .filter((i) => i.seccion === 'qc' && i.activo)
                                        .map((item) => {
                                            const isChecked = !!previewChecks[item.id];
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setPreviewChecks((p) => ({ ...p, [item.id]: !p[item.id] }))}
                                                    className={cn(
                                                        'p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer',
                                                        isChecked
                                                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                                    )}
                                                >
                                                    <span className="text-base">{item.icono || '🛡️'}</span>
                                                    <span className="truncate flex-1">{item.nombre}</span>
                                                    <div
                                                        className={cn(
                                                            'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                                            isChecked
                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                : 'border-slate-300 dark:border-slate-700'
                                                        )}
                                                    >
                                                        {isChecked && <Check className="w-3 h-3" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-4 border-t flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {__('Total marcados en simulación:')}{' '}
                                <strong>{Object.values(previewChecks).filter(Boolean).length}</strong>
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setOpenPreviewModal(false)}
                                className="text-xs font-bold"
                            >
                                {__('Cerrar Simulador')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
