import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { useTranslate } from '@/hooks/use-translate';
import { notifySuccess, notifyError } from '@/utils/notifications';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';
import { 
    Briefcase, CheckCircle, Calendar, Plus, Pencil, Trash, Search, MoreVertical 
} from 'lucide-react';
import type { Experience } from '@/types';
import { store as storeExperience, update as updateExperience, destroy as destroyExperience } from '@/routes/admin/experiences';

export default function ExperiencesIndexPage({ experiences = [] }: { experiences: Experience[] }) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Experiences'), href: '/admin/experiences' },
    ];

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats calculations
    const totalExperiences = experiences.length;
    const currentExperiences = experiences.filter(e => e.is_current).length;
    const totalCompanies = new Set(experiences.map(e => e.company)).size;

    // Local filtering
    const filteredExperiences = experiences.filter((exp) => {
        const matchesSearch = exp.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             exp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    // Form definition
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        role: '',
        company: '',
        description: '',
        start_date: '',
        end_date: '',
        is_current: false,
    });

    // Action Handlers
    const handleCreateClick = () => {
        setEditingExperience(null);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (exp: Experience) => {
        setEditingExperience(exp);
        clearErrors();
        setData({
            role: exp.role || '',
            company: exp.company || '',
            description: exp.description || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            is_current: exp.is_current ? true : false,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingExperience) {
            patch(updateExperience.url(editingExperience.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Experiencia actualizada con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        } else {
            post(storeExperience.url(), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Experiencia creada con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de que deseas eliminar esta experiencia?'))) {
            router.delete(destroyExperience.url(id), {
                onSuccess: () => {
                    notifySuccess(__('Experiencia eliminada con éxito.'));
                }
            });
        }
    };

    return (
        <>
            <Head title={__('Manage Experiences')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<Briefcase className="h-8 w-8" />}
                    title={__('Trayectoria y Experiencia')}
                    description={__('Administra tu historial de puestos de trabajo, periodos laborales y responsabilidades.')}
                    colorClassName="bg-[#4f46e5]"
                >
                    <Button onClick={handleCreateClick} className="gap-2 bg-white text-[#4f46e5] hover:bg-slate-100 dark:bg-slate-900 dark:text-indigo-400 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        {__('Nueva Experiencia')}
                    </Button>
                </ModuleHeader>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={<Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                        title={__('Total Experiencias')}
                        value={totalExperiences}
                        colorClassName="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                    />
                    <StatCard
                        icon={<CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        title={__('Puestos Activos')}
                        value={currentExperiences}
                        colorClassName="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                    />
                    <StatCard
                        icon={<Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                        title={__('Empresas Registradas')}
                        value={totalCompanies}
                        colorClassName="bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                    />
                </div>

                {/* Filters */}
                <FilterBar>
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Experiencia')} className="w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Rol, cargo, empresa o descripción...')}
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
                                <TableHead>{__('Cargo / Rol')}</TableHead>
                                <TableHead>{__('Empresa / Institución')}</TableHead>
                                <TableHead>{__('Periodo Laboral')}</TableHead>
                                <TableHead>{__('Estado')}</TableHead>
                                <TableHead className="text-right w-[100px]">{__('Acciones')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExperiences.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                        {__('No hay registros de experiencias que coincidan con la búsqueda.')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExperiences.map((exp) => (
                                    <TableRow key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-150">
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                            {exp.role}
                                        </TableCell>
                                        <TableCell className="text-slate-650 dark:text-slate-300">
                                            {exp.company}
                                        </TableCell>
                                        <TableCell className="text-slate-550 dark:text-slate-400 font-mono text-xs">
                                            {exp.start_date} – {exp.is_current ? __('Presente') : exp.end_date}
                                        </TableCell>
                                        <TableCell>
                                            {exp.is_current ? (
                                                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full border border-emerald-200/50">
                                                    {__('Trabajo Actual')}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                                                    {__('Finalizado')}
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
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleEditClick(exp)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                                        {__('Editar')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(exp.id)} 
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
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExperience ? __('Editar Experiencia') : __('Crear Experiencia')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Registra tus cargos, periodos laborales e historial en la línea de tiempo de tu portafolio.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="role">{__('Rol o Cargo')}</Label>
                                <Input
                                    id="role"
                                    type="text"
                                    required
                                    placeholder="Ej: Senior Web Developer"
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                />
                                {errors.role && <div className="text-xs text-red-500 mt-1">{errors.role}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company">{__('Empresa o Institución')}</Label>
                                <Input
                                    id="company"
                                    type="text"
                                    required
                                    placeholder="Ej: Google, Freelance"
                                    value={data.company}
                                    onChange={(e) => setData('company', e.target.value)}
                                />
                                {errors.company && <div className="text-xs text-red-500 mt-1">{errors.company}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="start_date">{__('Inicio (Mes Año)')}</Label>
                                <Input
                                    id="start_date"
                                    type="text"
                                    required
                                    placeholder="Ej: Ene 2022"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                />
                                {errors.start_date && <div className="text-xs text-red-500 mt-1">{errors.start_date}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="end_date">{__('Fin (Mes Año)')}</Label>
                                <Input
                                    id="end_date"
                                    type="text"
                                    disabled={data.is_current}
                                    placeholder="Ej: Dic 2023"
                                    value={data.end_date}
                                    onChange={(e) => setData('end_date', e.target.value)}
                                    className="disabled:opacity-50"
                                />
                                {errors.end_date && <div className="text-xs text-red-500 mt-1">{errors.end_date}</div>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 py-1">
                            <Switch
                                id="is_current"
                                checked={data.is_current}
                                onCheckedChange={(checked) => {
                                    setData((prev) => ({
                                        ...prev,
                                        is_current: checked,
                                        end_date: checked ? '' : prev.end_date,
                                    }));
                                }}
                            />
                            <Label htmlFor="is_current" className="cursor-pointer font-medium">
                                {__('Es mi trabajo actual')}
                            </Label>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description">{__('Descripción / Logros')}</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                placeholder={__('Describe tus responsabilidades, tecnologías utilizadas y principales logros...')}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="resize-none"
                            />
                            {errors.description && <div className="text-xs text-red-500 mt-1">{errors.description}</div>}
                        </div>

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
