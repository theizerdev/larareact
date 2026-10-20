import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslate } from '@/hooks/use-translate';
import {
    Database,
    Upload,
    FileArchive,
    FileText,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    Check,
    ArrowRight,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    HardDrive,
    Trash2,
} from 'lucide-react';

interface DatabaseImportWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportSuccess?: () => void;
}

export default function DatabaseImportWizardModal({
    open,
    onOpenChange,
    onImportSuccess,
}: DatabaseImportWizardModalProps) {
    const { __ } = useTranslate();
    const { auth } = usePage<any>().props;

    // Wizard Steps: 1 = Archivo, 2 = Opciones & Advertencia, 3 = Seguridad, 4 = Progreso & Ejecución
    const [currentStep, setCurrentStep] = useState<number>(1);

    // Paso 1: Archivo
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Paso 2: Opciones
    const [disableFk, setDisableFk] = useState<boolean>(true);

    // Paso 3: Seguridad
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(false);

    // Paso 4: Progreso y Resultados
    const [progress, setProgress] = useState<number>(0);
    const [progressStatus, setProgressStatus] = useState<string>('');
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [importError, setExportError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{
        filename: string;
        queries_count: number;
        tables_affected: number;
        duration_seconds: number;
        file_size_bytes: number;
    } | null>(null);

    // Resetear formulario al abrir o cerrar
    useEffect(() => {
        if (open) {
            setCurrentStep(1);
            setSelectedFile(null);
            setFileError(null);
            setPassword('');
            setPasswordError(null);
            setIsPasswordVerified(false);
            setProgress(0);
            setProgressStatus('');
            setIsImporting(false);
            setExportError(null);
            setImportResult(null);
        }
    }, [open]);

    // Validar archivo seleccionado
    const validateAndSetFile = (file: File) => {
        setFileError(null);
        const lowerName = file.name.toLowerCase();
        const validExtensions = ['.sql', '.gz', '.zip'];
        const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

        if (!isValid) {
            setFileError(__('Formato de archivo no válido. Solo se admiten archivos .sql, .sql.gz, .gz o .zip.'));
            return false;
        }

        const maxBytes = 200 * 1024 * 1024; // 200MB
        if (file.size > maxBytes) {
            setFileError(__('El archivo seleccionado supera el límite máximo permitido de 200 MB.'));
            return false;
        }

        setSelectedFile(file);
        return true;
    };

    // Manejo de drag & drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    // Paso 3: Verificación de Contraseña
    const handleVerifyPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!password.trim()) {
            setPasswordError(__('Por favor ingrese su contraseña para continuar.'));
            return;
        }

        setIsVerifyingPassword(true);
        setPasswordError(null);

        try {
            const res = await fetch('/admin/monitoring/database/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && (data.success || data.valid)) {
                setIsPasswordVerified(true);
                setPasswordError(null);
                setCurrentStep(4);
                // Iniciar proceso de importación
                triggerImport();
            } else {
                setPasswordError(data.message || __('Contraseña incorrecta. Verifique sus credenciales.'));
            }
        } catch (err) {
            setPasswordError(__('Error al verificar credenciales con el servidor.'));
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    // Paso 4: Ejecutar Importación en Backend
    const triggerImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setExportError(null);
        setProgress(5);
        setProgressStatus(__('Subiendo y preparando archivo de respaldo...'));

        let currentP = 10;
        const progressInterval = setInterval(() => {
            if (currentP < 85) {
                currentP += Math.floor(Math.random() * 8) + 3;
                if (currentP > 85) currentP = 85;

                if (currentP < 30) {
                    setProgressStatus(__('Descomprimiendo y analizando sentencias SQL...'));
                } else if (currentP < 60) {
                    setProgressStatus(__('Ejecutando sentencias e insertando registros...'));
                } else {
                    setProgressStatus(__('Restableciendo índices y llaves foráneas...'));
                }
            }
            setProgress(currentP);
        }, 300);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('password', password);
            formData.append('disable_fk', disableFk ? '1' : '0');

            const res = await fetch('/admin/monitoring/database/import', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            clearInterval(progressInterval);

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || __('Error desconocido durante la importación.'));
            }

            setProgress(100);
            setProgressStatus(__('¡Importación y restauración finalizadas exitosamente!'));
            setImportResult(data.data);

            if (onImportSuccess) {
                onImportSuccess();
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            setIsImporting(false);
            setExportError(err.message || __('Ocurrió un error al procesar el archivo en el servidor.'));
        } finally {
            setIsImporting(false);
        }
    };

    // Formatear bytes
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        if (bytes > 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        if (bytes > 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        return `${bytes} B`;
    };

    const steps = [
        { id: 1, title: __('Archivo'), desc: __('Subir respaldo'), icon: Upload },
        { id: 2, title: __('Opciones'), desc: __('Advertencia y flags'), icon: AlertTriangle },
        { id: 3, title: __('Seguridad'), desc: __('Confirmar clave'), icon: Lock },
        { id: 4, title: __('Restauración'), desc: __('Progreso 0-100%'), icon: Database },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden border shadow-2xl">
                {/* Header Institucional */}
                <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-600/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight">
                                    {__('Asistente de Importación de Base de Datos')}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {__('Restaure esquemas y registros a partir de respaldos .sql, .sql.gz, .gz o .zip.')}
                                </DialogDescription>
                            </div>
                        </div>
                        {selectedFile && (
                            <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 font-mono text-xs px-2.5 py-1 border-amber-300 dark:border-amber-700">
                                <FileArchive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                {selectedFile.name} ({formatBytes(selectedFile.size)})
                            </Badge>
                        )}
                    </div>

                    {/* Barra de Pasos */}
                    <div className="grid grid-cols-4 gap-2 pt-4">
                        {steps.map((step) => {
                            const IconComponent = step.icon;
                            const isActive = currentStep === step.id;
                            const isPast = currentStep > step.id;
                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                                        isActive
                                            ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500'
                                            : isPast
                                            ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400'
                                            : 'border-border/60 bg-card text-muted-foreground opacity-60'
                                    }`}
                                >
                                    <div
                                        className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                            isActive
                                                ? 'bg-amber-600 text-white shadow-sm'
                                                : isPast
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {isPast ? <Check className="size-3.5 stroke-[3]" /> : step.id}
                                    </div>
                                    <div className="min-w-0 hidden sm:block">
                                        <p className="text-xs font-semibold truncate leading-tight">{step.title}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                {/* Contenido Dinámico según el Paso */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ======================================================== */}
                    {/* PASO 1: SELECCIÓN DE ARCHIVO                             */}
                    {/* ======================================================== */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".sql,.gz,.zip,application/sql,application/gzip,application/zip"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />

                            {/* Dropzone */}
                            {!selectedFile ? (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                                        isDragOver
                                            ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 scale-[0.99]'
                                            : 'border-border hover:border-amber-400 hover:bg-muted/20'
                                    }`}
                                >
                                    <div className="p-4 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                        <Upload className="h-10 w-10 stroke-[1.5]" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-semibold text-foreground">
                                            {__('Haga clic para seleccionar o arrastre el archivo aquí')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {__('Formatos compatibles: .sql (Plano), .sql.gz / .gz (Gzip), .zip (Comprimido)')}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/80">
                                            {__('Tamaño máximo soportado: 200 MB por volcado')}
                                        </p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="mt-2 text-xs gap-2">
                                        <HardDrive className="h-3.5 w-3.5" />
                                        {__('Examinar archivos en este equipo')}
                                    </Button>
                                </div>
                            ) : (
                                /* Ficha del archivo seleccionado */
                                <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                                {selectedFile.name.toLowerCase().endsWith('.sql') ? (
                                                    <FileText className="h-8 w-8" />
                                                ) : (
                                                    <FileArchive className="h-8 w-8" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold font-mono text-foreground break-all">
                                                    {selectedFile.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{formatBytes(selectedFile.size)}</span>
                                                    <span>•</span>
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                                                        {selectedFile.name.split('.').pop()}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span className="text-emerald-600 font-medium">✓ {__('Archivo listo para importar')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="text-muted-foreground hover:text-destructive gap-1.5 text-xs"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {__('Cambiar')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {fileError && (
                                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>{fileError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 2: ADVERTENCIA Y OPCIONES DE RESTAURACIÓN            */}
                    {/* ======================================================== */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            {/* Alerta de Seguridad */}
                            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <span>{__('Advertencia sobre Sobrescritura de Base de Datos')}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                                    {__('La importación de un respaldo SQL ejecutará las sentencias incluidas en el archivo (como DROP TABLE, CREATE TABLE o INSERT INTO). Esto modificará o sobrescribirá los datos actuales de las tablas afectadas. Asegúrese de haber generado un respaldo previo antes de proceder.')}
                                </p>
                            </div>

                            {/* Opciones */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {__('Opciones de Ejecución')}
                                </Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/10">
                                        <div className="space-y-0.5 pr-4">
                                            <Label htmlFor="disable_fk_import" className="text-xs font-semibold cursor-pointer">
                                                {__('Deshabilitar FOREIGN_KEY_CHECKS durante la restauración')}
                                            </Label>
                                            <p className="text-[11px] text-muted-foreground">
                                                {__('Recomendado. Evita errores cuando las tablas secundarias se crean o insertan antes que las tablas principales.')}
                                            </p>
                                        </div>
                                        <Switch
                                            id="disable_fk_import"
                                            checked={disableFk}
                                            onCheckedChange={setDisableFk}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 3: CONFIRMACIÓN DE SEGURIDAD (CONTRASEÑA)           */}
                    {/* ======================================================== */}
                    {currentStep === 3 && (
                        <div className="max-w-xl mx-auto py-4 space-y-6 animate-in fade-in-50 duration-200">
                            <div className="text-center space-y-1.5">
                                <div className="mx-auto size-12 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center">
                                    <Lock className="size-6" />
                                </div>
                                <h3 className="text-lg font-bold tracking-tight">
                                    {__('Confirmación de Seguridad Institucional')}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {__('Por protección de la base de datos nacional, ingrese su contraseña para autorizar la importación.')}
                                </p>
                            </div>

                            {/* Ficha del Administrador */}
                            <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarFallback className="bg-amber-600 text-white font-bold text-xs">
                                        {auth?.user?.name ? auth.user.name.slice(0, 2).toUpperCase() : 'AD'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground truncate">
                                        {auth?.user?.name || __('Usuario Administrador')}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {auth?.user?.email || 'admin@mmmvenezuela.org'}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                    {__('Sesión Activa')}
                                </Badge>
                            </div>

                            {/* Campo de Contraseña */}
                            <form onSubmit={handleVerifyPassword} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="import_password" className="text-xs font-semibold">
                                        {__('Contraseña del Usuario')}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="import_password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="pr-10 text-sm h-11"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1.5">
                                            <AlertTriangle className="size-3.5" />
                                            {passwordError}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* PASO 4: PROGRESO Y RESULTADOS DE IMPORTACIÓN              */}
                    {/* ======================================================== */}
                    {currentStep === 4 && (
                        <div className="max-w-xl mx-auto py-6 space-y-6 animate-in fade-in-50 duration-200">
                            {isImporting ? (
                                <div className="space-y-6 text-center">
                                    <div className="relative mx-auto size-20">
                                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping opacity-25" />
                                        <div className="size-20 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center mx-auto">
                                            <Loader2 className="size-9 animate-spin" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-foreground">
                                            {__('Restaurando Base de Datos...')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {progressStatus}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Progress value={progress} className="h-2.5 bg-muted" />
                                        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                                            <span>{__('Procesando volcado SQL')}</span>
                                            <span className="font-bold text-amber-600">{progress}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : importError ? (
                                <div className="space-y-5 text-center">
                                    <div className="mx-auto size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                                        <AlertTriangle className="size-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-destructive">
                                            {__('Error en la Restauración')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {importError}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="text-xs"
                                    >
                                        {__('Volver a Intentar')}
                                    </Button>
                                </div>
                            ) : importResult ? (
                                <div className="space-y-6 text-center">
                                    <div className="mx-auto size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
                                        <CheckCircle2 className="size-9" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-foreground">
                                            {__('¡Base de Datos Restaurada con Éxito!')}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {__('Todas las tablas e instrucciones contenidas en el respaldo fueron ejecutadas satisfactoriamente.')}
                                        </p>
                                    </div>

                                    {/* Ficha de Métricas de la Restauración */}
                                    <div className="grid grid-cols-3 gap-3 text-left">
                                        <div className="p-3.5 rounded-xl border bg-card">
                                            <span className="text-[11px] text-muted-foreground font-medium">{__('Consultas')}</span>
                                            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                                                {importResult.queries_count.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-3.5 rounded-xl border bg-card">
                                            <span className="text-[11px] text-muted-foreground font-medium">{__('Tablas Afectadas')}</span>
                                            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                                                {importResult.tables_affected}
                                            </div>
                                        </div>
                                        <div className="p-3.5 rounded-xl border bg-card">
                                            <span className="text-[11px] text-muted-foreground font-medium">{__('Tiempo Total')}</span>
                                            <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                                                {importResult.duration_seconds}s
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Footer con Acciones de Navegación */}
                <div className="p-4 px-6 border-t bg-muted/20 flex items-center justify-between">
                    <div>
                        {currentStep > 1 && currentStep < 4 && !isImporting && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentStep((prev) => prev - 1)}
                                className="gap-2 text-xs"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {__('Atrás')}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {currentStep === 1 && (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                disabled={!selectedFile}
                                size="sm"
                                className="gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {__('Continuar a Opciones')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}

                        {currentStep === 2 && (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                size="sm"
                                className="gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {__('Continuar a Verificación')}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}

                        {currentStep === 3 && (
                            <Button
                                type="button"
                                onClick={handleVerifyPassword}
                                disabled={isVerifyingPassword || !password.trim()}
                                size="sm"
                                className="gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {isVerifyingPassword ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {__('Verificando...')}
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-4 w-4" />
                                        {__('Autorizar e Importar')}
                                    </>
                                )}
                            </Button>
                        )}

                        {currentStep === 4 && !isImporting && (
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                size="sm"
                                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {__('Cerrar')}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
