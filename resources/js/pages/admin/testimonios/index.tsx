import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
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
    XCircle,
} from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { useTranslate } from '@/hooks/use-translate';

// Importación de componentes de UI basados en Radix UI / Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Testimonios', href: '/admin/testimonios' },
];

export default function TestimoniosIndex({ testimonios = [] }: Props) {
    const { __ } = useTranslate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Testimonio | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, patch, put, delete: destroy, processing, reset } = useForm({
        nombre_cliente: '',
        empresa_cargo: '',
        ubicacion: '',
        avatar: '',
        comentario: '',
        calificacion: 5,
        metrica_destacada: '',
        destacado: true,
        activo: true,
        orden: 0,
    });

    const openCreateModal = () => {
        setEditingItem(null);
        reset();
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
                {/* Header Superior con Radix Card */}
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6">
                        <div>
                            <CardTitle className="text-2xl font-black text-[#08264e] flex items-center gap-2">
                                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                                <span>{__('Gestión de Testimonios & Reseñas')}</span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {__('Administra las opiniones de clientes que se muestran dinámicamente en la Landing Page.')}
                            </CardDescription>
                        </div>

                        <Button
                            onClick={openCreateModal}
                            className="bg-[#ff5a00] hover:bg-orange-600 text-white font-bold shrink-0 gap-2 shadow-md shadow-orange-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{__('Nuevo Testimonio')}</span>
                        </Button>
                    </CardHeader>
                </Card>

                {/* Tabla de Registros Radix UI Table */}
                <Card>
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
                                    <TableHead className="font-bold text-xs uppercase text-slate-700 text-right">{__('Acciones')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testimonios.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 text-xs">
                                            {__('No hay testimonios registrados actualmente.')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    testimonios.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Cliente & Avatar */}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10 border border-slate-200 shrink-0">
                                                        {item.avatar ? (
                                                            <AvatarImage src={item.avatar} alt={item.nombre_cliente} />
                                                        ) : null}
                                                        <AvatarFallback className="bg-[#08264e] text-white font-bold">
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

                        {/* URL Avatar */}
                        <div className="space-y-1.5">
                            <Label htmlFor="avatar" className="font-bold text-xs">{__('URL del Avatar / Foto')}</Label>
                            <Input
                                id="avatar"
                                type="url"
                                placeholder="https://images.unsplash.com/..."
                                value={data.avatar}
                                onChange={(e) => setData('avatar', e.target.value)}
                            />
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
