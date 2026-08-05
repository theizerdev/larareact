import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import {
    Star,
    Plus,
    Pencil,
    Trash2,
    TrendingUp,
    MapPin,
    MoreVertical,
    MessageSquare,
    CheckCircle2,
    Search,
    RefreshCw,
    SlidersHorizontal,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { useTranslate } from '@/hooks/use-translate';

// Componentes del Sistema
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Testimonio {
    id: number;
    nombre_cliente: string;
    empresa_cargo?: string;
    ubicacion?: string;
    avatar?: string;
    comentario: string;
    calificacion: number;
    metrica_destacada?: string;
    destacado: boolean;
    activo: boolean;
    orden: number;
    created_at?: string;
}

interface Props {
    testimonios: Testimonio[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel de control', href: '/admin/dashboard' },
    { title: 'Testimonios', href: '/admin/testimonios' },
];

export default function TestimoniosIndex({ testimonios = [] }: Props) {
    const { __ } = useTranslate();
    const { auth } = usePage().props as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Testimonio | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const getCompanyLogo = () => {
        const empresa = auth?.user?.empresa;
        if (empresa?.logo_mini) {
            return empresa.logo_mini;
        }
        if (empresa?.logo) {
            return empresa.logo;
        }
        return '/5.png';
    };

    const { data, setData, post, patch, put, delete: destroy, processing, reset } = useForm({
        nombre_cliente: auth?.user?.name || '',
        empresa_cargo: auth?.user?.empresa?.nombre_comercial || auth?.user?.empresa?.nombre ? `Propietario - ${auth?.user?.empresa?.nombre_comercial || auth?.user?.empresa?.nombre}` : '',
        ubicacion: auth?.user?.empresa?.direccion || '',
        avatar: getCompanyLogo(),
        comentario: '',
        calificacion: 5,
        metrica_destacada: '',
        destacado: true,
        activo: true,
        orden: 0,
    });

    // Filtrado local
    const filteredTestimonios = testimonios.filter((item) => {
        const matchesSearch =
            item.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
            (item.empresa_cargo && item.empresa_cargo.toLowerCase().includes(search.toLowerCase())) ||
            item.comentario.toLowerCase().includes(search.toLowerCase());

        if (statusFilter === 'active') return matchesSearch && item.activo;
        if (statusFilter === 'featured') return matchesSearch && item.destacado;
        if (statusFilter === 'inactive') return matchesSearch && !item.activo;
        return matchesSearch;
    });

    const openCreateModal = () => {
        setEditingItem(null);
        setData({
            nombre_cliente: auth?.user?.name || '',
            empresa_cargo: auth?.user?.empresa?.nombre_comercial || auth?.user?.empresa?.nombre ? `Propietario - ${auth?.user?.empresa?.nombre_comercial || auth?.user?.empresa?.nombre}` : '',
            ubicacion: auth?.user?.empresa?.direccion || '',
            avatar: getCompanyLogo(),
            comentario: '',
            calificacion: 5,
            metrica_destacada: '',
            destacado: true,
            activo: true,
            orden: 0,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: Testimonio) => {
        setEditingItem(item);
        setData({
            nombre_cliente: item.nombre_cliente || '',
            empresa_cargo: item.empresa_cargo || '',
            ubicacion: item.ubicacion || '',
            avatar: item.avatar || '',
            comentario: item.comentario || '',
            calificacion: item.calificacion || 5,
            metrica_destacada: item.metrica_destacada || '',
            destacado: item.destacado ?? true,
            activo: item.activo ?? true,
            orden: item.orden ?? 0,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            put(`/admin/testimonios/${editingItem.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/testimonios', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            destroy(`/admin/testimonios/${deleteId}`, {
                onSuccess: () => setDeleteId(null),
            });
        }
    };

    const toggleStatus = (id: number) => {
        patch(`/admin/testimonios/${id}/toggle-status`, {}, { preserveScroll: true });
    };

    const toggleFeatured = (id: number) => {
        patch(`/admin/testimonios/${id}/toggle-featured`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={__('Gestión de Testimonios')} />

            <div className="space-y-6">
                {/* 1. Header Banner idéntico al sistema */}
                <ModuleHeader
                    icon={<Star className="h-6 w-6 text-white" />}
                    title={__('Gestión de Testimonios & Reseñas')}
                    description={__('Administre las opiniones de clientes que se muestran dinámicamente en la Landing Page.')}
                    colorClassName="bg-[#4F46E5]"
                >
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 text-slate-900 bg-white hover:bg-slate-100 font-bold shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{__('Nuevo Testimonio')}</span>
                    </Button>
                </ModuleHeader>

                {/* 2. Tarjetas de Estadísticas (StatCard) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        icon={<Star className="w-6 h-6" />}
                        title={__('TOTAL TESTIMONIOS')}
                        value={testimonios.length.toString()}
                        colorClassName="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<CheckCircle2 className="w-6 h-6" />}
                        title={__('PUBLICADOS')}
                        value={testimonios.filter((t) => t.activo).length.toString()}
                        colorClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-6 h-6" />}
                        title={__('DESTACADOS LANDING')}
                        value={testimonios.filter((t) => t.destacado).length.toString()}
                        colorClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    />
                </div>

                {/* 3. Barra de Búsqueda y Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder={__('Buscar testimonio o cliente...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="w-56">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder={__('Filtrar Estado')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{__('Todos los Testimonios')}</SelectItem>
                                <SelectItem value="active">{__('Solo Publicados')}</SelectItem>
                                <SelectItem value="featured">{__('Solo Destacados')}</SelectItem>
                                <SelectItem value="inactive">{__('Solo Ocultos')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                        }}
                        title={__('Restablecer Filtros')}
                    >
                        <RefreshCw className="w-4 h-4 text-slate-600" />
                    </Button>
                </div>

                {/* 4. Tabla de Registros */}
                <Card className="rounded-xl border border-slate-200 shadow-sm">
                    <CardContent className="p-0 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700">{__('Cliente / Negocio')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700">{__('Comentario')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-center">{__('Calificación')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-center">{__('Métrica')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-center">{__('Destacado (Landing)')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-center">{__('Estado')}</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-right">{__('Acción')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTestimonios.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-xs font-medium">
                                            {__('No hay testimonios registrados actualmente.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTestimonios.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Cliente & Avatar */}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                                                        {item.avatar ? (
                                                            <AvatarImage src={item.avatar} alt={item.nombre_cliente} />
                                                        ) : null}
                                                        <AvatarFallback className="bg-[#08264e] text-white font-bold text-xs">
                                                            {item.nombre_cliente?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-bold text-slate-800 text-xs">{item.nombre_cliente}</div>
                                                        <div className="text-[11px] text-slate-500">{item.empresa_cargo || __('Sin cargo')}</div>
                                                        {item.ubicacion && (
                                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                                                                <MapPin className="w-3 h-3" />
                                                                <span>{item.ubicacion}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Comentario */}
                                            <TableCell className="max-w-xs">
                                                <p className="line-clamp-2 text-slate-700 text-xs italic">"{item.comentario}"</p>
                                            </TableCell>

                                            {/* Calificación */}
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3.5 h-3.5 ${
                                                                i < item.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </TableCell>

                                            {/* Métrica Pill */}
                                            <TableCell className="text-center">
                                                {item.metrica_destacada ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold gap-1">
                                                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                                                        <span>{item.metrica_destacada}</span>
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </TableCell>

                                            {/* Switch Destacado */}
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                        checked={item.destacado}
                                                        onCheckedChange={() => toggleFeatured(item.id)}
                                                    />
                                                    <span className={`text-[11px] font-bold ${item.destacado ? 'text-orange-600' : 'text-slate-400'}`}>
                                                        {item.destacado ? __('Destacado') : __('Normal')}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Switch Estado */}
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Switch
                                                        checked={item.activo}
                                                        onCheckedChange={() => toggleStatus(item.id)}
                                                    />
                                                    <span className={`text-[11px] font-bold ${item.activo ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {item.activo ? __('Publicado') : __('Oculto')}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Dropdown Acciones */}
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditModal(item)} className="cursor-pointer gap-2">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            <span>{__('Editar')}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteId(item.id)}
                                                            className="cursor-pointer text-rose-600 focus:text-rose-600 gap-2"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>{__('Eliminar')}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Formulario Radix UI Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#08264e]">
                            {editingItem ? __('Editar Testimonio') : __('Nuevo Testimonio')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Ingresa la información del cliente y la opinión para mostrar en la landing page.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        {/* Nombre del Cliente */}
                        <div className="space-y-1.5">
                            <Label htmlFor="nombre_cliente" className="font-bold text-xs">{__('Nombre del Cliente *')}</Label>
                            <Input
                                id="nombre_cliente"
                                required
                                placeholder={__('Ej. Carlos Eduardo Mendoza')}
                                value={data.nombre_cliente}
                                onChange={(e) => setData('nombre_cliente', e.target.value)}
                            />
                        </div>

                        {/* Empresa / Cargo */}
                        <div className="space-y-1.5">
                            <Label htmlFor="empresa_cargo" className="font-bold text-xs">{__('Empresa o Cargo')}</Label>
                            <Input
                                id="empresa_cargo"
                                placeholder={__('Ej. Gerente General - Mendoza Tech S.A.')}
                                value={data.empresa_cargo}
                                onChange={(e) => setData('empresa_cargo', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Ubicación */}
                            <div className="space-y-1.5">
                                <Label htmlFor="ubicacion" className="font-bold text-xs">{__('Ubicación')}</Label>
                                <Input
                                    id="ubicacion"
                                    placeholder={__('Ej. Caracas, Venezuela')}
                                    value={data.ubicacion}
                                    onChange={(e) => setData('ubicacion', e.target.value)}
                                />
                            </div>

                            {/* Radix Select Estrellas */}
                            <div className="space-y-1.5">
                                <Label className="font-bold text-xs">{__('Estrellas')}</Label>
                                <Select
                                    value={String(data.calificacion)}
                                    onValueChange={(val) => setData('calificacion', Number(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={__('Selecciona estrellas')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">⭐⭐⭐⭐⭐ (5 Estrellas)</SelectItem>
                                        <SelectItem value="4">⭐⭐⭐⭐ (4 Estrellas)</SelectItem>
                                        <SelectItem value="3">⭐⭐⭐ (3 Estrellas)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* URL Avatar / Logo Preview */}
                        <div className="space-y-1.5">
                            <Label htmlFor="avatar" className="font-bold text-xs">{__('Avatar / Logo de Empresa')}</Label>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                                    {data.avatar ? (
                                        <AvatarImage src={data.avatar} alt="Logo Preview" />
                                    ) : null}
                                    <AvatarFallback className="bg-[#08264e] text-white font-bold text-xs">
                                        {data.nombre_cliente?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <Input
                                    id="avatar"
                                    type="text"
                                    placeholder={__('Ej. /5.png o /storage/empresas/...')}
                                    value={data.avatar}
                                    onChange={(e) => setData('avatar', e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Métrica Destacada */}
                        <div className="space-y-1.5">
                            <Label htmlFor="metrica_destacada" className="font-bold text-xs">{__('Métrica Destacada (Pill)')}</Label>
                            <Input
                                id="metrica_destacada"
                                placeholder={__('Ej. +35% velocidad en atención')}
                                value={data.metrica_destacada}
                                onChange={(e) => setData('metrica_destacada', e.target.value)}
                            />
                        </div>

                        {/* Comentario Textarea */}
                        <div className="space-y-1.5">
                            <Label htmlFor="comentario" className="font-bold text-xs">{__('Comentario / Opinión *')}</Label>
                            <Textarea
                                id="comentario"
                                rows={3}
                                required
                                placeholder={__('Escribe la opinión del cliente...')}
                                value={data.comentario}
                                onChange={(e) => setData('comentario', e.target.value)}
                                className="resize-none"
                            />
                        </div>

                        {/* Radix Switches Adicionales */}
                        <div className="flex items-center gap-8 pt-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="destacado"
                                    checked={data.destacado}
                                    onCheckedChange={(val) => setData('destacado', val)}
                                />
                                <Label htmlFor="destacado" className="font-bold text-xs cursor-pointer">{__('Destacado en Landing')}</Label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    id="activo"
                                    checked={data.activo}
                                    onCheckedChange={(val) => setData('activo', val)}
                                />
                                <Label htmlFor="activo" className="font-bold text-xs cursor-pointer">{__('Publicado')}</Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-[#ff5a00] hover:bg-orange-600 font-bold">
                                {editingItem ? __('Guardar Cambios') : __('Crear Testimonio')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Confirmación de Eliminación Radix AlertDialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{__('¿Eliminar testimonio?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {__('Esta acción no se puede deshacer. El testimonio será removido permanentemente del sistema y de la landing page.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{__('Cancelar')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                            {__('Eliminar')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

TestimoniosIndex.layout = (page: React.ReactNode) => (
    <AdminLayout breadcrumbs={breadcrumbs}>{page}</AdminLayout>
);
