import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { Input } from '@/components/ui/input';
import { ModuleHeader } from '@/components/module-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { 
    FolderKanban, Star, Code2, Plus, Pencil, Trash, Search, MoreVertical, Upload, X, AlignLeft, AlignCenter, AlignRight, AlignJustify, ExternalLink, Github
} from 'lucide-react';
import Swal from 'sweetalert2';
import type { Project } from '@/types';
import { store as storeProject, update as updateProject, destroy as destroyProject } from '@/routes/admin/projects';

const RichTextEditor = ({ 
    value, 
    onChange, 
    placeholder = '',
    label = ''
}: { 
    value: string; 
    onChange: (val: string) => void; 
    placeholder?: string;
    label?: string;
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isFocusedRef = useRef(false);

    // Initial content load
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, []);

    // Sync from outside if value changes and user is not editing
    useEffect(() => {
        if (editorRef.current && !isFocusedRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCommand = (command: string, val: string = '') => {
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className="space-y-2">
            {label && <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-2 text-slate-650 dark:text-slate-400">
                    <button
                        type="button"
                        onClick={() => execCommand('bold')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition font-bold w-8 h-8 flex items-center justify-center text-sm cursor-pointer"
                        title="Negrita"
                    >
                        B
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('underline')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition underline w-8 h-8 flex items-center justify-center text-sm cursor-pointer"
                        title="Subrayado"
                    >
                        U
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('italic')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition italic w-8 h-8 flex items-center justify-center text-sm cursor-pointer"
                        title="Cursiva"
                    >
                        I
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('strikeThrough')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition line-through w-8 h-8 flex items-center justify-center text-sm cursor-pointer"
                        title="Tachado"
                    >
                        S
                    </button>
                    <span className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                    <button
                        type="button"
                        onClick={() => execCommand('justifyLeft')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition w-8 h-8 flex items-center justify-center cursor-pointer"
                        title="Alinear izquierda"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyCenter')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition w-8 h-8 flex items-center justify-center cursor-pointer"
                        title="Centrar"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyRight')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition w-8 h-8 flex items-center justify-center cursor-pointer"
                        title="Alinear derecha"
                    >
                        <AlignRight className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => execCommand('justifyFull')}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition w-8 h-8 flex items-center justify-center cursor-pointer"
                        title="Justificar"
                    >
                        <AlignJustify className="h-4 w-4" />
                    </button>
                </div>
                {/* Content editable area */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => { isFocusedRef.current = true; }}
                    onBlur={() => { isFocusedRef.current = false; }}
                    className="px-4 py-3 min-h-[120px] focus:outline-none text-sm leading-relaxed prose dark:prose-invert max-w-none focus-within:outline-none rich-editor-content"
                    data-placeholder={placeholder}
                />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .rich-editor-content[contenteditable]:empty::before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    pointer-events: none;
                    display: block;
                }
            `}} />
        </div>
    );
};

const DragDropImageUpload = ({
    value,
    onChange,
    currentImageUrl
}: {
    value: File | null;
    onChange: (file: File | null) => void;
    currentImageUrl?: string | null;
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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
        setPreviewUrl(currentImageUrl || null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Imagen de Portada</Label>
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
                    <div className="relative group w-48 h-28 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <img src={previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
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
                            Arrastra y suelta tu imagen aquí, o haz clic para explorar.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                            Archivos permitidos: JPEG, PNG, JPG, WEBP (Máx 2MB)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProjectsIndexPage({ projects = [] }: { projects: Project[] }) {
    const { __ } = useTranslate();

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Projects'), href: '/admin/projects' },
    ];

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Stats calculations
    const totalProjects = projects.length;
    const featuredProjects = projects.filter(p => p.is_featured).length;
    const frontendProjects = projects.filter(p => p.category === 'Frontend').length;
    const backendProjects = projects.filter(p => p.category === 'Backend' || p.category === 'Fullstack').length;

    // Local filtering
    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             project.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || project.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Form definition
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        description: '',
        image: null as File | null,
        live_url: '',
        github_url: '',
        category: 'Frontend',
        order: 0,
        is_featured: false,
        _method: 'POST', // standard method parameter for laravel upload simulation
    });

    // Action Handlers
    const handleCreateClick = () => {
        setEditingProject(null);
        clearErrors();
        reset();
        setData((prev) => ({
            ...prev,
            _method: 'POST',
        }));
        setIsModalOpen(true);
    };

    const handleEditClick = (project: Project) => {
        setEditingProject(project);
        clearErrors();
        setData({
            title: project.title || '',
            description: project.description || '',
            image: null as File | null,
            live_url: project.live_url || '',
            github_url: project.github_url || '',
            category: project.category || 'Frontend',
            order: project.order || 0,
            is_featured: project.is_featured ? true : false,
            _method: 'PUT',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProject) {
            post(updateProject.url(editingProject.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Proyecto actualizado con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        } else {
            post(storeProject.url(), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    notifySuccess(__('Proyecto creado con éxito.'));
                },
                onError: () => {
                    notifyError(__('Por favor, revisa los campos señalados.'));
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(__('¿Estás seguro de que deseas eliminar este proyecto?'))) {
            router.delete(destroyProject.url(id), {
                onSuccess: () => {
                    notifySuccess(__('Proyecto eliminado con éxito.'));
                }
            });
        }
    };

    return (
        <>
            <Head title={__('Manage Projects')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Module Header */}
                <ModuleHeader
                    icon={<FolderKanban className="h-8 w-8" />}
                    title={__('Proyectos del Portafolio')}
                    description={__('Administra los proyectos, portadas, URLs de demostración y orden de presentación.')}
                    colorClassName="bg-[#4f46e5]"
                >
                    <Button onClick={handleCreateClick} className="gap-2 bg-white text-[#4f46e5] hover:bg-slate-100 dark:bg-slate-900 dark:text-indigo-400 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        {__('Nuevo Proyecto')}
                    </Button>
                </ModuleHeader>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        icon={<FolderKanban className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                        title={__('Total Proyectos')}
                        value={totalProjects}
                        colorClassName="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                    />
                    <StatCard
                        icon={<Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />}
                        title={__('Proyectos Destacados')}
                        value={featuredProjects}
                        colorClassName="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-650"
                    />
                    <StatCard
                        icon={<Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                        title={__('Frontend / Backend')}
                        value={`${frontendProjects} FE / ${backendProjects} BE`}
                        colorClassName="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                    />
                </div>

                {/* Filters */}
                <FilterBar>
                    <div className="flex flex-1 flex-wrap items-end gap-4">
                        <FilterField label={__('Buscar Proyecto')} className="w-full md:w-80">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={__('Escribe el título o descripción...')}
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
                                    <SelectItem value="Fullstack">Fullstack</SelectItem>
                                    <SelectItem value="Tools">Tools</SelectItem>
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
                                <TableHead className="w-[80px]">{__('Orden')}</TableHead>
                                <TableHead className="w-[100px]">{__('Portada')}</TableHead>
                                <TableHead>{__('Proyecto')}</TableHead>
                                <TableHead>{__('Categoría')}</TableHead>
                                <TableHead>{__('Destacado')}</TableHead>
                                <TableHead className="text-right w-[100px]">{__('Acciones')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                        {__('No hay proyectos registrados.')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => (
                                    <TableRow key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition duration-150">
                                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                                            #{project.order}
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-16 h-10 rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
                                                {project.image_path ? (
                                                    <img src={project.image_path} alt={project.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FolderKanban className="h-4 w-4 text-slate-400" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{project.title}</p>
                                                <div className="flex gap-2.5 mt-1">
                                                    {project.live_url && (
                                                        <a href={project.live_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] text-indigo-500 hover:underline">
                                                            <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
                                                            Demo
                                                        </a>
                                                    )}
                                                    {project.github_url && (
                                                        <a href={project.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] text-slate-500 hover:underline">
                                                            <Github className="h-2.5 w-2.5 mr-0.5" />
                                                            GitHub
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {project.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {project.is_featured ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 rounded-full border border-green-200/50">
                                                    <Star className="h-3 w-3 fill-green-600 text-green-600" />
                                                    {__('Sí')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
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
                                                    <DropdownMenuItem onClick={() => handleEditClick(project)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4 text-slate-500" />
                                                        {__('Editar')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDelete(project.id)} 
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
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProject ? __('Editar Proyecto') : __('Crear Proyecto')}
                        </DialogTitle>
                        <DialogDescription>
                            {__('Ingresa la información, enlaces externos y detalles visuales de tu proyecto.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Columna Izquierda: Información General y Enlaces */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title">{__('Título del Proyecto')}</Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        required
                                        placeholder="Ej: E-Commerce Sofisticado"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                    />
                                    {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="category">{__('Categoría')}</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(val) => setData('category', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={__('Categoría')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Frontend">Frontend</SelectItem>
                                            <SelectItem value="Backend">Backend</SelectItem>
                                            <SelectItem value="Fullstack">Fullstack</SelectItem>
                                            <SelectItem value="Tools">Tools</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category && <div className="text-xs text-red-500 mt-1">{errors.category}</div>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="live_url">{__('Demo En Vivo (URL)')}</Label>
                                    <Input
                                        id="live_url"
                                        type="url"
                                        placeholder="https://..."
                                        value={data.live_url}
                                        onChange={(e) => setData('live_url', e.target.value)}
                                    />
                                    {errors.live_url && <div className="text-xs text-red-500 mt-1">{errors.live_url}</div>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="github_url">{__('Repositorio GitHub (URL)')}</Label>
                                    <Input
                                        id="github_url"
                                        type="url"
                                        placeholder="https://github.com/..."
                                        value={data.github_url}
                                        onChange={(e) => setData('github_url', e.target.value)}
                                    />
                                    {errors.github_url && <div className="text-xs text-red-500 mt-1">{errors.github_url}</div>}
                                </div>

                                <div className="grid grid-cols-2 gap-4 items-center pt-2">
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

                                    <div className="flex items-center space-x-3 mt-6">
                                        <Switch
                                            id="is_featured"
                                            checked={data.is_featured}
                                            onCheckedChange={(checked) => setData('is_featured', checked)}
                                        />
                                        <Label htmlFor="is_featured" className="cursor-pointer">{__('Proyecto Destacado')}</Label>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Portada e Editor de Texto Enriquecido */}
                            <div className="space-y-4">
                                <DragDropImageUpload
                                    value={data.image}
                                    onChange={(file) => setData('image', file)}
                                    currentImageUrl={editingProject?.image_path}
                                />
                                {errors.image && <div className="text-xs text-red-500 mt-1">{errors.image}</div>}

                                <RichTextEditor
                                    label={__('Descripción del Proyecto')}
                                    value={data.description}
                                    onChange={(val) => setData('description', val)}
                                    placeholder={__('Detalla las características, tecnologías y tu rol en el desarrollo...')}
                                />
                                {errors.description && <div className="text-xs text-red-500 mt-1">{errors.description}</div>}
                            </div>
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
