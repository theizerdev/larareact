import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess } from '@/utils/notifications';
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
    Mail, MailOpen, Search, MoreVertical, Trash, Eye, Calendar, User, Phone, Tag 
} from 'lucide-react';
import type { Message } from '@/types';
import { update as updateMessage, destroy as destroyMessage } from '@/routes/admin/messages';

export default function MessagesIndexPage({ messages = [] }: { messages: Message[] }) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Messages'), href: '/admin/messages' },
    ];

    // States
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Stats calculations
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(m => !m.is_read).length;
    const readMessages = messages.filter(m => m.is_read).length;

    // Local filtering
    const filteredMessages = messages.filter((msg) => {
        const matchesSearch = msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             msg.message.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === 'Unread') {
            matchesStatus = !msg.is_read;
        } else if (statusFilter === 'Read') {
            matchesStatus = msg.is_read;
        }

        return matchesSearch && matchesStatus;
    });

    // Action Handlers
    const handleMarkAsRead = (id: number, currentStatus: boolean) => {
        router.patch(updateMessage.url(id), {
            is_read: !currentStatus
        }, {
            onSuccess: () => {
                notifySuccess(currentStatus ? __('Mensaje marcado como no leído.') : __('Mensaje marcado como leído.'));
                // Update selected message if it's open in details modal
                if (selectedMessage && selectedMessage.id === id) {
                    setSelectedMessage(prev => prev ? { ...prev, is_read: !currentStatus } : null);
                }
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de que deseas eliminar este mensaje?'))) {
            router.delete(destroyMessage.url(id), {
                onSuccess: () => {
                    notifySuccess(__('Mensaje eliminado con éxito.'));
                    setIsDetailModalOpen(false);
                }
            });
        }
    };

    const handleViewDetails = (msg: Message) => {
        setSelectedMessage(msg);
        setIsDetailModalOpen(true);
        // Automatically mark as read if it is currently unread
        if (!msg.is_read) {
            handleMarkAsRead(msg.id, false);
        }
    };

    return (
        <>
            <Head title={__('Bandeja de Entrada')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<Mail className="h-8 w-8" />}
                    title={__('Mensajes de Contacto')}
                    description={__('Revisa, responde y administra las consultas enviadas por los usuarios desde el formulario de contacto.')}
                    colorClassName="bg-[#4f46e5]"
                />

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={<Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                        title={__('Total Mensajes')}
                        value={totalMessages}
                        colorClassName="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                    />
                    <StatCard
                        icon={<Mail className="h-6 w-6 text-red-600 dark:text-red-400" />}
                        title={__('Mensajes Sin Leer')}
                        value={unreadMessages}
                        colorClassName="bg-red-50 dark:bg-red-950/20 text-red-650"
                    />
                    <StatCard
                        icon={<MailOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        title={__('Mensajes Leídos')}
                        value={readMessages}
                        colorClassName="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                    />
                </div>

                {/* Filters */}
                <FilterBar>
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Mensaje')} className="w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Remitente, email, asunto o contenido...')}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </FilterField>

                        <FilterField label={__('Estado')} className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Filtrar Estado')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{__('Todos los Mensajes')}</SelectItem>
                                    <SelectItem value="Unread">{__('Sin Leer')}</SelectItem>
                                    <SelectItem value="Read">{__('Leídos')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </FilterField>
                    </div>
                </FilterBar>

                {/* Table */}
                <div className="rounded-md border bg-white dark:bg-slate-900 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{__('Remitente')}</TableHead>
                                <TableHead>{__('Asunto')}</TableHead>
                                <TableHead>{__('Fecha de Recepción')}</TableHead>
                                <TableHead>{__('Estado')}</TableHead>
                                <TableHead className="text-right w-[100px]">{__('Acciones')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMessages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        {__('No hay mensajes en la bandeja de entrada.')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <TableRow key={msg.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-155 ${!msg.is_read ? 'bg-indigo-50/15 font-semibold' : ''}`}>
                                        <TableCell>
                                            <div>
                                                <p className="text-slate-800 dark:text-slate-200">{msg.name}</p>
                                                <p className="text-xs text-slate-500 font-normal">{msg.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-slate-650 dark:text-slate-350">
                                            {msg.subject || __('Sin Asunto')}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs font-mono">
                                            {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                                        </TableCell>
                                        <TableCell>
                                            {!msg.is_read ? (
                                                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-full border border-red-200/50 uppercase tracking-wider">
                                                    {__('Nuevo')}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-550 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                                                    {__('Leído')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(msg)} className="cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4 text-slate-500" />
                                                        {__('Ver Mensaje')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleMarkAsRead(msg.id, msg.is_read)} className="cursor-pointer">
                                                        {msg.is_read ? <Mail className="mr-2 h-4 w-4 text-slate-500" /> : <MailOpen className="mr-2 h-4 w-4 text-slate-500" />}
                                                        {msg.is_read ? __('Marcar No Leído') : __('Marcar Leído')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(msg.id)} 
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

            {/* Message Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5">
                            <Mail className="h-5 w-5 text-indigo-600" />
                            {__('Detalles del Mensaje')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Consulta la información del remitente y el contenido completo de la consulta.')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMessage && (
                        <div className="space-y-6 py-2">
                            {/* Sender Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{__('Remitente')}:</span>
                                        <span className="text-slate-900 dark:text-slate-100">{selectedMessage.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{__('Email')}:</span>
                                        <a href={`mailto:${selectedMessage.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {selectedMessage.email}
                                        </a>
                                    </div>
                                    {selectedMessage.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold text-slate-700 dark:text-slate-350">{__('Teléfono')}:</span>
                                            <a href={`tel:${selectedMessage.phone}`} className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono">
                                                {selectedMessage.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 md:border-l md:pl-4 border-slate-200 dark:border-slate-850">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{__('Fecha')}:</span>
                                        <span className="text-slate-900 dark:text-slate-100 font-mono text-xs">
                                            {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-slate-400" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{__('Asunto')}:</span>
                                        <span className="text-slate-900 dark:text-slate-100 truncate max-w-[200px]" title={selectedMessage.subject || ''}>
                                            {selectedMessage.subject || __('Sin Asunto')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold tracking-wider text-slate-400">{__('Mensaje')}</Label>
                                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-sm leading-relaxed text-slate-850 dark:text-slate-250 whitespace-pre-line min-h-[120px]">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            <DialogFooter className="pt-4 border-t mt-6 flex justify-between sm:justify-between items-center w-full gap-2">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="gap-2 cursor-pointer"
                                >
                                    <Trash className="h-4 w-4" />
                                    {__('Eliminar')}
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleMarkAsRead(selectedMessage.id, selectedMessage.is_read)}
                                        className="cursor-pointer"
                                    >
                                        {selectedMessage.is_read ? __('Marcar como No Leído') : __('Marcar como Leído')}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsDetailModalOpen(false)}
                                        className="bg-[#4f46e5] hover:bg-[#4338ca] text-white cursor-pointer"
                                    >
                                        {__('Cerrar')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
