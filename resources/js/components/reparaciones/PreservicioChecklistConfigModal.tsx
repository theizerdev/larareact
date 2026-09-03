import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Trash2,
    Pencil,
    RotateCcw,
    Copy,
    Save,
    Check,
    X,
    Sparkles,
    ShieldCheck,
    Smartphone,
    Zap,
    Lock,
    Building2,
    Loader2,
    Layers,
    ArrowUp,
    ArrowDown,
    Search,
} from 'lucide-react';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { cn } from '@/lib/utils';

export interface PreservicioItem {
    id: number;
    empresa_id: number;
    sucursal_id: number | null;
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
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sucursales?: SucursalOption[];
    initialSucursalId?: number | null;
    onItemsUpdated?: (grouped: Record<string, PreservicioItem[]>) => void;
}

const EMOJI_PRESETS = [
    '📱', '🖥️', '👆', '📲', '⏏️', '🔌', '📏', '☀️', '🖲️', '🪟', '📐', '💧',
    '🔋', '⚡', '🪫', '💡', '⚙️', '📷', '🤳', '📸', '🔦', '😊', '🗺️', '🔍', '👁️',
    '🔊', '🔈', '🎙️', '🔉', '🎧', '📳', '🔇', '📶', '🔵', '📡', '🔒', '🔑', '🔢', '🛡️', '✍️',
];

export default function PreservicioChecklistConfigModal({
    open,
    onOpenChange,
    sucursales = [],
    initialSucursalId = null,
    onItemsUpdated,
}: Props) {
    const { __ } = useTranslate();
    const [selectedSucursal, setSelectedSucursal] = useState<string>(
        initialSucursalId ? String(initialSucursalId) : 'general'
    );
    const [activeSection, setActiveSection] = useState<'fisica' | 'funcional' | 'seguridad'>('fisica');
    const [items, setItems] = useState<PreservicioItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal para agregar nuevo punto
    const [openAddModal, setOpenAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('📱');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemTipoCampo, setNewItemTipoCampo] = useState<'estado_obs' | 'boolean'>('estado_obs');
    const [isSavingNew, setIsSavingNew] = useState(false);

    // Modal para editar punto
    const [editingItem, setEditingItem] = useState<PreservicioItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTipoCampo, setEditTipoCampo] = useState<'estado_obs' | 'boolean'>('estado_obs');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Confirmaciones
    const [itemToDelete, setItemToDelete] = useState<PreservicioItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openResetModal, setOpenResetModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const onItemsUpdatedRef = useRef(onItemsUpdated);
    useEffect(() => {
        onItemsUpdatedRef.current = onItemsUpdated;
    }, [onItemsUpdated]);

    const getCsrfToken = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const isFetchingRef = useRef(false);

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
            }
            if (data && data.grouped && onItemsUpdatedRef.current) {
                onItemsUpdatedRef.current(data.grouped);
            }
        } catch (err) {
            console.error('Error fetching preservicio items:', err);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, [selectedSucursal]);

    useEffect(() => {
        if (open) {
            fetchItems(selectedSucursal);
        }
    }, [open, selectedSucursal, fetchItems]);

    const sectionItems = useMemo(() => {
        return items
            .filter((it) => it.seccion === activeSection)
            .sort((a, b) => a.orden - b.orden);
    }, [items, activeSection]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return sectionItems;
        const q = searchQuery.toLowerCase();
        return sectionItems.filter(
            (it) =>
                it.nombre.toLowerCase().includes(q) ||
                (it.descripcion && it.descripcion.toLowerCase().includes(q))
        );
    }, [sectionItems, searchQuery]);

    const handleToggleActive = async (item: PreservicioItem) => {
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
                setItems((prev) =>
                    prev.map((it) => (it.id === item.id ? { ...it, activo: !newActivo } : it))
                );
                notifyError(__('Error al cambiar el estado.'));
            } else {
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al conectar con el servidor.'));
            fetchItems();
        }
    };

    const handleMoveItem = async (item: PreservicioItem, direction: 'up' | 'down') => {
        const currentList = [...sectionItems];
        const currentIndex = currentList.findIndex((i) => i.id === item.id);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= currentList.length) return;

        const targetItem = currentList[targetIndex];
        currentList[currentIndex] = targetItem;
        currentList[targetIndex] = item;

        const updatedList = currentList.map((it, idx) => ({
            ...it,
            orden: idx + 1,
        }));

        setItems((prev) => {
            const otherItems = prev.filter((it) => it.seccion !== activeSection);
            return [...otherItems, ...updatedList];
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
                    items: updatedList.map((i) => ({ id: i.id, orden: i.orden })),
                }),
            });
            const data = await res.json();
            if (!data.success) {
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            fetchItems();
        }
    };

    const handleSaveNewItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newItemName.trim();
        if (!trimmed) {
            notifyError(__('Por favor ingrese el nombre del punto.'));
            return;
        }

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
                    seccion: activeSection,
                    nombre: trimmed,
                    icono: newItemIcon.trim() || '📱',
                    descripcion: newItemDesc.trim() || null,
                    tipo_campo: newItemTipoCampo,
                    sucursal_id: selectedSucursal === 'general' ? null : Number(selectedSucursal),
                }),
            });
            const data = await res.json();
            if (data.success) {
                notifySuccess(data.message || __('Punto agregado correctamente.'));
                setNewItemName('');
                setNewItemIcon('📱');
                setNewItemDesc('');
                setOpenAddModal(false);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al agregar el punto.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al guardar el nuevo punto.'));
        } finally {
            setIsSavingNew(false);
        }
    };

    const handleOpenEdit = (item: PreservicioItem) => {
        setEditingItem(item);
        setEditName(item.nombre);
        setEditIcon(item.icono || '📱');
        setEditDesc(item.descripcion || '');
        setEditTipoCampo(item.tipo_campo || (item.seccion === 'fisica' ? 'estado_obs' : 'boolean'));
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
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
                notifySuccess(data.message || __('Punto actualizado.'));
                setEditingItem(null);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al actualizar.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al actualizar el punto.'));
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleConfirmDelete = async () => {
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

    const handleConfirmReset = async () => {
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
                notifySuccess(data.message || __('Valores por defecto restaurados.'));
                setOpenResetModal(false);
                fetchItems();
            } else {
                notifyError(data.message || __('Error al restaurar.'));
            }
        } catch (err) {
            console.error(err);
            notifyError(__('Error al procesar la solicitud.'));
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl rounded-3xl">
                    <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="space-y-1">
                                <DialogTitle className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                    <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    {__('Configuración de Ficha de Preservicio & Inspección')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    {__(
                                        'Personalice los puntos de inspección física, funcionalidad y seguridad en la recepción del equipo.'
                                    )}
                                </DialogDescription>
                            </div>

                            {/* Selector de Sucursal */}
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <Select
                                    value={selectedSucursal}
                                    onValueChange={(val) => setSelectedSucursal(val)}
                                >
                                    <SelectTrigger className="h-8 text-xs font-bold w-[220px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                        {/* Selector de Secciones */}
                        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto h-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveSection('fisica');
                                        setNewItemTipoCampo('estado_obs');
                                    }}
                                    className={cn(
                                        'flex-1 sm:flex-none flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                        activeSection === 'fisica'
                                            ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>{__('1. Física & Estética')}</span>
                                    <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                                        {items.filter((i) => i.seccion === 'fisica' && i.activo).length}/
                                        {items.filter((i) => i.seccion === 'fisica').length}
                                    </Badge>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveSection('funcional');
                                        setNewItemTipoCampo('boolean');
                                    }}
                                    className={cn(
                                        'flex-1 sm:flex-none flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                        activeSection === 'funcional'
                                            ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>{__('2. Estado & Funcional')}</span>
                                    <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                        {items.filter((i) => i.seccion === 'funcional' && i.activo).length}/
                                        {items.filter((i) => i.seccion === 'funcional').length}
                                    </Badge>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveSection('seguridad');
                                        setNewItemTipoCampo('boolean');
                                    }}
                                    className={cn(
                                        'flex-1 sm:flex-none flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                        activeSection === 'seguridad'
                                            ? 'bg-white dark:bg-slate-900 shadow-xs text-slate-900 dark:text-slate-100'
                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    )}
                                >
                                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>{__('3. Seguridad & Bloqueo')}</span>
                                    <Badge className="ml-1 text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                        {items.filter((i) => i.seccion === 'seguridad' && i.activo).length}/
                                        {items.filter((i) => i.seccion === 'seguridad').length}
                                    </Badge>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-48">
                                    <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={__('Buscar...')}
                                        className="h-8 text-xs pl-7"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setOpenAddModal(true)}
                                    className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 rounded-lg shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {__('Agregar Punto')}
                                </Button>
                            </div>
                        </div>

                        {/* Lista de Puntos */}
                        <div className="pt-2">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                    <span className="text-xs">{__('Cargando puntos de preservicio...')}</span>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 font-medium">
                                        {__('No hay puntos registrados en esta sección.')}
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setOpenAddModal(true)}
                                        className="mt-3 text-xs font-bold gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        {__('Crear primer punto')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {filteredItems.map((item, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === filteredItems.length - 1;

                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    'p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all',
                                                    item.activo
                                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                                                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                                                )}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={isFirst}
                                                            onClick={() => handleMoveItem(item, 'up')}
                                                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                                        >
                                                            <ArrowUp className="w-2.5 h-2.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={isLast}
                                                            onClick={() => handleMoveItem(item, 'down')}
                                                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                                                        >
                                                            <ArrowDown className="w-2.5 h-2.5" />
                                                        </Button>
                                                    </div>

                                                    <span className="text-base select-none p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        {item.icono || '📱'}
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className={cn(
                                                                    'font-bold truncate text-slate-800 dark:text-slate-200',
                                                                    !item.activo && 'line-through text-slate-400'
                                                                )}
                                                            >
                                                                {item.nombre}
                                                            </span>
                                                            {item.is_default && (
                                                                <Badge className="text-[8.5px] px-1 py-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-normal">
                                                                    {__('Defecto')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {item.descripcion && (
                                                            <p className="text-[10px] text-slate-400 truncate">
                                                                {item.descripcion}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Switch
                                                        checked={item.activo}
                                                        onCheckedChange={() => handleToggleActive(item)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                        title={__('Editar')}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setItemToDelete(item)}
                                                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                        title={__('Eliminar')}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer con Acciones Globales */}
                    <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenResetModal(true)}
                            disabled={isLoading}
                            className="text-xs font-bold text-slate-600 dark:text-slate-300 gap-1.5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {__('Restablecer a Valores del Sistema')}
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4"
                        >
                            {__('Cerrar')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal para Agregar Nuevo Punto */}
            <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            {__('Agregar Punto de Preservicio')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveNewItem} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {__('Nombre del Punto *')}
                            </Label>
                            <Input
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                className="text-xs"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {__('Tipo de Entrada *')}
                            </Label>
                            <Select
                                value={newItemTipoCampo}
                                onValueChange={(val: any) => setNewItemTipoCampo(val)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="estado_obs">🔍 {__('Inspección (Bueno / Malo / NA + Obs)')}</SelectItem>
                                    <SelectItem value="boolean">🔘 {__('Interruptor (Sí / No)')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {__('Ícono')}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={newItemIcon}
                                    onChange={(e) => setNewItemIcon(e.target.value)}
                                    className="text-center text-sm w-14 font-bold"
                                    maxLength={4}
                                />
                                <div className="flex items-center gap-1 flex-wrap p-1 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto">
                                    {EMOJI_PRESETS.slice(0, 10).map((em) => (
                                        <button
                                            key={em}
                                            type="button"
                                            onClick={() => setNewItemIcon(em)}
                                            className="w-6 h-6 text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                        >
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {__('Descripción (Opcional)')}
                            </Label>
                            <Input
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2 flex justify-end gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setOpenAddModal(false)}
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

            {/* Modal para Editar Punto */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                            <Pencil className="w-4 h-4 text-slate-600" />
                            {__('Editar Punto de Preservicio')}
                        </DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
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
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="estado_obs">🔍 {__('Inspección (Bueno / Malo / NA + Obs)')}</SelectItem>
                                        <SelectItem value="boolean">🔘 {__('Interruptor (Sí / No)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Ícono')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editIcon}
                                        onChange={(e) => setEditIcon(e.target.value)}
                                        className="text-center text-sm w-14 font-bold"
                                        maxLength={4}
                                    />
                                    <div className="flex items-center gap-1 flex-wrap p-1 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto">
                                        {EMOJI_PRESETS.slice(0, 10).map((em) => (
                                            <button
                                                key={em}
                                                type="button"
                                                onClick={() => setEditIcon(em)}
                                                className="w-6 h-6 text-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                            >
                                                {em}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">{__('Descripción (Opcional)')}</Label>
                                <Input
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
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

            {/* Modal para Eliminar Punto */}
            <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black flex items-center gap-2 text-rose-600">
                            <Trash2 className="w-4 h-4" />
                            {__('¿Eliminar Punto de Preservicio?')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 pt-2">
                            {__('¿Está seguro de eliminar el punto')} <strong className="text-slate-800 dark:text-slate-200">"{itemToDelete?.nombre}"</strong>?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setItemToDelete(null)}
                            className="text-xs font-bold"
                        >
                            {__('Cancelar')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
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

            {/* Modal para Restablecer a Valores por Defecto */}
            <Dialog open={openResetModal} onOpenChange={setOpenResetModal}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black flex items-center gap-2 text-amber-600">
                            <RotateCcw className="w-4 h-4" />
                            {__('Restablecer a Valores por Defecto')}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 pt-2">
                            {__(
                                'Se eliminarán todas las personalizaciones y se volverán a cargar los puntos oficiales del sistema.'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenResetModal(false)}
                            className="text-xs font-bold"
                        >
                            {__('Cancelar')}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isResetting}
                            onClick={handleConfirmReset}
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
        </>
    );
}
