import { Head } from '@inertiajs/react';
import {
    ShieldCheck,
    Smartphone,
    Zap,
    Lock,
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
    Sparkles,
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

export interface PreservicioItem {
    id: number;
    empresa_id: number;
    sucursal_id?: number | null;
    seccion: 'fisica' | 'funcional' | 'seguridad';
    nombre: string;
    descripcion?: string | null;
    icono?: string | null;
    tipo_campo?: 'estado_obs' | 'boolean';
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
    initialItems: PreservicioItem[];
    initialGrouped: Record<string, PreservicioItem[]>;
    initialSucursalId?: number | null;
    isBranchCustomized?: boolean;
}

const EMOJI_CATEGORIES = [
    {
        name: 'Hardware & Pantalla',
        emojis: ['📱', '🖥️', '👆', '📲', '⏏️', '🔌', '📏', '☀️', '🖲️', '🪟', '📐', '💧'],
    },
    {
        name: 'Batería & Carga',
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
        name: 'Conectividad & Red',
        emojis: ['📶', '🔵', '📡', '🌐', '📍', '🛰️', '🔄'],
    },
    {
        name: 'Seguridad & Bloqueo',
        emojis: ['🔒', '🔑', '🔢', '🛡️', '✍️', '🏷️', '✅', '📋'],
    },
];

export default function PreservicioConfig({
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
        { title: __('Preservicio & Inspección Inicial'), href: '/admin/reparaciones/preservicio-config' },
    ];

    // Estados de datos
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        initialSucursalId ? String(initialSucursalId) : 'general'
    );
    const [sectionFilter, setSectionFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<PreservicioItem[]>(initialItems);
    const [isCustomBranch, setIsCustomBranch] = useState<boolean>(isBranchCustomized);
    const [isLoading, setIsLoading] = useState(false);

    // Modales de Creación y Edición
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newItemSection, setNewItemSection] = useState<'fisica' | 'funcional' | 'seguridad'>('fisica');
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('📱');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemTipoCampo, setNewItemTipoCampo] = useState<'estado_obs' | 'boolean'>('estado_obs');
    const [isSavingNew, setIsSavingNew] = useState(false);

    const [editingItem, setEditingItem] = useState<PreservicioItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTipoCampo, setEditTipoCampo] = useState<'estado_obs' | 'boolean'>('estado_obs');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Modales de Confirmación
    const [itemToDelete, setItemToDelete] = useState<PreservicioItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [openResetModal, setOpenResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const [openCopyModal, setOpenCopyModal] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Modal de Simulador Técnico / Ficha
    const [openPreviewModal, setOpenPreviewModal] = useState(false);
    const [previewFisica, setPreviewFisica] = useState<Record<number, { estado: 'bueno' | 'malo' | 'na'; obs: string }>>({});
    const [previewBooleans, setPreviewBooleans] = useState<Record<number, boolean>>({});

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
            const res = await fetch(`/admin/reparaciones/preservicio/checklist${sucursalParam}`, {
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
            console.error('Error fetching preservicio items:', err);
            notifyError(__('No se pudieron cargar los puntos de preservicio.'));
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
    const handleToggleStatus = async (item: PreservicioItem) => {
        const newActivo = !item.activo;
        setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, activo: newActivo } : it))
        );

        try {
            const res = await fetch(`/admin/reparaciones/preservicio/checklist/${item.id}`, {
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
    const handleMoveItem = async (item: PreservicioItem, direction: 'up' | 'down') => {
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
            const res = await fetch('/admin/reparaciones/preservicio/checklist/reorder', {
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
    const handleDuplicate = async (item: PreservicioItem) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/admin/reparaciones/preservicio/checklist/${item.id}/duplicate`, {
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
        const sec = sectionFilter !== 'all' ? (sectionFilter as any) : 'fisica';
        setNewItemSection(sec);
        setNewItemName('');
        setNewItemIcon('📱');
        setNewItemDesc('');
        setNewItemTipoCampo(sec === 'fisica' ? 'estado_obs' : 'boolean');
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setIsSavingNew(true);
        try {
            const res = await fetch('/admin/reparaciones/preservicio/checklist', {
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
                    tipo_campo: newItemTipoCampo,
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
    const handleOpenEdit = (item: PreservicioItem) => {
        setEditingItem(item);
        setEditName(item.nombre);
        setEditIcon(item.icono || '📱');
        setEditDesc(item.descripcion || '');
        setEditTipoCampo(item.tipo_campo || (item.seccion === 'fisica' ? 'estado_obs' : 'boolean'));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editName.trim()) return;

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/admin/reparaciones/preservicio/checklist/${editingItem.id}`, {
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
                    tipo_campo: editTipoCampo,
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
            const res = await fetch(`/admin/reparaciones/preservicio/checklist/${itemToDelete.id}`, {
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
            const res = await fetch('/admin/reparaciones/preservicio/checklist/reset-defaults', {
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
            const res = await fetch('/admin/reparaciones/preservicio/checklist/copy-to-branch', {
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
    const fisicaCount = items.filter((i) => i.seccion === 'fisica').length;
    const funcionalCount = items.filter((i) => i.seccion === 'funcional').length;
    const seguridadCount = items.filter((i) => i.seccion === 'seguridad').length;

    // Helper de paginación compatible con DataTable
    const paginatedData: Paginated<PreservicioItem> & { from?: number; to?: number } = useMemo(() => {
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
    const columns: ColumnDef<PreservicioItem>[] = [
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
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-lg shrink-0 select-none border border-indigo-200/60 dark:border-indigo-800">
                        {item.icono || '📱'}
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
                    case 'fisica':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                                {__('1. Física & Estética')}
                            </span>
                        );
                    case 'funcional':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                {__('2. Estado & Funcional')}
                            </span>
                        );
                    case 'seguridad':
                        return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                                {__('3. Seguridad & Bloqueo')}
                            </span>
                        );
                    default:
                        return null;
                }
            },
        },
        {
            header: __('Tipo de Entrada'),
            cell: (item) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {item.tipo_campo === 'boolean'
                        ? '🔘 ' + __('Interruptor (Sí / No)')
                        : '🔍 ' + __('Inspección (Bueno / Malo / NA + Obs)')}
                </span>
            ),
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
            <Head title={__('Preservicio & Inspección Inicial')} />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* ENCABEZADO ESTÁNDAR DEL MÓDULO */}
                <ModuleHeader
                    icon={<ShieldCheck className="h-6 w-6 text-white" />}
                    title={__('Preservicio & Inspección Inicial')}
                    description={__(
                        'Administre los protocolos y puntos de inspección física, estética, pruebas funcionales y seguridad en la recepción del equipo.'
                    )}
                    colorClassName="bg-indigo-600"
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
                            className="bg-white text-indigo-700 hover:bg-slate-100 font-bold gap-2 shadow-xs"
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
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<Smartphone className="h-6 w-6" />}
                        title={__('INSPECCIÓN FÍSICA & ESTÉTICA')}
                        value={fisicaCount}
                        colorClassName="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    />
                    <StatCard
                        icon={<Zap className="h-6 w-6" />}
                        title={__('ESTADO & FUNCIONAMIENTO')}
                        value={funcionalCount}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<Lock className="h-6 w-6" />}
                        title={__('SEGURIDAD & RECEPCIÓN')}
                        value={seguridadCount}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    />
                </div>

                {/* BARRA DE FILTROS ESTÁNDAR */}
                <FilterBar
                    searchPlaceholder={__('Buscar por nombre o descripción...')}
                    searchValue={searchTerm}
                    onSearchChange={setSearchTerm}
                    filtersCount={
                        (sectionFilter !== 'all' ? 1 : 0) +
                        (statusFilter !== 'all' ? 1 : 0) +
                        (selectedSucursal !== 'general' ? 1 : 0)
                    }
                    onClearFilters={() => {
                        setSectionFilter('all');
                        setStatusFilter('all');
                        setSelectedSucursal('general');
                        setSearchTerm('');
                        fetchItems('general');
                    }}
                >
                    {/* Filtro Ámbito / Sucursal */}
                    <FilterField label={__('Ámbito / Sucursal')}>
                        <Select value={selectedSucursal} onValueChange={handleSucursalChange}>
                            <SelectTrigger className="w-full">
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

                    {/* Filtro Sección */}
                    <FilterField label={__('Sección')}>
                        <Select value={sectionFilter} onValueChange={setSectionFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={__('Todas las secciones')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todas las secciones')}</SelectItem>
                                <SelectItem value="fisica">{__('1. Física & Estética')}</SelectItem>
                                <SelectItem value="funcional">{__('2. Estado & Funcional')}</SelectItem>
                                <SelectItem value="seguridad">{__('3. Seguridad & Bloqueo')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>

                    {/* Filtro Estado */}
                    <FilterField label={__('Estado')}>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={__('Todos')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos')}</SelectItem>
                                <SelectItem value="active">{__('Solo Activos')}</SelectItem>
                                <SelectItem value="inactive">{__('Solo Inactivos')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </FilterField>
                </FilterBar>

                {/* BANNER INFORMATIVO DE SUCURSAL */}
                {selectedSucursal !== 'general' && (
                    <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    {isCustomBranch
                                        ? __('Configuración personalizada para la sucursal: ') + selectedSucursalObj?.nombre
                                        : __('Usando plantilla general de la empresa para: ') + selectedSucursalObj?.nombre}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {isCustomBranch
                                        ? __('Esta sucursal posee una lista exclusiva de puntos de preservicio.')
                                        : __('Haga cambios o copie la plantilla para personalizar exclusivamente para esta sucursal.')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isCustomBranch && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setOpenCopyModal(true)}
                                    className="text-xs font-bold gap-1.5 border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {__('Crear copia editable')}
                                </Button>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setOpenResetModal(true)}
                                className="text-xs font-bold gap-1.5 text-slate-600 hover:text-slate-800 dark:text-slate-400"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {__('Restablecer')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* TABLA PRINCIPAL */}
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    emptyTitle={__('No hay puntos de preservicio configurados')}
                    emptyDescription={__('Comience agregando nuevos puntos de inspección o restablezca a los valores por defecto.')}
                    emptyIcon={<ShieldCheck className="h-10 w-10 text-muted-foreground" />}
                />
            </div>

            {/* MODAL CREAR NUEVO PUNTO */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Plus className="w-5 h-5 text-indigo-600" />
                            {__('Nuevo Punto de Preservicio')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            {__('Agregue un nuevo punto de inspección inicial para las órdenes de reparación.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">{__('Sección *')}</Label>
                            <Select
                                value={newItemSection}
                                onValueChange={(val: any) => {
                                    setNewItemSection(val);
                                    if (val === 'fisica') setNewItemTipoCampo('estado_obs');
                                    else setNewItemTipoCampo('boolean');
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fisica">📱 {__('1. Inspección Física & Estética')}</SelectItem>
                                    <SelectItem value="funcional">⚡ {__('2. Estado & Funcionamiento Inicial')}</SelectItem>
                                    <SelectItem value="seguridad">🔒 {__('3. Seguridad, Bloqueo & Recepción')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">{__('Tipo de Entrada *')}</Label>
                            <Select
                                value={newItemTipoCampo}
                                onValueChange={(val: any) => setNewItemTipoCampo(val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="estado_obs">🔍 {__('Inspección (Bueno / Malo / NA + Observaciones)')}</SelectItem>
                                    <SelectItem value="boolean">🔘 {__('Interruptor Sí / No')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">{__('Nombre del Punto *')}</Label>
                            <Input
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Ej: Cámara Gran Angular / Face ID"
                                className="text-xs"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">{__('Ícono / Emoji')}</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newItemIcon}
                                    onChange={(e) => setNewItemIcon(e.target.value)}
                                    className="text-center text-base w-14 font-bold"
                                    maxLength={4}
                                />
                                <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto max-h-20">
                                    {EMOJI_CATEGORIES.flatMap((c) => c.emojis).map((em, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setNewItemIcon(em)}
                                            className="w-7 h-7 text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold">{__('Descripción (Opcional)')}</Label>
                            <Textarea
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                placeholder="Detalles o guía para el técnico..."
                                className="text-xs resize-none"
                                rows={2}
                            />
                        </div>

                        <DialogFooter className="pt-2">
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
                                disabled={isSavingNew}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
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
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Pencil className="w-5 h-5 text-indigo-600" />
                            {__('Editar Punto de Preservicio')}
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

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Tipo de Entrada *')}</Label>
                                <Select
                                    value={editTipoCampo}
                                    onValueChange={(val: any) => setEditTipoCampo(val)}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="estado_obs">🔍 {__('Inspección (Bueno / Malo / NA + Observaciones)')}</SelectItem>
                                        <SelectItem value="boolean">🔘 {__('Interruptor Sí / No')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Ícono / Emoji')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editIcon}
                                        onChange={(e) => setEditIcon(e.target.value)}
                                        className="text-center text-base w-14 font-bold"
                                        maxLength={4}
                                    />
                                    <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto max-h-20">
                                        {EMOJI_CATEGORIES.flatMap((c) => c.emojis).map((em, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setEditIcon(em)}
                                                className="w-7 h-7 text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Descripción (Opcional)')}</Label>
                                <Textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="text-xs resize-none"
                                    rows={2}
                                />
                            </div>

                            <DialogFooter className="pt-2">
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
                                    disabled={isSavingEdit}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                                >
                                    {isSavingEdit ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    {__('Guardar Cambios')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL ELIMINAR PUNTO */}
            <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
                            <Trash2 className="w-5 h-5" />
                            {__('¿Eliminar Punto de Preservicio?')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-2">
                            {__('¿Está seguro de que desea eliminar el punto')}{' '}
                            <strong className="text-slate-900 dark:text-slate-100">"{itemToDelete?.nombre}"</strong>?{' '}
                            {__('Esta acción no se puede deshacer.')}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
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
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleDeleteConfirm}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {__('Eliminar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL RESTABLECER A VALORES POR DEFECTO */}
            <Dialog open={openResetModal} onOpenChange={setOpenResetModal}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-amber-600">
                            <RotateCcw className="w-5 h-5" />
                            {__('Restablecer Plantilla de Preservicio')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-2">
                            {__(
                                'Se eliminarán las personalizaciones y se volverán a cargar los puntos oficiales predeterminados del sistema.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
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
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
                        >
                            {isResetting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            {__('Restablecer')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL COPIAR PLANTILLA GENERAL A SUCURSAL */}
            <Dialog open={openCopyModal} onOpenChange={setOpenCopyModal}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-black flex items-center gap-2 text-indigo-600">
                            <Copy className="w-5 h-5" />
                            {__('Copiar Plantilla General')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-2">
                            {__(
                                'Se copiará la plantilla general de la empresa a esta sucursal para que pueda editarla independientemente.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                        >
                            {isCopying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                            {__('Copiar y Personalizar')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL SIMULADOR / FICHA TÉCNICA EN VIVO */}
            <Dialog open={openPreviewModal} onOpenChange={setOpenPreviewModal}>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl rounded-3xl">
                    <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="space-y-1">
                                <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    {__('Simulador Interactivo de Preservicio')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    {__(
                                        'Pruebe exactamente cómo visualizarán los técnicos la ficha de preservicio en el taller con la configuración activa.'
                                    )}
                                </DialogDescription>
                            </div>
                            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 font-bold px-3 py-1">
                                {items.filter((i) => i.activo).length} {__('Puntos Activos')}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                        {/* 1. SECCIÓN FÍSICA */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <Smartphone className="w-4 h-4 text-indigo-600" />
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                    {__('1. Inspección Física & Estética')}
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {items
                                    .filter((i) => i.seccion === 'fisica' && i.activo)
                                    .map((item) => {
                                        const current = previewFisica[item.id] || { estado: 'bueno', obs: '' };
                                        return (
                                            <div
                                                key={item.id}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{item.icono || '📱'}</span>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex-1">
                                                        {item.nombre}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewFisica((p) => ({
                                                                ...p,
                                                                [item.id]: { ...current, estado: 'bueno' },
                                                            }))
                                                        }
                                                        className={cn(
                                                            'py-1 text-[10px] font-bold rounded transition-all cursor-pointer',
                                                            current.estado === 'bueno'
                                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                                                        )}
                                                    >
                                                        {__('Bueno')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewFisica((p) => ({
                                                                ...p,
                                                                [item.id]: { ...current, estado: 'malo' },
                                                            }))
                                                        }
                                                        className={cn(
                                                            'py-1 text-[10px] font-bold rounded transition-all cursor-pointer',
                                                            current.estado === 'malo'
                                                                ? 'bg-rose-600 text-white shadow-xs'
                                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                                                        )}
                                                    >
                                                        {__('Dañado')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPreviewFisica((p) => ({
                                                                ...p,
                                                                [item.id]: { ...current, estado: 'na' },
                                                            }))
                                                        }
                                                        className={cn(
                                                            'py-1 text-[10px] font-bold rounded transition-all cursor-pointer',
                                                            current.estado === 'na'
                                                                ? 'bg-slate-600 text-white shadow-xs'
                                                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                                                        )}
                                                    >
                                                        {__('N/A')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* 2. SECCIÓN FUNCIONAL & 3. SEGURIDAD */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                        {__('2. Estado & Funcionamiento')}
                                    </h4>
                                </div>

                                <div className="space-y-2">
                                    {items
                                        .filter((i) => i.seccion === 'funcional' && i.activo)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{item.icono || '⚡'}</span>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {item.nombre}
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={previewBooleans[item.id] ?? true}
                                                    onCheckedChange={(val) =>
                                                        setPreviewBooleans((p) => ({ ...p, [item.id]: val }))
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <Lock className="w-4 h-4 text-emerald-500" />
                                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                        {__('3. Seguridad & Bloqueo')}
                                    </h4>
                                </div>

                                <div className="space-y-2">
                                    {items
                                        .filter((i) => i.seccion === 'seguridad' && i.activo)
                                        .map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{item.icono || '🔒'}</span>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {item.nombre}
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={previewBooleans[item.id] ?? true}
                                                    onCheckedChange={(val) =>
                                                        setPreviewBooleans((p) => ({ ...p, [item.id]: val }))
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setOpenPreviewModal(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5"
                        >
                            {__('Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
