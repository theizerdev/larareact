import { Head, useForm, Link } from '@inertiajs/react';
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
} from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslate } from '@/hooks/use-translate';
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

interface Props {
    clientes: Cliente[];
    marcas: MarcaItem[];
    tecnicos: { id: number; name: string }[];
    currencySymbol: string;
}

export default function CreateReparacion({ clientes, marcas, tecnicos, currencySymbol }: Props) {
    const { __ } = useTranslate();

    // 12 Puntos de Inspección Física (de la imagen del usuario)
    const elementosInspeccion = [
        'Pantalla',
        'Cristal trasero',
        'Marco',
        'Botones',
        'Bandeja SIM',
        'Cámara trasera',
        'Cámara frontal',
        'Tornillos',
        'Tapa trasera',
        'Puerto de carga',
        'Humedad visible',
        'Equipo doblado',
    ];

    // Inicializar estado de Inspección Física
    const [inspeccionState, setInspeccionState] = useState<Record<string, { estado: 'bueno' | 'malo' | 'no_aplica'; obs: string }>>(
        elementosInspeccion.reduce((acc, el) => {
            acc[el] = { estado: 'bueno', obs: '' };
            return acc;
        }, {} as Record<string, { estado: 'bueno' | 'malo' | 'no_aplica'; obs: string }>)
    );

    // 5 Revisiones de Estado del Equipo (de la imagen del usuario)
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

    const [selectedMarcaId, setSelectedMarcaId] = useState<string>('');
    const [modelosFiltrados, setModelosFiltrados] = useState<ModeloItem[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        cliente_nombre: '',
        cliente_telefono: '',
        tipo_dispositivo: 'smartphone',
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
        fecha_prometida: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // +2 días por defecto
    });

    // Manejar selección de Cliente
    const handleSelectCliente = (clienteId: string) => {
        const c = clientes.find((item) => String(item.id) === clienteId);
        if (c) {
            setData((prev) => ({
                ...prev,
                cliente_id: String(c.id),
                cliente_nombre: c.nombre || '',
                cliente_telefono: c.telefono || '',
            }));
        }
    };

    // Manejar selección de Marca y filtrar Modelos
    const handleSelectMarca = (marcaId: string) => {
        const m = marcas.find((item) => String(item.id) === marcaId);
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
    const handleInspeccionChange = (elemento: string, estado: 'bueno' | 'malo' | 'no_aplica') => {
        setInspeccionState((prev) => ({
            ...prev,
            [elemento]: { ...prev[elemento], estado },
        }));
    };

    const handleInspeccionObsChange = (elemento: string, obs: string) => {
        setInspeccionState((prev) => ({
            ...prev,
            [elemento]: { ...prev[elemento], obs },
        }));
    };

    const costoEstimadoNum = Number(data.costo_estimado || 0);
    const anticipoNum = Number(data.anticipo || 0);
    const saldoRestanteNum = Math.max(0, costoEstimadoNum - anticipoNum);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Asignar inspección y estado formateados
        const payloadData = {
            ...data,
            inspeccion_fisica: inspeccionState,
            estado_equipo: estadoEquipoState,
            accesorios: accesoriosState,
        };

        post('/admin/reparaciones', {
            data: payloadData,
            onSuccess: () => notifySuccess(__('Orden de reparación recibida exitosamente.')),
            onError: () => notifyError(__('Por favor verifica los campos obligatorios.')),
        });
    };

    const breadcrumbs = [
        { title: __('Dashboard'), href: '/admin/dashboard' },
        { title: __('Servicio Técnico'), href: '/admin/reparaciones' },
        { title: __('Recepción de Equipo'), href: '#' },
    ];

    return (
        <>
            <Head title={__('Nueva Recepción de Equipo - Servicio Técnico')} />

            <div className="space-y-6 max-w-5xl mx-auto pb-12">
                <Breadcrumbs breadcrumbs={breadcrumbs} />

                <div className="flex items-center justify-between">
                    <ModuleHeader
                        title={__('Recepción de Equipo para Reparación')}
                        description={__('Proceso estandarizado de recepción de 11 pasos con inspección física y diagnóstico.')}
                        icon={<Wrench className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                    />
                    <Link href="/admin/reparaciones">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                            <ArrowLeft className="w-4 h-4" />
                            {__('Volver al Listado')}
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* PASO 1: DATOS DEL CLIENTE */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <User className="w-4 h-4 text-purple-600" />
                                {__('1. Búsqueda y Datos del Cliente')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">{__('Seleccionar Cliente Existente')}</Label>
                                    <Select onValueChange={handleSelectCliente}>
                                        <SelectTrigger className="text-xs h-9">
                                            <SelectValue placeholder={__('Buscar cliente...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clientes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                                                    {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">{__('Nombre del Cliente *')}</Label>
                                    <Input
                                        value={data.cliente_nombre}
                                        onChange={(e) => setData('cliente_nombre', e.target.value)}
                                        placeholder={__('Nombre y Apellido')}
                                        className="text-xs h-9"
                                        required
                                    />
                                    {errors.cliente_nombre && <p className="text-xs text-rose-500 mt-1">{errors.cliente_nombre}</p>}
                                </div>
                                <div>
                                    <Label className="text-xs">{__('Teléfono WhatsApp')}</Label>
                                    <Input
                                        value={data.cliente_telefono}
                                        onChange={(e) => setData('cliente_telefono', e.target.value)}
                                        placeholder={__('+58 412 0000000')}
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PASO 2 - 4: DATOS DEL DISPOSITIVO */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <Smartphone className="w-4 h-4 text-purple-600" />
                                {__('2 - 4. Identificación del Dispositivo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs">{__('2. Tipo de Dispositivo *')}</Label>
                                    <Select value={data.tipo_dispositivo} onValueChange={(val) => setData('tipo_dispositivo', val)}>
                                        <SelectTrigger className="text-xs h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smartphone">📱 Smartphone / Celular</SelectItem>
                                            <SelectItem value="laptop">💻 Laptop / Portátil</SelectItem>
                                            <SelectItem value="cpu">🖥️ CPU / Computadora Desktop</SelectItem>
                                            <SelectItem value="consola">🎮 Consola de Videojuegos</SelectItem>
                                            <SelectItem value="otro">🔌 Otro Dispositivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">{__('3. Marca *')}</Label>
                                    <Select onValueChange={handleSelectMarca}>
                                        <SelectTrigger className="text-xs h-9">
                                            <SelectValue placeholder={__('Seleccionar marca...')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {marcas.map((m) => (
                                                <SelectItem key={m.id} value={String(m.id)} className="text-xs">
                                                    {m.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!selectedMarcaId && (
                                        <Input
                                            value={data.marca_nombre}
                                            onChange={(e) => setData('marca_nombre', e.target.value)}
                                            placeholder={__('Escribir marca manual...')}
                                            className="text-xs h-9 mt-1.5"
                                            required
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs">{__('4. Modelo *')}</Label>
                                    {modelosFiltrados.length > 0 ? (
                                        <Select onValueChange={handleSelectModelo}>
                                            <SelectTrigger className="text-xs h-9">
                                                <SelectValue placeholder={__('Seleccionar modelo...')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {modelosFiltrados.map((mod) => (
                                                    <SelectItem key={mod.id} value={String(mod.id)} className="text-xs">
                                                        {mod.nombre_comercial}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={data.modelo_nombre}
                                            onChange={(e) => setData('modelo_nombre', e.target.value)}
                                            placeholder={__('ej: iPhone 13 Pro / Redmi Note 11')}
                                            className="text-xs h-9"
                                            required
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs">{__('Color / Serie / IMEI')}</Label>
                                    <Input
                                        value={data.imei_serie}
                                        onChange={(e) => setData('imei_serie', e.target.value)}
                                        placeholder={__('IMEI (15 dígitos) o Serie')}
                                        className="text-xs h-9 font-mono"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PASO 5 & 6 & 7: FALLA, INSPECCIÓN FÍSICA Y ESTADO */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <FileText className="w-4 h-4 text-purple-600" />
                                {__('5 - 7. Falla Reportada e Inspección Técnica')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">{__('5. Descripción de la Falla *')}</Label>
                                    <Textarea
                                        value={data.descripcion_falla}
                                        onChange={(e) => setData('descripcion_falla', e.target.value)}
                                        placeholder={__('¿Qué problema presenta el equipo? ¿Cómo o cuándo ocurrió?')}
                                        rows={3}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">{__('6. Observaciones Físicas Generales')}</Label>
                                    <Textarea
                                        value={data.observaciones_fisicas}
                                        onChange={(e) => setData('observaciones_fisicas', e.target.value)}
                                        placeholder={__('Rayones en pantalla, esquinas golpeadas, faltan tornillos, etc.')}
                                        rows={3}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* TABLA 1: INSPECCIÓN FÍSICA (12 ELEMENTOS) */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                    <span>{__('1. Inspección Física del Dispositivo')}</span>
                                    <span className="text-[11px] font-normal text-slate-500">{__('Marque el estado inicial de cada componente')}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-4 py-2">{__('Elemento')}</th>
                                                <th className="px-3 py-2 text-center w-20">{__('Bueno')}</th>
                                                <th className="px-3 py-2 text-center w-20">{__('Malo')}</th>
                                                <th className="px-3 py-2 text-center w-24">{__('No Aplica')}</th>
                                                <th className="px-4 py-2">{__('Observaciones')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {elementosInspeccion.map((el) => (
                                                <tr key={el} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{el}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`insp_${el}`}
                                                            checked={inspeccionState[el]?.estado === 'bueno'}
                                                            onChange={() => handleInspeccionChange(el, 'bueno')}
                                                            className="w-4 h-4 text-emerald-600 accent-emerald-600"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`insp_${el}`}
                                                            checked={inspeccionState[el]?.estado === 'malo'}
                                                            onChange={() => handleInspeccionChange(el, 'malo')}
                                                            className="w-4 h-4 text-rose-600 accent-rose-600"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="radio"
                                                            name={`insp_${el}`}
                                                            checked={inspeccionState[el]?.estado === 'no_aplica'}
                                                            onChange={() => handleInspeccionChange(el, 'no_aplica')}
                                                            className="w-4 h-4 text-slate-400 accent-slate-400"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-1.5">
                                                        <input
                                                            type="text"
                                                            value={inspeccionState[el]?.obs || ''}
                                                            onChange={(e) => handleInspeccionObsChange(el, e.target.value)}
                                                            placeholder={__('Detalle opcional...')}
                                                            className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* TABLA 2: ESTADO DEL EQUIPO (5 REVISIONES) */}
                            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                                    <span>{__('2. Estado Operativo del Equipo & Bloqueos')}</span>
                                </div>
                                <div className="p-4 space-y-3 bg-white dark:bg-slate-950">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                        {[
                                            { key: 'enciende', label: '¿Enciende?' },
                                            { key: 'carga_bateria', label: '¿Carga batería?' },
                                            { key: 'entra_sistema', label: '¿Entra al sistema?' },
                                            { key: 'tiene_bloqueo', label: '¿Tiene bloqueo?' },
                                            { key: 'proporciona_contrasena', label: '¿Cliente proporciona contraseña?' },
                                        ].map((rev) => (
                                            <div key={rev.key} className="flex items-center justify-between p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{rev.label}</span>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`rev_${rev.key}`}
                                                            checked={(estadoEquipoState as any)[rev.key] === 'si'}
                                                            onChange={() => setEstadoEquipoState((prev) => ({ ...prev, [rev.key]: 'si' }))}
                                                            className="text-emerald-600 accent-emerald-600"
                                                        />
                                                        <span className="font-bold text-emerald-700">Sí</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={`rev_${rev.key}`}
                                                            checked={(estadoEquipoState as any)[rev.key] === 'no'}
                                                            onChange={() => setEstadoEquipoState((prev) => ({ ...prev, [rev.key]: 'no' }))}
                                                            className="text-rose-600 accent-rose-600"
                                                        />
                                                        <span className="font-bold text-rose-700">No</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* PASO 7: CONTRASEÑA O PATRÓN */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {__('7. Contraseña, PIN o Patrón de Desbloqueo')}
                                        </Label>
                                        <Input
                                            value={data.contrasena_patron}
                                            onChange={(e) => setData('contrasena_patron', e.target.value)}
                                            placeholder={__('ej: PIN 1234 / Patrón L / Contraseña del equipo')}
                                            className="text-xs h-9 mt-1 max-w-md font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PASO 8 & 9 & 10: COSTO, ADELANTO, FECHA Y TÉCNICO */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                                <DollarSign className="w-4 h-4 text-purple-600" />
                                {__('8 - 10. Presupuesto, Anticipo y Asignación')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-xs">{__('8. Costo Estimado (') + currencySymbol + ')'}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.costo_estimado}
                                        onChange={(e) => setData('costo_estimado', e.target.value)}
                                        className="text-xs h-9 font-mono font-bold text-slate-900 dark:text-slate-100"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">{__('Anticipo / Adelanto (') + currencySymbol + ')'}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.anticipo}
                                        onChange={(e) => setData('anticipo', e.target.value)}
                                        className="text-xs h-9 font-mono text-emerald-600 font-bold"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">{__('Saldo Restante (') + currencySymbol + ')'}</Label>
                                    <div className="h-9 px-3 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 flex items-center font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                        {currencySymbol}{saldoRestanteNum.toFixed(2)}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">{__('9. Fecha Estimada de Entrega')}</Label>
                                    <Input
                                        type="date"
                                        value={data.fecha_prometida}
                                        onChange={(e) => setData('fecha_prometida', e.target.value)}
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">{__('10. Asignar Técnico de Taller')}</Label>
                                    <Select value={data.tecnico_id} onValueChange={(val) => setData('tecnico_id', val)}>
                                        <SelectTrigger className="text-xs h-9">
                                            <SelectValue placeholder={__('Seleccionar técnico asignado...')} />
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

                                <div>
                                    <Label className="text-xs">{__('Días de Garantía')}</Label>
                                    <Input
                                        type="number"
                                        value={data.garantia_dias}
                                        onChange={(e) => setData('garantia_dias', e.target.value)}
                                        placeholder="30"
                                        className="text-xs h-9 max-w-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOTÓN GUARDAR */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/admin/reparaciones">
                            <Button type="button" variant="outline" className="h-10 text-xs">
                                {__('Cancelar')}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-6 font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md gap-2 text-xs"
                        >
                            <Save className="w-4 h-4" />
                            {__('Guardar y Generar Orden de Reparación')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
