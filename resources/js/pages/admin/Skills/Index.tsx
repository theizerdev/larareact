import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    Award, Code2, Laptop, Plus, Pencil, Trash, Search, MoreVertical 
} from 'lucide-react';
import type { Skill } from '@/types';
import { store as storeSkill, update as updateSkill, destroy as destroySkill } from '@/routes/admin/skills';

export default function SkillsIndexPage({ skills = [] }: { skills: Skill[] }) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Skills'), href: '/admin/skills' },
    ];

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Stats calculations
    const totalSkills = skills.length;
    const frontendSkills = skills.filter(s => s.category === 'Frontend').length;
    const backendSkills = skills.filter(s => s.category === 'Backend').length;
    const toolsDesignSkills = skills.filter(s => s.category === 'Tools' || s.category === 'Design').length;

    // Local filtering
    const filteredSkills = skills.filter((skill) => {
        const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || skill.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Form definition
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        category: 'Frontend',
        proficiency: 80,
    });

    // Action Handlers
    const handleCreateClick = () => {
        setEditingSkill(null);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const handleEditClick = (skill: Skill) => {
        setEditingSkill(skill);
        clearErrors();
        setData({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSkill) {
            patch(updateSkill.url(editingSkill.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Habilidad actualizada con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        } else {
            post(storeSkill.url(), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Habilidad creada con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de que deseas eliminar esta habilidad?'))) {
            router.delete(destroySkill.url(id), {
                onSuccess: () => {
                    notifySuccess(__('Habilidad eliminada con éxito.'));
                }
            });
        }
    };

    return (
        <>
            <Head title={__('Manage Skills')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<Award className="h-8 w-8" />}
                    title={__('Habilidades y Tecnologías')}
                    description={__('Administra tu set de habilidades técnicas, categorías y niveles de dominio.')}
                    colorClassName="bg-[#4f46e5]"
                >
                    <Button onClick={handleCreateClick} className="gap-2 bg-white text-[#4f46e5] hover:bg-slate-100 dark:bg-slate-900 dark:text-indigo-400 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        {__('Nueva Habilidad')}
                    </Button>
                </ModuleHeader>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={<Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                        title={__('Total Habilidades')}
                        value={totalSkills}
                        colorClassName="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                    />
                    <StatCard
                        icon={<Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        title={__('Frontend & Backend')}
                        value={`${frontendSkills} FE / ${backendSkills} BE`}
                        colorClassName="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                    />
                    <StatCard
                        icon={<Laptop className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                        title={__('Herramientas & Diseño')}
                        value={toolsDesignSkills}
                        colorClassName="bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                    />
                </div>

                {/* Filters */}
                <FilterBar>
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Habilidad')} className="w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Escribe el nombre...')}
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </FilterField>

                        <FilterField label={__('Categoría')} className="w-full md:w-48">
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={__('Categoría')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{__('Todas las Categorías')}</SelectItem>
                                    <SelectItem value="Frontend">Frontend</SelectItem>
                                    <SelectItem value="Backend">Backend</SelectItem>
                                    <SelectItem value="Tools">Tools</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
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
                                <TableHead>{__('Habilidad')}</TableHead>
                                <TableHead>{__('Categoría')}</TableHead>
                                <TableHead>{__('Nivel de Dominio')}</TableHead>
                                <TableHead className="text-right w-[100px]">{__('Acciones')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSkills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                                        {__('No hay habilidades que coincidan con la búsqueda.')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSkills.map((skill) => (
                                    <TableRow key={skill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-150">
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                            {skill.name}
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {skill.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-36 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-[#4f46e5] h-full rounded-full transition-all duration-500" 
                                                        style={{ width: `${skill.proficiency}%` }} 
                                                    />
                                                </div>
                                                <span className="font-medium text-xs text-slate-650 dark:text-slate-400">
                                                    {skill.proficiency}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36">
                                                    <DropdownMenuItem onClick={() => handleEditClick(skill)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                                        {__('Editar')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(skill.id)} 
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
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSkill ? __('Editar Habilidad') : __('Crear Habilidad')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Ingresa la información básica y el nivel de maestría técnica para tu portafolio.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">{__('Nombre de la Habilidad')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    placeholder="Ej: React, Laravel, Docker"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category">{__('Categoría')}</Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(val) => setData('category', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={__('Selecciona Categoría')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Frontend">Frontend</SelectItem>
                                        <SelectItem value="Backend">Backend</SelectItem>
                                        <SelectItem value="Tools">Tools</SelectItem>
                                        <SelectItem value="Design">Design</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.category && <div className="text-xs text-red-500 mt-1">{errors.category}</div>}
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex justify-between text-sm font-semibold">
                                <Label htmlFor="proficiency">{__('Nivel de Dominio')}</Label>
                                <span className="text-[#4f46e5] dark:text-indigo-400">{data.proficiency}%</span>
                            </div>
                            <input
                                id="proficiency"
                                type="range"
                                min="0"
                                max="100"
                                value={data.proficiency}
                                onChange={(e) => setData('proficiency', parseInt(e.target.value) || 0)}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#4f46e5]"
                            />
                            {errors.proficiency && <div className="text-xs text-red-500 mt-1">{errors.proficiency}</div>}
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
