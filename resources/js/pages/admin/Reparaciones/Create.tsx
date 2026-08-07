import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Wrench,
    User,
    Smartphone,
    Laptop,
    Tv,
    Gamepad2,
    ShieldAlert,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Calendar,
    DollarSign,
    Lock,
    FileText,
    ArrowLeft,
    Plus,
    Check,
    Save,
    Sparkles,
    Search,
    ShieldCheck,
    HelpCircle,
    Info,
    Hash,
    Clock,
    UserCheck,
    ChevronRight,
    ChevronLeft,
    Layers,
    Cpu,
    UserPlus,
    X,
    Tag,
    Camera,
    Upload,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Cliente {
    id: number;
    nombre: string;
    telefono?: string;
    email?: string;
}

interface ModeloItem {
    id: number;
    nombre_comercial: string;
    marca_id: number;
}

interface MarcaItem {
    id: number;
    nombre: string;
    modelos: ModeloItem[];
}

interface CategoriaItem {
    id: number;
    nombre: string;
}

interface Props {
    clientes: Cliente[];
    marcas: MarcaItem[];
    tecnicos: { id: number; name: string }[];
    categorias?: CategoriaItem[];
    currencySymbol: string;
}

export default function CreateReparacion({ clientes: initialClientes, marcas: initialMarcas, tecnicos, categorias = [], currencySymbol }: Props) {
    const { __ } = useTranslate();

    const [clientesList, setClientesList] = useState<Cliente[]>(initialClientes || []);
    const [marcasList, setMarcasList] = useState<MarcaItem[]>(initialMarcas || []);
    const [currentStep, setCurrentStep] = useState<number>(1);

    // Búsqueda en tiempo real de Tipo de Dispositivo / Categoría (Select2 style)
    const [searchCategoriaTerm, setSearchCategoriaTerm] = useState('');
    const [isCategoriaDropdownOpen, setIsCategoriaDropdownOpen] = useState(false);

    // Búsqueda en tiempo real de Cliente
    const [searchClienteTerm, setSearchClienteTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    // Modal Crear Nuevo Cliente
    const [openNewClientModal, setOpenNewClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
    });
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // Modales de Marca y Modelo
    const [openNewMarcaModal, setOpenNewMarcaModal] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isCreatingMarca, setIsCreatingMarca] = useState(false);

    const [openNewModeloModal, setOpenNewModeloModal] = useState(false);
    const [newModeloNombre, setNewModeloNombre] = useState('');
    const [newModeloCodigo, setNewModeloCodigo] = useState('');
    const [isCreatingModelo, setIsCreatingModelo] = useState(false);

    // 12 Puntos de Inspección Física
    const elementosInspeccion = [
        { key: 'Pantalla', label: 'Pantalla / Display' },
        { key: 'Cristal trasero', label: 'Cristal Trasero / Tapa' },
        { key: 'Marco', label: 'Marco / Bisel' },
        { key: 'Botones', label: 'Botones (Power/Vol)' },
        { key: 'Bandeja SIM', label: 'Bandeja SIM / MicroSD' },
        { key: 'Cámara trasera', label: 'Cámara Trasera' },
        { key: 'Cámara frontal', label: 'Cámara Frontal' },
        { key: 'Tornillos', label: 'Tornillos Chasis' },
        { key: 'Tapa trasera', label: 'Tapa / Carcasa' },
        { key: 'Puerto de carga', label: 'Puerto de Carga' },
        { key: 'Humedad visible', label: 'Sensor de Humedad' },
        { key: 'Equipo doblado', label: 'Chasis Doblado/Curvo' },
    ];

    const [inspeccionState, setInspeccionState] = useState<Record<string, { estado: 'bueno' | 'malo' | 'no_aplica'; obs: string }>>(
        elementosInspeccion.reduce((acc, el) => {
            acc[el.key] = { estado: 'bueno', obs: '' };
            return acc;
        }, {} as Record<string, { estado: 'bueno' | 'malo' | 'no_aplica'; obs: string }>)
    );

    // 5 Revisiones de Estado Operativo
    const [estadoEquipoState, setEstadoEquipoState] = useState({
        enciende: 'si',
        carga_bateria: 'si',
        entra_sistema: 'si',
        tiene_bloqueo: 'no',
        proporciona_contrasena: 'no',
    });

    const [accesoriosState, setAccesoriosState] = useState({
        cargador: false,
        funda: false,
        bandeja_sim: false,
        tarjeta_sd: false,
    });

    // Estado del Patrón de Desbloqueo (Grid 3x3)
    const [tipoBloqueo, setTipoBloqueo] = useState<'password' | 'pattern' | 'none'>('password');
    const [patronSecuencia, setPatronSecuencia] = useState<number[]>([]);

    // 4 Ángulos de Evidencias Fotográficas
    const [fotosState, setFotosState] = useState<Record<string, string>>({
        frente: '',
        trasero: '',
        borde_sup: '',
        borde_inf: '',
    });

    const handleFotoUpload = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setFotosState((prev) => {
                const next = { ...prev, [slotKey]: base64String };
                setData('evidencias_fotos', next);
                return next;
            });
            notifySuccess(__('Fotografía cargada correctamente.'));
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFoto = (slotKey: string) => {
        setFotosState((prev) => {
            const next = { ...prev, [slotKey]: '' };
            setData('evidencias_fotos', next);
            return next;
        });
    };

    const handleNodeClick = (nodeNum: number) => {
        if (!patronSecuencia.includes(nodeNum)) {
            const newSeq = [...patronSecuencia, nodeNum];
            setPatronSecuencia(newSeq);
            setData('contrasena_patron', `Patrón: ${newSeq.join(' - ')}`);
        }
    };

    const handleClearPatron = () => {
        setPatronSecuencia([]);
        setData('contrasena_patron', '');
    };

    const [selectedMarcaId, setSelectedMarcaId] = useState<string>('');
    const [modelosFiltrados, setModelosFiltrados] = useState<ModeloItem[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        cliente_nombre: '',
        cliente_telefono: '',
        tipo_dispositivo: (categorias && categorias.length > 0) ? categorias[0].nombre : 'Smartphone',
        marca_id: '',
        marca_nombre: '',
        modelo_id: '',
        modelo_nombre: '',
        color: '',
        imei_serie: '',
        contrasena_patron: '',
        descripcion_falla: '',
        observaciones_fisicas: '',
        tecnico_id: '',
        costo_estimado: '0',
        anticipo: '0',
        garantia_dias: '30',
        fecha_prometida: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    });

    // Categorías filtradas por la búsqueda rápida (Select2)
    const categoriasFiltradas = categorias.filter((cat) => {
        if (!searchCategoriaTerm || searchCategoriaTerm.trim() === '') return true;
        return cat.nombre.toLowerCase().includes(searchCategoriaTerm.toLowerCase().trim());
    });

    // Clientes filtrados por la búsqueda en tiempo real (solo si hay un término escrito)
    const clientesFiltrados = clientesList.filter((c) => {
        if (!searchClienteTerm || searchClienteTerm.trim() === '') return false;
        const term = searchClienteTerm.toLowerCase().trim();
        return (
            c.nombre?.toLowerCase().includes(term) ||
            c.telefono?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term)
        );
    });

    // Seleccionar Cliente de la búsqueda
    const handleSelectClienteObj = (c: Cliente) => {
        setData((prev) => ({
            ...prev,
            cliente_id: String(c.id),
            cliente_nombre: c.nombre,
            cliente_telefono: c.telefono || '',
        }));
        setSearchClienteTerm(c.nombre);
        setIsClientDropdownOpen(false);
    };

    // Limpiar Cliente seleccionado
    const handleClearCliente = () => {
        setData((prev) => ({
            ...prev,
            cliente_id: '',
            cliente_nombre: '',
            cliente_telefono: '',
        }));
        setSearchClienteTerm('');
    };

    // Helper para peticiones JSON asíncronas sin recarga de página mediante fetch nativo
    const postJson = async (url: string, bodyObj: any) => {
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(bodyObj),
        });
        return await response.json();
    };

    // Crear Nuevo Cliente desde el Modal (sin recarga)
    const handleCreateNewClient = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newClientData.nombre.trim()) return;

        setIsCreatingClient(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-cliente', newClientData);
            if (dataRes.success) {
                const newClient = dataRes.cliente;
                setClientesList((prev) => [newClient, ...prev]);
                setData((prev) => ({
                    ...prev,
                    cliente_id: String(newClient.id),
                    cliente_nombre: newClient.nombre,
                    cliente_telefono: newClient.telefono || '',
                }));
                setSearchClienteTerm(newClient.nombre);
                setOpenNewClientModal(false);
                setNewClientData({ nombre: '', telefono: '', email: '', direccion: '' });
                notifySuccess(__('Nuevo cliente registrado y seleccionado.'));
            } else {
                notifyError(__('Ocurrió un error al registrar el cliente.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar el cliente.'));
        } finally {
            setIsCreatingClient(false);
        }
    };

    // Crear Nueva Marca desde el Modal (sin recarga)
    const handleCreateNewMarca = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!newMarcaNombre.trim()) return;

        setIsCreatingMarca(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-marca', { nombre: newMarcaNombre.trim() });
            if (dataRes.success) {
                const newMarca: MarcaItem = dataRes.marca;
                setMarcasList((prev) => [...prev, newMarca]);
                setSelectedMarcaId(String(newMarca.id));
                setModelosFiltrados([]);
                setData((prev) => ({
                    ...prev,
                    marca_id: String(newMarca.id),
                    marca_nombre: newMarca.nombre,
                    modelo_id: '',
                    modelo_nombre: '',
                }));
                setOpenNewMarcaModal(false);
                setNewMarcaNombre('');
                notifySuccess(__('Nueva marca registrada exitosamente.'));
            } else {
                notifyError(__('Ocurrió un error al registrar la marca.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar la marca.'));
        } finally {
            setIsCreatingMarca(false);
        }
    };

    // Crear Nuevo Modelo desde el Modal (sin recarga)
    const handleCreateNewModelo = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const marcaIdToUse = selectedMarcaId || data.marca_id;
        if (!marcaIdToUse) {
            notifyError(__('Por favor seleccione una marca antes de crear un modelo.'));
            return;
        }
        if (!newModeloNombre.trim()) {
            notifyError(__('Por favor ingrese el nombre del modelo.'));
            return;
        }

        setIsCreatingModelo(true);
        try {
            const dataRes = await postJson('/admin/reparaciones/quick-modelo', {
                marca_id: marcaIdToUse,
                nombre_comercial: newModeloNombre.trim(),
                codigo_modelo: newModeloCodigo.trim(),
            });
            if (dataRes.success) {
                const newModelo: ModeloItem = dataRes.modelo;
                setModelosFiltrados((prev) => [...prev, newModelo]);
                setMarcasList((prevMarcas) =>
                    prevMarcas.map((m) =>
                        String(m.id) === String(marcaIdToUse)
                            ? { ...m, modelos: [...(m.modelos || []), newModelo] }
                            : m
                    )
                );
                setData((prev) => ({
                    ...prev,
                    marca_id: String(marcaIdToUse),
                    modelo_id: String(newModelo.id),
                    modelo_nombre: newModelo.nombre_comercial,
                }));
                setOpenNewModeloModal(false);
                setNewModeloNombre('');
                setNewModeloCodigo('');
                notifySuccess(__('Nuevo modelo registrado exitosamente.'));
            } else {
                notifyError(__('Ocurrió un error al registrar el modelo.'));
            }
        } catch (error) {
            notifyError(__('Ocurrió un error al registrar el modelo.'));
        } finally {
            setIsCreatingModelo(false);
        }
    };

    // Manejar selección de Marca y filtrar Modelos
    const handleSelectMarca = (marcaId: string) => {
        const m = marcasList.find((item) => String(item.id) === marcaId);
        setSelectedMarcaId(marcaId);
        if (m) {
            setModelosFiltrados(m.modelos || []);
            setData((prev) => ({
                ...prev,
                marca_id: String(m.id),
                marca_nombre: m.nombre,
                modelo_id: '',
                modelo_nombre: '',
            }));
        } else {
            setModelosFiltrados([]);
        }
    };

    // Manejar selección de Modelo
    const handleSelectModelo = (modeloId: string) => {
        const mod = modelosFiltrados.find((item) => String(item.id) === modeloId);
        if (mod) {
            setData((prev) => ({
                ...prev,
                modelo_id: String(mod.id),
                modelo_nombre: mod.nombre_comercial,
            }));
        }
    };

    // Cambio en Inspección Física
    const handleInspeccionChange = (key: string, estado: 'bueno' | 'malo' | 'no_aplica') => {
        setInspeccionState((prev) => ({
            ...prev,
            [key]: { ...prev[key], estado },
        }));
    };

    const handleInspeccionObsChange = (key: string, obs: string) => {
        setInspeccionState((prev) => ({
            ...prev,
            [key]: { ...prev[key], obs },
        }));
    };

    const costoEstimadoNum = Number(data.costo_estimado || 0);
    const anticipoNum = Number(data.anticipo || 0);
    const saldoRestanteNum = Math.max(0, costoEstimadoNum - anticipoNum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payloadData = {
            ...data,
            inspeccion_fisica: inspeccionState,
            estado_equipo: estadoEquipoState,
            accesorios: accesoriosState,
        };

        post('/admin/reparaciones', {
            data: payloadData,
            onSuccess: () => notifySuccess(__('Orden de reparación registrada exitosamente.')),
            onError: () => notifyError(__('Por favor completa los campos requeridos.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: __('Recepción Estandarizada'), href: '#' },
    ];

    const tiposDispositivo = [
        { id: 'smartphone', label: 'Smartphone', icon: Smartphone, color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800' },
        { id: 'laptop', label: 'Laptop', icon: Laptop, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800' },
        { id: 'cpu', label: 'CPU Desktop', icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' },
        { id: 'consola', label: 'Consola', icon: Gamepad2, color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800' },
        { id: 'otro', label: 'Otro Equipo', icon: Tv, color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800' },
    ];

    return (
        <>
            <Head title={__('Recepción de Equipo - Servicio Técnico')} />

            <div className="space-y-6 w-full pb-16">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                {/* HEADER PRINCIPAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono uppercase tracking-wider">
                                🛠️ Genius Bar & Repair POS
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">{__('Recepción de Equipo para Reparación')}</h1>
                        <p className="text-slate-300 text-xs">{__('Proceso estandarizado de 11 pasos con diagnóstico físico e inspección técnica.')}</p>
                    </div>

                    <Link href="/admin/reparaciones">
                        <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 text-xs font-semibold backdrop-blur-md">
                            <ArrowLeft className="w-4 h-4" />
                            {__('Volver al Listado')}
                        </Button>
                    </Link>
                </div>

                {/* STEPPER PROGRESIVO EN 3 ETAPAS */}
                <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold transition-all',
                            currentStep === 1
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                        <span>{__('Cliente & Dispositivo')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className={cn(
                            'flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-bold transition-all',
                            currentStep === 2
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                    >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
                        <span>{__('Presupuesto & Asignación')}</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* COLUMNA PRINCIPAL DEL WIZARD (2 COLUMNAS DE ANCHO) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* ETAPA 1: CLIENTE & DISPOSITIVO */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* PASO 1: BÚSQUEDA Y DATOS DEL CLIENTE EN TIEMPO REAL */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3 flex flex-row items-center justify-between">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                                <User className="w-4 h-4 text-purple-600" />
                                                {__('1. Búsqueda y Datos del Cliente')}
                                            </CardTitle>

                                            {/* BOTÓN CON VENTANA MODAL PARA REGISTRAR CLIENTE NUEVO */}
                                            <Dialog open={openNewClientModal} onOpenChange={setOpenNewClientModal}>
                                                <DialogTrigger asChild>
                                                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-bold text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800">
                                                        <UserPlus className="w-4 h-4 text-purple-600" />
                                                        {__('+ Crear Nuevo Cliente')}
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                            <UserPlus className="w-5 h-5 text-purple-600" />
                                                            {__('Registrar Nuevo Cliente')}
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    <div className="space-y-4 py-2">
                                                        <div>
                                                            <Label className="text-xs font-semibold">{__('Nombre Completo *')}</Label>
                                                            <Input
                                                                value={newClientData.nombre}
                                                                onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                                                                placeholder={__('ej: Carlos Mendoza')}
                                                                className="text-xs h-9 mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-xs font-semibold">{__('Teléfono WhatsApp')}</Label>
                                                            <Input
                                                                value={newClientData.telefono}
                                                                onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                                                                placeholder={__('ej: +58 412 0000000')}
                                                                className="text-xs h-9 mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-xs font-semibold">{__('Correo Electrónico')}</Label>
                                                            <Input
                                                                type="email"
                                                                value={newClientData.email}
                                                                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                                                placeholder={__('cliente@correo.com')}
                                                                className="text-xs h-9 mt-1"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-xs font-semibold">{__('Dirección')}</Label>
                                                            <Input
                                                                value={newClientData.direccion}
                                                                onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                                                                placeholder={__('Ciudad, Dirección de residencia')}
                                                                className="text-xs h-9 mt-1"
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                            <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewClientModal(false)} className="h-8 text-xs">
                                                                {__('Cancelar')}
                                                            </Button>
                                                            <Button type="button" onClick={(e) => handleCreateNewClient(e)} disabled={isCreatingClient} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                                {__('Guardar Cliente')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            {/* BUSCADOR DE CLIENTE ANCHO COMPLETO */}
                                            <div className="relative w-full">
                                                <Label className="text-xs font-semibold">{__('Búsqueda de Cliente en Tiempo Real *')}</Label>
                                                <div className="relative mt-1">
                                                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-purple-600" />
                                                    <Input
                                                        value={searchClienteTerm}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSearchClienteTerm(val);
                                                            setData((prev) => ({
                                                                ...prev,
                                                                cliente_nombre: val,
                                                            }));
                                                            setIsClientDropdownOpen(val.trim().length > 0);
                                                        }}
                                                        onFocus={() => {
                                                            if (searchClienteTerm.trim().length > 0) {
                                                                setIsClientDropdownOpen(true);
                                                            }
                                                        }}
                                                        placeholder={__('Escriba el nombre o teléfono para buscar un cliente...')}
                                                        className="text-xs h-11 pl-9 pr-8 font-medium"
                                                        required
                                                    />
                                                    {(data.cliente_nombre || searchClienteTerm) && (
                                                        <button
                                                            type="button"
                                                            onClick={handleClearCliente}
                                                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                                            title={__('Limpiar cliente')}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* RESULTADOS EN TIEMPO REAL POP-OVER DE ANCHO COMPLETO */}
                                                {isClientDropdownOpen && clientesFiltrados.length > 0 && (
                                                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                        {clientesFiltrados.map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => handleSelectClienteObj(c)}
                                                                className="w-full px-4 py-3 text-left text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center justify-between transition-colors"
                                                            >
                                                                <div>
                                                                    <span className="font-bold text-slate-900 dark:text-slate-100 block">{c.nombre}</span>
                                                                    {c.email && <span className="text-[10px] text-slate-400 block">{c.email}</span>}
                                                                </div>
                                                                {c.telefono && (
                                                                    <Badge variant="outline" className="text-purple-600 border-purple-200 font-mono text-[11px]">
                                                                        📞 {c.telefono}
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>


                                        </CardContent>
                                    </Card>

                                    {/* PASO 2 - 4: SELECCIÓN VISUAL DEL DISPOSITIVO */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                                <Smartphone className="w-4 h-4 text-purple-600" />
                                                {__('2. Tipo de Dispositivo')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-5">
                                            {/* SELECT CON BUSCADOR RÁPIDO PARA TIPO DE DISPOSITIVO (CATEGORÍAS) */}
                                            <div className="relative w-full">
                                                <Label className="text-xs font-semibold">{__('Seleccionar Categoría / Tipo de Dispositivo *')}</Label>
                                                <div className="relative mt-1">
                                                    <Layers className="w-4 h-4 absolute left-3 top-3.5 text-purple-600 z-10 pointer-events-none" />
                                                    <Input
                                                        value={isCategoriaDropdownOpen ? searchCategoriaTerm : data.tipo_dispositivo}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setSearchCategoriaTerm(val);
                                                            setData('tipo_dispositivo', val);
                                                            setIsCategoriaDropdownOpen(true);
                                                        }}
                                                        onFocus={() => {
                                                            setSearchCategoriaTerm(data.tipo_dispositivo || '');
                                                            setIsCategoriaDropdownOpen(true);
                                                        }}
                                                        placeholder={__('Escriba para buscar o seleccione una categoría...')}
                                                        className="text-xs h-11 pl-9 pr-8 font-medium"
                                                        required
                                                    />
                                                    {data.tipo_dispositivo && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchCategoriaTerm('');
                                                                setData('tipo_dispositivo', '');
                                                                setIsCategoriaDropdownOpen(false);
                                                            }}
                                                            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                                                            title={__('Limpiar selección')}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* RESULTADOS EN TIEMPO REAL / DROPDOWN LIST */}
                                                {isCategoriaDropdownOpen && (
                                                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
                                                        {categoriasFiltradas.length > 0 ? (
                                                            categoriasFiltradas.map((cat) => (
                                                                <button
                                                                    key={cat.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setData('tipo_dispositivo', cat.nombre);
                                                                        setSearchCategoriaTerm(cat.nombre);
                                                                        setIsCategoriaDropdownOpen(false);
                                                                    }}
                                                                    className={cn(
                                                                        'w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors',
                                                                        data.tipo_dispositivo === cat.nombre
                                                                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 font-bold'
                                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                                    )}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                                                                        {cat.nombre}
                                                                    </span>
                                                                    {data.tipo_dispositivo === cat.nombre && (
                                                                        <Check className="w-4 h-4 text-purple-600" />
                                                                    )}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-xs text-slate-400 text-center">
                                                                {__('No se encontraron categorías. Se usará el texto ingresado.')}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* MARCA & MODELO & IMEI */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                                {/* MARCA DE EQUIPO */}
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-semibold">{__('3. Marca del Equipo *')}</Label>
                                                        <Dialog open={openNewMarcaModal} onOpenChange={setOpenNewMarcaModal}>
                                                            <DialogTrigger asChild>
                                                                <button type="button" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                                                    <Plus className="w-3 h-3" />
                                                                    {__('Crear Marca')}
                                                                </button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                        <Tag className="w-5 h-5 text-purple-600" />
                                                                        {__('Crear Nueva Marca')}
                                                                    </DialogTitle>
                                                                </DialogHeader>

                                                                <div className="space-y-4 py-2">
                                                                    <div>
                                                                        <Label className="text-xs font-semibold">{__('Nombre de la Marca *')}</Label>
                                                                        <Input
                                                                            value={newMarcaNombre}
                                                                            onChange={(e) => setNewMarcaNombre(e.target.value)}
                                                                            placeholder={__('ej: OPPO, Honor, Realme, Xiaomi, Apple')}
                                                                            className="text-xs h-9 mt-1"
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewMarcaModal(false)} className="h-8 text-xs">
                                                                            {__('Cancelar')}
                                                                        </Button>
                                                                        <Button type="button" onClick={(e) => handleCreateNewMarca(e)} disabled={isCreatingMarca} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                                            {__('Guardar Marca')}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>

                                                    <Select value={data.marca_id} onValueChange={handleSelectMarca}>
                                                        <SelectTrigger className="text-xs h-10 mt-1">
                                                            <SelectValue placeholder={__('Seleccionar marca...')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {marcasList.map((m) => (
                                                                <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                                                                    {m.nombre}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* MODELO DE EQUIPO */}
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-semibold">{__('4. Modelo del Equipo *')}</Label>
                                                        <Dialog open={openNewModeloModal} onOpenChange={setOpenNewModeloModal}>
                                                            <DialogTrigger asChild>
                                                                <button type="button" className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                                                                    <Plus className="w-3 h-3" />
                                                                    {__('Crear Modelo')}
                                                                </button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-md">
                                                                <DialogHeader>
                                                                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                                        <Smartphone className="w-5 h-5 text-purple-600" />
                                                                        {__('Crear Nuevo Modelo')}
                                                                    </DialogTitle>
                                                                </DialogHeader>

                                                                <div className="space-y-4 py-2">
                                                                    <div>
                                                                        <Label className="text-xs font-semibold">{__('Marca Seleccionada')}</Label>
                                                                        <Input
                                                                            value={data.marca_nombre || __('Seleccione una marca primero')}
                                                                            disabled
                                                                            className="text-xs h-9 mt-1 bg-slate-100 dark:bg-slate-800"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-xs font-semibold">{__('Nombre Comercial del Modelo *')}</Label>
                                                                        <Input
                                                                            value={newModeloNombre}
                                                                            onChange={(e) => setNewModeloNombre(e.target.value)}
                                                                            placeholder={__('ej: Redmi Note 12 Pro / Reno 8 / Galaxy A54')}
                                                                            className="text-xs h-9 mt-1"
                                                                        />
                                                                    </div>

                                                                    <div>
                                                                        <Label className="text-xs font-semibold">{__('Código de Modelo (Opcional)')}</Label>
                                                                        <Input
                                                                            value={newModeloCodigo}
                                                                            onChange={(e) => setNewModeloCodigo(e.target.value)}
                                                                            placeholder={__('ej: SM-A546B / CPH2359')}
                                                                            className="text-xs h-9 mt-1 font-mono"
                                                                        />
                                                                    </div>

                                                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewModeloModal(false)} className="h-8 text-xs">
                                                                            {__('Cancelar')}
                                                                        </Button>
                                                                        <Button type="button" onClick={(e) => handleCreateNewModelo(e)} disabled={isCreatingModelo || (!selectedMarcaId && !data.marca_id)} size="sm" className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white">
                                                                            {__('Guardar Modelo')}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>

                                                    <Select value={data.modelo_id} onValueChange={handleSelectModelo} disabled={!selectedMarcaId}>
                                                        <SelectTrigger className="text-xs h-10 mt-1">
                                                            <SelectValue placeholder={!selectedMarcaId ? __('Seleccione una marca primero...') : __('Seleccionar modelo...')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {modelosFiltrados.map((mod) => (
                                                                <SelectItem key={mod.id} value={String(mod.id)} className="text-xs">
                                                                    {mod.nombre_comercial}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Color / Serie / IMEI')}</Label>
                                                    <Input
                                                        value={data.imei_serie}
                                                        onChange={(e) => setData('imei_serie', e.target.value)}
                                                        placeholder={__('IMEI (15 dígitos) o Serie')}
                                                        className="text-xs h-10 mt-1 font-mono"
                                                    />
                                                </div>
                                            </div>

                                            {/* PASO 5: DESCRIPCIÓN DE LA FALLA */}
                                            <div className="pt-2">
                                                <Label className="text-xs font-semibold">{__('5. Descripción de la Falla Reportada *')}</Label>
                                                <Textarea
                                                    value={data.descripcion_falla}
                                                    onChange={(e) => setData('descripcion_falla', e.target.value)}
                                                    placeholder={__('Describa en detalle qué problema presenta el dispositivo...')}
                                                    rows={3}
                                                    className="text-xs mt-1"
                                                    required
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() => setCurrentStep(2)}
                                            className="h-10 px-6 font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs"
                                        >
                                            {__('Siguiente: Presupuesto & Asignación')}
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 2: EVIDENCIAS FOTOGRÁFICAS */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* PASO 6: EVIDENCIAS FOTOGRÁFICAS (4 ÁNGULOS) */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                                <Camera className="w-4 h-4 text-purple-600" />
                                                {__('6. Evidencias Fotográficas del Equipo (4 Ángulos)')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            <p className="text-xs text-slate-500">
                                                {__('Tome o adjunte fotografías del equipo desde 4 ángulos clave para respaldar las condiciones físicas de recepción:')}
                                            </p>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { key: 'frente', label: '📱 1. Frente / Pantalla', desc: 'Display & Cristal' },
                                                    { key: 'trasero', label: '🔄 2. Tapa Trasera', desc: 'Módulo de Cámaras' },
                                                    { key: 'borde_sup', label: '📐 3. Borde Sup. / Izq.', desc: 'Bisel y Esquinas' },
                                                    { key: 'borde_inf', label: '🔌 4. Borde Inf. / Der.', desc: 'Puerto de Carga' },
                                                ].map((slot) => {
                                                    const fotoUrl = fotosState[slot.key];
                                                    return (
                                                        <div key={slot.key} className="flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 text-center">
                                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{slot.label}</span>
                                                            <span className="text-[10px] text-slate-400">{slot.desc}</span>

                                                            {fotoUrl ? (
                                                                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-purple-300 dark:border-purple-800">
                                                                    <img src={fotoUrl} alt={slot.label} className="w-full h-full object-cover" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveFoto(slot.key)}
                                                                        className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-full shadow hover:bg-rose-700 transition-colors"
                                                                        title={__('Eliminar foto')}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <label className="w-full h-32 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-purple-400 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center cursor-pointer transition-colors gap-1.5 p-2">
                                                                    <Camera className="w-6 h-6 text-purple-600" />
                                                                    <span className="text-[10px] font-bold text-purple-600">{__('Tomar / Adjuntar')}</span>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        capture="environment"
                                                                        className="hidden"
                                                                        onChange={(e) => handleFotoUpload(slot.key, e)}
                                                                    />
                                                                </label>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep(1)}
                                            className="h-10 px-5 text-xs font-bold gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            {__('Anterior')}
                                        </Button>

                                        <Button
                                            type="button"
                                            onClick={() => setCurrentStep(3)}
                                            className="h-10 px-6 font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs"
                                        >
                                            {__('Siguiente: Presupuesto & Asignación')}
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ETAPA 3: PRESUPUESTO & ASIGNACIÓN */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                                {__('7. Presupuesto, Adelanto y Técnico Asignado')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Costo Estimado (Total)')}</Label>
                                                    <div className="relative mt-1">
                                                        <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.costo_estimado}
                                                            onChange={(e) => setData('costo_estimado', e.target.value)}
                                                            className="text-xs h-10 pl-8 font-mono font-bold text-slate-900 dark:text-slate-100"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Anticipo / Adelanto Recibido')}</Label>
                                                    <div className="relative mt-1">
                                                        <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-emerald-600">{currencySymbol}</span>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.anticipo}
                                                            onChange={(e) => setData('anticipo', e.target.value)}
                                                            className="text-xs h-10 pl-8 font-mono font-bold text-emerald-600"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('Saldo Restante Pendiente')}</Label>
                                                    <div className="h-10 mt-1 px-3 border border-slate-200 dark:border-slate-700 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                                                        {currencySymbol}{saldoRestanteNum.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('8. Fecha Estimada de Entrega')}</Label>
                                                    <Input
                                                        type="date"
                                                        value={data.fecha_prometida}
                                                        onChange={(e) => setData('fecha_prometida', e.target.value)}
                                                        className="text-xs h-10 mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="text-xs font-semibold">{__('10. Técnico de Taller Asignado')}</Label>
                                                    <Select value={data.tecnico_id} onValueChange={(val) => setData('tecnico_id', val)}>
                                                        <SelectTrigger className="text-xs h-10 mt-1">
                                                            <SelectValue placeholder={__('Seleccionar técnico...')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {tecnicos.map((t) => (
                                                                <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                                                    🛠️ {t.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex items-center justify-between">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setCurrentStep(2)}
                                            className="h-10 px-5 text-xs font-bold gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            {__('Anterior')}
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="h-11 px-8 font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg gap-2 text-xs"
                                        >
                                            <Save className="w-4 h-4" />
                                            {__('FINALIZAR Y REGISTRAR ORDEN DE REPARACIÓN')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* COLUMNA DERECHA: TICKET Y RESUMEN EN VIVO (1 COLUMNA DE ANCHO) */}
                        <div className="space-y-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-md sticky top-6">
                                <CardHeader className="bg-slate-900 text-white py-3.5 rounded-t-xl">
                                    <CardTitle className="text-xs font-mono uppercase tracking-wider flex items-center justify-between">
                                        <span>🧾 Resumen de la Orden</span>
                                        <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">EN BORRADOR</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4 text-xs font-mono">
                                    <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Cliente:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{data.cliente_nombre || 'Sin Cliente'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Teléfono:</span>
                                            <span className="text-slate-700 dark:text-slate-300">{data.cliente_telefono || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Equipo:</span>
                                            <span className="font-bold text-purple-600 dark:text-purple-400 capitalize">{data.tipo_dispositivo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Marca/Modelo:</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{data.marca_nombre} {data.modelo_nombre}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">IMEI/Serie:</span>
                                            <span className="text-slate-700 dark:text-slate-300">{data.imei_serie || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>Presupuesto Total:</span>
                                            <span className="font-bold">{currencySymbol}{costoEstimadoNum.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Anticipo:</span>
                                            <span className="font-bold">-{currencySymbol}{anticipoNum.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <span>Saldo Pendiente:</span>
                                            <span className="text-emerald-600">{currencySymbol}{saldoRestanteNum.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 text-[10px] text-slate-400 font-sans italic text-center">
                                        {__('El ticket de recepción y QR de consulta se generarán automáticamente al guardar.')}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
