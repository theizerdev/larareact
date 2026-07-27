import { Head, router, useForm } from '@inertiajs/react';
import {
    Users, Plus, Search, Phone, Mail, MapPin, CreditCard, Edit2, Trash2, Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Cliente {
    id: number;
    nombre: string;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    limite_credito: number;
    saldo_pendiente: number;
    estado: boolean;
    created_at: string;
}

interface Props {
    clientes: { data: Cliente[]; links: any; meta: any; current_page: number; last_page: number; per_page: number; total: number };
    currencySymbol?: string;
    filters: { search?: string; perPage?: number };
}

export default function Index({ clientes, currencySymbol = '$', filters }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    const form = useForm({ nombre: '', telefono: '', email: '', direccion: '', limite_credito: '' });
    const editForm = useForm({ nombre: '', telefono: '', email: '', direccion: '', limite_credito: '', estado: true });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/clientes', {
            onSuccess: () => { setIsCreateOpen(false); form.reset(); notifySuccess(__('Cliente registrado.')); },
            onError: () => notifyError(__('Error al registrar el cliente.')),
        });
    };

    const openEdit = (c: Cliente) => {
        setEditingCliente(c);
        editForm.setData({
            nombre: c.nombre, telefono: c.telefono || '', email: c.email || '',
            direccion: c.direccion || '', limite_credito: String(c.limite_credito), estado: c.estado,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCliente) return;
        editForm.put(`/admin/clientes/${editingCliente.id}`, {
            onSuccess: () => { setIsEditOpen(false); notifySuccess(__('Cliente actualizado.')); },
            onError: () => notifyError(__('Error al actualizar.')),
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm(__('¿Está seguro de eliminar este cliente?'))) return;
        router.delete(`/admin/clientes/${id}`, {
            onSuccess: () => notifySuccess(__('Cliente eliminado.')),
        });
    };

    const columns: ColumnDef<Cliente>[] = [
        { key: 'nombre', label: __('Cliente'), sortable: true, render: (c) => (
            <div>
                <p className="font-semibold text-sm">{c.nombre}</p>
                {c.telefono && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefono}</p>}
            </div>
        )},
        { key: 'email', label: __('Email'), sortable: false, render: (c) => c.email ? (
            <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground" />{c.email}</span>
        ) : <span className="text-xs text-muted-foreground">—</span> },
        { key: 'limite_credito', label: __('Límite Crédito'), render: (c) => (
            <span className="font-mono text-sm">{currencySymbol}{c.limite_credito.toFixed(2)}</span>
        )},
        { key: 'saldo_pendiente', label: __('Saldo Pendiente'), render: (c) => (
            <span className={cn('font-mono text-sm font-bold', c.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                {currencySymbol}{c.saldo_pendiente.toFixed(2)}
            </span>
        )},
        { key: 'estado', label: __('Estado'), render: (c) => (
            <Badge variant={c.estado ? 'default' : 'secondary'} className={c.estado ? 'bg-emerald-100 text-emerald-700' : ''}>{c.estado ? __('Activo') : __('Inactivo')}</Badge>
        )},
        { key: 'actions', label: '', render: (c) => (
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.get(`/admin/clientes/${c.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
        )},
    ];

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Punto de Venta'), href: '#' },
        { title: __('Clientes'), href: '/admin/clientes' },
    ];

    return (
        <>
            <Head title={__('Clientes')} />
            <div className="space-y-4">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <ModuleHeader icon={<Users className="h-6 w-6 text-white" />} title={__('Gestión de Clientes')}
                    description={__('Administre clientes, límites de crédito y cuentas por cobrar.')} colorClassName="bg-indigo-600">
                    <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />{__('Nuevo Cliente')}</Button>
                </ModuleHeader>

                <DataTable
                    data={clientes.data}
                    columns={columns}
                    searchPlaceholder={__('Buscar clientes...')}
                    currentPage={clientes.current_page}
                    lastPage={clientes.last_page}
                    perPage={clientes.per_page}
                    total={clientes.total}
                    routePath="/admin/clientes"
                    filters={filters}
                />
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{__('Registrar Nuevo Cliente')}</DialogTitle>
                        <DialogDescription>{__('Complete los datos del cliente.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{__('Nombre')} *</Label>
                            <Input value={form.data.nombre} onChange={(e) => form.setData('nombre', e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>{__('Teléfono')}</Label>
                                <Input value={form.data.telefono} onChange={(e) => form.setData('telefono', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{__('Email')}</Label>
                                <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{__('Dirección')}</Label>
                            <Input value={form.data.direccion} onChange={(e) => form.setData('direccion', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>{__('Límite de Crédito')}</Label>
                            <Input type="number" step="0.01" min="0" value={form.data.limite_credito} onChange={(e) => form.setData('limite_credito', e.target.value)} placeholder="0.00" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{__('Cancelar')}</Button>
                            <Button type="submit" disabled={form.processing}>{__('Guardar')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{__('Editar Cliente')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{__('Nombre')} *</Label>
                            <Input value={editForm.data.nombre} onChange={(e) => editForm.setData('nombre', e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>{__('Teléfono')}</Label>
                                <Input value={editForm.data.telefono} onChange={(e) => editForm.setData('telefono', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>{__('Email')}</Label>
                                <Input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{__('Dirección')}</Label>
                            <Input value={editForm.data.direccion} onChange={(e) => editForm.setData('direccion', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>{__('Límite de Crédito')}</Label>
                            <Input type="number" step="0.01" min="0" value={editForm.data.limite_credito} onChange={(e) => editForm.setData('limite_credito', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>{__('Cancelar')}</Button>
                            <Button type="submit" disabled={editForm.processing}>{__('Actualizar')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
