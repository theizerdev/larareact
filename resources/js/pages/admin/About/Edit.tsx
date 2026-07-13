import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { 
    User, Save, Upload, X, AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowLeft 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useTranslate } from '@/hooks/use-translate';
import Swal from 'sweetalert2';
import type { About } from '@/types';
import { update as updateAbout } from '@/routes/admin/about';

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
                    className="px-4 py-3 min-h-[150px] focus:outline-none text-sm leading-relaxed prose dark:prose-invert max-w-none focus-within:outline-none rich-editor-content"
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
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">Foto de Perfil / Avatar</Label>
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
                    dragActive
                        ? "border-indigo-500 bg-indigo-55/30 dark:bg-indigo-950/10"
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
                    <div className="relative group w-32 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                        <img src={previewUrl} alt="Vista previa del avatar" className="w-full h-full object-cover object-top" />
                        {value && (
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-650 transition cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Arrastra y suelta tu imagen aquí, o haz clic para explorar.
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Archivos permitidos: JPEG, PNG, JPG, WEBP (Máx 2MB)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function Edit({ about }: { about: About }) {
    const { __ } = useTranslate();
    
    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        hero_title: about.hero_title || '',
        hero_subtitle: about.hero_subtitle || '',
        hero_badge: about.hero_badge || '',
        bio: about.bio || '',
        experience_years: about.experience_years || '',
        completed_projects: about.completed_projects || '',
        image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(updateAbout.url(), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: __('Settings Saved'),
                    text: __('La sección Sobre Mí y Hero se actualizó con éxito.'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Portfolio'), href: '#' },
        { title: __('About Me'), href: '/admin/about' }
    ];

    return (
        <>
            <Head title={__('About Me & Hero Setup')} />
            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <User className="h-8 w-8 text-indigo-650" />
                            {__('About Me & Hero Configuration')}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {__('Control the landing page presentation, bio details, and counters of your portfolio.')}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 w-full">
                    {/* Card 1: Hero Settings */}
                    <Card className="shadow-sm border-t-4 border-t-indigo-600">
                        <CardHeader>
                            <CardTitle>{__('Hero Presentation Settings')}</CardTitle>
                            <CardDescription>
                                {__('Manage the very first section details the users see on your homepage.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="hero_title">{__('Hero Main Title')}</Label>
                                    <Input
                                        id="hero_title"
                                        type="text"
                                        required
                                        value={data.hero_title}
                                        onChange={e => setData('hero_title', e.target.value)}
                                        placeholder="Ej: Theizer Gonzalez"
                                    />
                                    {errors.hero_title && <div className="text-xs text-red-500 mt-1">{errors.hero_title}</div>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="hero_badge">{__('Hero Top Badge')}</Label>
                                    <Input
                                        id="hero_badge"
                                        type="text"
                                        required
                                        value={data.hero_badge}
                                        onChange={e => setData('hero_badge', e.target.value)}
                                        placeholder="Ej: Disponible para Proyectos"
                                    />
                                    {errors.hero_badge && <div className="text-xs text-red-500 mt-1">{errors.hero_badge}</div>}
                                </div>
                            </div>

                            <RichTextEditor
                                label={__('Hero Subtitle / Description')}
                                value={data.hero_subtitle}
                                onChange={val => setData('hero_subtitle', val)}
                                placeholder={__('Write the welcome presentation subtitle text...')}
                            />
                            {errors.hero_subtitle && <div className="text-xs text-red-500 mt-1">{errors.hero_subtitle}</div>}
                        </CardContent>
                    </Card>

                    {/* Card 2: Profile Biography and Counters */}
                    <Card className="shadow-sm border-t-4 border-t-purple-600">
                        <CardHeader>
                            <CardTitle>{__('Biography & Profile Stats')}</CardTitle>
                            <CardDescription>
                                {__('Update your bio content, upload profile avatar, and statistics counters.')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <DragDropImageUpload
                                value={data.image}
                                onChange={file => setData('image', file)}
                                currentImageUrl={about.avatar_path}
                            />
                            {errors.image && <div className="text-xs text-red-500 mt-1">{errors.image}</div>}

                            <RichTextEditor
                                label={__('Biography Details')}
                                value={data.bio}
                                onChange={val => setData('bio', val)}
                                placeholder={__('Describe your background, skills, and values...')}
                            />
                            {errors.bio && <div className="text-xs text-red-500 mt-1">{errors.bio}</div>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="experience_years">{__('Experience Years Counter')}</Label>
                                    <Input
                                        id="experience_years"
                                        type="text"
                                        required
                                        value={data.experience_years}
                                        onChange={e => setData('experience_years', e.target.value)}
                                        placeholder="Ej: +3 Años"
                                    />
                                    {errors.experience_years && <div className="text-xs text-red-500 mt-1">{errors.experience_years}</div>}
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="completed_projects">{__('Completed Projects Counter')}</Label>
                                    <Input
                                        id="completed_projects"
                                        type="text"
                                        required
                                        value={data.completed_projects}
                                        onChange={e => setData('completed_projects', e.target.value)}
                                        placeholder="Ej: +10 Proyectos"
                                    />
                                    {errors.completed_projects && <div className="text-xs text-red-500 mt-1">{errors.completed_projects}</div>}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex justify-between">
                            <Link href="/admin/dashboard">
                                <Button variant="outline" size="sm" type="button" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-950/20">
                                    <ArrowLeft className="h-4 w-4" />
                                    {__('Volver')}
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <Save className="h-4 w-4" />
                                {__('Save Changes')}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}
