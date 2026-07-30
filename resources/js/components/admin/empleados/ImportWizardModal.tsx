import React, { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Eye,
    EyeOff,
    UserCheck,
    UserPlus,
    Car,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    ShieldCheck,
    Check,
    X,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface ImportRecord {
    documento_identidad: string;
    nombres: string;
    apellidos: string;
    correo?: string;
    telefono?: string;
    departamento?: string;
    empresa?: string;
    vehiculos?: Array<{
        tipo_vehiculo: string;
        marca: string;
        modelo?: string;
        color?: string;
        placa: string;
    }>;
    is_duplicate: boolean;
    existing_id?: number | null;
    status_label: string;
}

interface ImportStats {
    total: number;
    nuevos: number;
    actualizar: number;
    errores: number;
}

interface ImportWizardModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
}) => {
    // Step state: 1 = Upload, 2 = Details & Duplicates, 3 = Password Auth, 4 = Progress
    const [step, setStep] = useState<number>(1);

    // File state
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview state
    const [records, setRecords] = useState<ImportRecord[]>([]);
    const [stats, setStats] = useState<ImportStats>({ total: 0, nuevos: 0, actualizar: 0, errores: 0 });
    const [invalidRows, setInvalidRows] = useState<Array<{ row: string | number; reason: string }>>([]);
    const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip'>('update');
    const [filterTab, setFilterTab] = useState<'all' | 'duplicates' | 'new' | 'warnings'>('all');

    // Security Password state
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);

    // Execution & Progress state
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressMessage, setProgressMessage] = useState<string>('Iniciando importación...');
    const [importResult, setImportResult] = useState<{
        success: boolean;
        created?: number;
        updated?: number;
        skipped?: number;
        total_processed?: number;
    } | null>(null);

    // Reset All State on Close
    const resetState = () => {
        setStep(1);
        setFile(null);
        setRecords([]);
        setStats({ total: 0, nuevos: 0, actualizar: 0, errores: 0 });
        setInvalidRows([]);
        setPassword('');
        setPasswordError(null);
        setProgressPercent(0);
        setIsProcessing(false);
        setImportResult(null);
    };

    const handleClose = () => {
        if (isProcessing) return; // Prevent closing mid-import
        resetState();
        onOpenChange(false);
    };

    // File Selection Handlers
    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
            Swal.fire({
                icon: 'error',
                title: 'Formato no soportado',
                text: 'Por favor selecciona un archivo con extensión .xlsx, .xls o .csv',
            });
            return;
        }
        setFile(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Helper to retrieve CSRF token
    const getCsrfToken = () => {
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    // Step 1: Process File Preview
    const handleProcessFile = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/admin/empleados/import-preview', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setRecords(data.records || []);
                setStats(data.stats || { total: 0, nuevos: 0, actualizar: 0, errores: 0 });
                setInvalidRows(data.invalid_rows || []);
                setStep(2);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al procesar archivo',
                    text: data.message || 'No se pudo leer el archivo Excel.',
                });
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al subir el archivo.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Step 3: Password Verification & Execution Launch
    const handleVerifyAndPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setPasswordError('Por favor ingresa tu contraseña para continuar.');
            return;
        }

        setIsVerifyingPassword(true);
        setPasswordError(null);

        try {
            const res = await fetch('/admin/empleados/import-verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Password verified successfully! Advance to Step 4 and trigger import execution
                setStep(4);
                startImportProcess();
            } else {
                setPasswordError(data.message || 'La contraseña ingresada es incorrecta.');
            }
        } catch (err: any) {
            setPasswordError('Error al verificar la contraseña.');
        } finally {
            setIsVerifyingPassword(false);
        }
    };

    // Step 4: Execute Batch Import with Progress Simulation / Chunks
    const startImportProcess = async () => {
        setIsProcessing(true);
        setProgressPercent(15);
        setProgressMessage('Preparando datos y estructurando colaboradores...');

        try {
            // Simulated progress steps for smooth UX
            const interval = setInterval(() => {
                setProgressPercent((prev) => {
                    if (prev >= 85) {
                        clearInterval(interval);
                        return 85;
                    }
                    return prev + 15;
                });
            }, 300);

            const res = await fetch('/admin/empleados/import-execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    records,
                    duplicate_strategy: duplicateStrategy,
                    password,
                }),
            });

            const data = await res.json();
            clearInterval(interval);

            if (res.ok && data.success) {
                setProgressPercent(100);
                setProgressMessage('¡Importación completada con éxito!');
                setImportResult(data);
                setIsProcessing(false);

                if (onSuccess) {
                    onSuccess();
                }

                // Refresh Inertia props
                router.reload();
            } else {
                setIsProcessing(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Error en la Importación',
                    text: data.message || 'Ocurrió un fallo durante el proceso.',
                });
                setStep(2);
            }
        } catch (err: any) {
            setIsProcessing(false);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión durante la importación.',
            });
            setStep(2);
        }
    };

    // Filter Records for Step 2 Table
    const filteredRecords = records.filter((r) => {
        if (filterTab === 'duplicates') return r.is_duplicate;
        if (filterTab === 'new') return !r.is_duplicate;
        return true;
    });

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-6xl md:max-w-7xl w-[96vw] max-h-[94vh] overflow-y-auto p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
                <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                Importación Masiva de Empleados
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Carga rápida y actualización de colaboradores desde archivos Excel (`.xlsx`)
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Step Indicator Bar */}
                    <div className="grid grid-cols-4 gap-2 mt-4 pt-2">
                        {[
                            { number: 1, label: '1. Carga Archivo' },
                            { number: 2, label: '2. Detalles y Duplicados' },
                            { number: 3, label: '3. Verificación' },
                            { number: 4, label: '4. Importación' },
                        ].map((s) => {
                            const isActive = step === s.number;
                            const isCompleted = step > s.number;
                            return (
                                <div
                                    key={s.number}
                                    className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : isCompleted
                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                    ) : (
                                        <span className="mr-1.5">{s.number}.</span>
                                    )}
                                    {s.label.split('. ')[1]}
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                {/* ========================================================
                    PASO 1: CARGA DE ARCHIVO
                   ======================================================== */}
                {step === 1 && (
                    <div className="space-y-6 py-4">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                isDragging
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : file
                                    ? 'border-emerald-400 bg-emerald-50/20 dark:bg-slate-800/50'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileSelect(e.target.files[0]);
                                    }
                                }}
                            />

                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="p-4 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full shadow-inner">
                                    <Upload className="w-8 h-8" />
                                </div>

                                {file ? (
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {(file.size / 1024).toFixed(1)} KB — Haz clic o arrastra para cambiar de archivo
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Arrastra y suelta tu archivo Excel aquí, o{' '}
                                            <span className="text-emerald-600 font-semibold underline">examina tus archivos</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Formatos soportados: <span className="font-semibold text-slate-600 dark:text-slate-300">.XLSX, .XLS, .CSV</span> (Máx. 10 MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Format Guidance Banner */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Estructura recomendada de columnas en el Excel:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                    'CURP / No. Empleado',
                                    'Nombre',
                                    'Apellido Paterno',
                                    'Apellido Materno',
                                    'Empresa',
                                    'Área / Departamento',
                                    'Correo',
                                    'Teléfono',
                                    'Tipo Vehículo',
                                    'Marca Vehículo',
                                    'Color Vehículo',
                                    'Placa Vehículo',
                                ].map((col) => (
                                    <Badge key={col} variant="outline" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px]">
                                        {col}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleProcessFile}
                                disabled={!file || isUploading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-md"
                            >
                                {isUploading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Analizando archivo...
                                    </>
                                ) : (
                                    <>
                                        Siguiente: Analizar Datos
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    PASO 2: DETALLES DEL ARCHIVO Y DUPLICADOS
                   ======================================================== */}
                {step === 2 && (
                    <div className="space-y-5 py-2">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                                <p className="text-xs text-slate-500 font-medium">Total Encontrados</p>
                                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/50 text-center">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1">
                                    <UserPlus className="w-3.5 h-3.5" /> Nuevos
                                </p>
                                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.nuevos}</p>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/50 text-center">
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5" /> Duplicados
                                </p>
                                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.actualizar}</p>
                            </div>
                            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800/50 text-center">
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Advertencias
                                </p>
                                <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{stats.errores}</p>
                            </div>
                        </div>

                        {/* Duplicate Handling Strategy Control */}
                        {stats.actualizar > 0 && (
                            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                            Se detectaron {stats.actualizar} registros duplicados (Número de Empleado existente)
                                        </p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                            Elige qué acción tomar cuando un colaborador ya exista en la base de datos:
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        type="button"
                                        variant={duplicateStrategy === 'update' ? 'default' : 'outline'}
                                        onClick={() => setDuplicateStrategy('update')}
                                        className={duplicateStrategy === 'update' ? 'bg-amber-600 hover:bg-amber-700 text-white text-xs' : 'text-xs'}
                                    >
                                        Actualizar existentes
                                    </Button>
                                    <Button
                                        size="sm"
                                        type="button"
                                        variant={duplicateStrategy === 'skip' ? 'default' : 'outline'}
                                        onClick={() => setDuplicateStrategy('skip')}
                                        className={duplicateStrategy === 'skip' ? 'bg-slate-700 text-white text-xs' : 'text-xs'}
                                    >
                                        Omitir existentes
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Filter Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('all')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        filterTab === 'all'
                                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Todos ({records.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('new')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        filterTab === 'new'
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Solo Nuevos ({stats.nuevos})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterTab('duplicates')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                        filterTab === 'duplicates'
                                            ? 'bg-amber-600 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    Solo Duplicados ({stats.actualizar})
                                </button>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Mostrando {filteredRecords.length} registros
                            </span>
                        </div>

                        {/* Records Preview Table */}
                        <div className="max-h-[48vh] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
                            <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                                <thead className="text-[11px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3">Estatus</th>
                                        <th className="py-2 px-3">CURP / No. Empleado</th>
                                        <th className="py-2 px-3">Nombre Completo</th>
                                        <th className="py-2 px-3">Departamento</th>
                                        <th className="py-2 px-3">Teléfono (+52)</th>
                                        <th className="py-2 px-3">Vehículo(s)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredRecords.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="py-2 px-3">
                                                {r.is_duplicate ? (
                                                    <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px]">
                                                        Actualizar
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-[10px]">
                                                        Nuevo
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 font-semibold font-mono text-slate-900 dark:text-slate-100">
                                                {r.documento_identidad}
                                            </td>
                                            <td className="py-2 px-3 font-medium">
                                                {r.nombres} {r.apellidos}
                                            </td>
                                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                                {r.departamento || 'General'}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                                                {r.telefono ? `+52 ${r.telefono}` : '-'}
                                            </td>
                                            <td className="py-2 px-3">
                                                {r.vehiculos && r.vehiculos.length > 0 ? (
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                                                        <Car className="w-3.5 h-3.5 text-blue-500" />
                                                        {r.vehiculos.map((v) => `${v.tipo_vehiculo} (${v.placa || 'S/N'})`).join(', ')}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1 text-xs">
                                <ArrowLeft className="w-3.5 h-3.5" /> Volver a Cargar
                            </Button>
                            <Button
                                onClick={() => setStep(3)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-2 shadow"
                            >
                                Continuar a Confirmación
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    PASO 3: VERIFICACIÓN DE SEGURIDAD (CONTRASEÑA)
                   ======================================================== */}
                {step === 3 && (
                    <form onSubmit={handleVerifyAndPasswordSubmit} className="space-y-6 py-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Verificación de Seguridad Requerida
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                                Estás a punto de procesar la importación masiva de{' '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{records.length} colaboradores</span> en el sistema.
                                Por seguridad, por favor ingresa tu contraseña de usuario para autorizar la transacción.
                            </p>
                        </div>

                        <div className="space-y-2 max-w-md mx-auto">
                            <Label htmlFor="auth-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Contraseña del Usuario Autenticado
                            </Label>
                            <div className="relative">
                                <Input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setPasswordError(null);
                                    }}
                                    placeholder="Ingresa tu contraseña actual..."
                                    className={`pr-10 ${passwordError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 pt-1">
                                    <X className="w-3.5 h-3.5" />
                                    {passwordError}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => setStep(2)} disabled={isVerifyingPassword} className="gap-1 text-xs">
                                <ArrowLeft className="w-3.5 h-3.5" /> Volver a Detalles
                            </Button>
                            <Button
                                type="submit"
                                disabled={!password || isVerifyingPassword}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-2 shadow"
                            >
                                {isVerifyingPassword ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        Autorizar e Iniciar Importación
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* ========================================================
                    PASO 4: PROGRESO E IMPORTACIÓN
                   ======================================================== */}
                {step === 4 && (
                    <div className="space-y-6 py-8 text-center">
                        {isProcessing ? (
                            <div className="space-y-5 max-w-lg mx-auto">
                                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                    <RefreshCw className="w-7 h-7 animate-spin" />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        Procesando Importación de Empleados
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {progressMessage}
                                    </p>
                                </div>

                                {/* Animated Percentage Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                                        <span>Progreso del Archivo</span>
                                        <span className="text-emerald-600 font-mono font-bold">{progressPercent}%</span>
                                    </div>
                                    <Progress value={progressPercent} className="h-3 bg-slate-100 dark:bg-slate-800" />
                                </div>
                            </div>
                        ) : importResult ? (
                            <div className="space-y-6 max-w-lg mx-auto">
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        ¡Importación Finalizada con Éxito!
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Todos los registros del archivo han sido procesados e ingresados a la base de datos.
                                    </p>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="text-xs text-slate-500">Procesados</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{importResult.total_processed}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Nuevos Creados</p>
                                        <p className="text-lg font-bold text-emerald-600">{importResult.created}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Actualizados</p>
                                        <p className="text-lg font-bold text-amber-600">{importResult.updated}</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleClose}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md"
                                >
                                    Finalizar y Cerrar
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
