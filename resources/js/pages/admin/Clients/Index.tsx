import React, { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
    Users, Plus, Pencil, Trash, Search, MoreVertical, Upload, X, Link as LinkIcon 
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { Client } from '@/types';
import { store as storeClient, update as updateClient, destroy as destroyClient } from '@/routes/admin/clients';

const DragDropLogoUpload = ({
    value,
    onChange,
    currentLogoUrl
}: {
    value: File | null;
    onChange: (file: File | null) => void;
    currentLogoUrl?: string | null;
}) => {
    const { __ } = useTranslate();
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const processFile = (file: File) => {
        if (file.type.startsWith("image/")) {
            onChange(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            Swal.fire({
                title: "Error",
                text: "Por favor, sube solo archivos de imagen (JPEG, PNG, JPG, WEBP).",
                icon: "error"
            });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setPreviewUrl(currentLogoUrl || null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-355">{__('Logotipo de la Marca')}</Label>
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                    dragActive
                        ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10"
                        : "border-slate-200 hover:border-indigo-500/50 dark:border-slate-800 dark:hover:border-indigo-400/30 bg-slate-50/30 dark:bg-slate-900/10"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                />

                {previewUrl ? (
                    <div className="relative group w-32 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 p-2 flex items-center justify-center">
                        <img src={previewUrl} alt="Vista previa del logo" className="max-w-full max-h-full object-contain" />
                        {value && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white shadow-md hover:bg-red-650 transition cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                        <Upload className="h-6 w-6 text-slate-400 mb-1" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {__('Arrastra y suelta tu imagen aquí, o haz clic para explorar.')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            {__('Archivos permitidos: JPEG, PNG, JPG, WEBP (Máx 2MB)')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ClientsIndexPage({ clients = [] }: { clients: Client[] }) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Clients'), href: '/admin/clients' },
    ];

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats calculations
    const totalClients = clients.length;
    const clientsWithWeb = clients.filter(c => c.website_url).length;

    // Local filtering
    const filteredClients = clients.filter((client) => {
        return client.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Form definition
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        logo: null as File | null,
        website_url: '',
        order: 0,
        _method: 'POST'
    });

    // Action Handlers
    const handleCreateClick = () => {
        setEditingClient(null);
        clearErrors();
        reset();
        setData((prev) => ({
            ...prev,
            _method: 'POST',
        }));
        setIsModalOpen(true);
    };

    const handleEditClick = (client: Client) => {
        setEditingClient(client);
        clearErrors();
        setData({
            name: client.name || '',
            logo: null as File | null,
            website_url: client.website_url || '',
            order: client.order || 0,
            _method: 'PUT'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClient) {
            post(updateClient.url(editingClient.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Cliente actualizado con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        } else {
            post(storeClient.url(), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Cliente creado con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de que deseas eliminar este cliente?'))) {
            router.delete(destroyClient.url(id), {
                onSuccess: () => {
                    notifySuccess(__('Cliente eliminado con éxito.'));
                }
            });
        }
    };

    return (
        <>
            <Head title={__('Manage Clients')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<Users className="h-8 w-8" />}
                    title={__('Clientes y Marcas')}
                    description={__('Administra los logotipos, nombres y sitios web de las marcas y empresas que confían en tu trabajo.')}
                    colorClassName="bg-[#4f46e5]"
                >
                    <Button onClick={handleCreateClick} className="gap-2 bg-white text-[#4f46e5] hover:bg-slate-100 dark:bg-slate-900 dark:text-indigo-400 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        {__('Nuevo Cliente')}
                    </Button>
                </ModuleHeader>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <StatCard
                        icon={<Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                        title={__('Total Clientes')}
                        value={totalClients}
                        colorClassName="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                    />
                    <StatCard
                        icon={<LinkIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        title={__('Clientes con Web Oficial')}
                        value={clientsWithWeb}
                        colorClassName="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                    />
                </div>

                {/* Filters */}
                <FilterBar>
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Cliente')} className="w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Escribe el nombre de la empresa...')}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* Table */}
                <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">{__('Logotipo')}</TableHead>
                                <TableHead>{__('Nombre / Empresa')}</TableHead>
                                <TableHead>{__('Sitio Web')}</TableHead>
                                <TableHead className="w-[100px]">{__('Orden')}</TableHead>
                                <TableHead className="text-right w-[100px]">{__('Acciones')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        {__('No hay clientes que coincidan con la búsqueda.')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-150">
                                        <TableCell>
                                            {client.logo_path ? (
                                                <div className="w-12 h-12 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={client.logo_path}
                                                        alt={client.name}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-dashed">
                                                    No Logo
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                            {client.name}
                                        </TableCell>
                                        <TableCell>
                                            {client.website_url ? (
                                                <a
                                                    href={client.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 underline text-xs font-medium"
                                                >
                                                    {client.website_url}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            #{client.order}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleEditClick(client)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                                        {__('Editar')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(client.id)} 
                                                        className="text-red-600 dark:text-red-400 cursor-pointer"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        {__('Eliminar')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog Form Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingClient ? __('Editar Cliente') : __('Crear Cliente')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Carga el logo, nombre y sitio web oficial del cliente para mostrar en la marquesina de tu portafolio.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">{__('Nombre / Empresa')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    placeholder="Ej: Google, Acme Corp"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="order">{__('Orden de Visualización')}</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={data.order}
                                    onChange={(e) => setData('order', parseInt(e.target.value) || 0)}
                                />
                                {errors.order && <div className="text-xs text-red-500 mt-1">{errors.order}</div>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="website_url">{__('Sitio Web (URL)')}</Label>
                            <Input
                                id="website_url"
                                type="url"
                                placeholder="https://..."
                                value={data.website_url}
                                onChange={(e) => setData('website_url', e.target.value)}
                            />
                            {errors.website_url && <div className="text-xs text-red-500 mt-1">{errors.website_url}</div>}
                        </div>

                        <DragDropLogoUpload
                            value={data.logo}
                            onChange={(file) => setData('logo', file)}
                            currentLogoUrl={editingClient?.logo_path}
                        />
                        {errors.logo && <div className="text-xs text-red-500 mt-1">{errors.logo}</div>}

                        <DialogFooter className="pt-4 border-t mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {__('Cancelar')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white cursor-pointer">
                                {processing ? __('Guardando...') : __('Guardar Cambios')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
