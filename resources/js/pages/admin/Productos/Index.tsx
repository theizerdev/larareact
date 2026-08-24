import { Head, useForm, router } from '@inertiajs/react';
import SpecEditor from '@/components/spec-editor';
import SearchableSelect from '@/components/searchable-select';
import {
    Package,
    Plus,
    CheckCircle,
    XCircle,
    MoreVertical,
    Pencil,
    Trash2,
    SlidersHorizontal,
    Boxes,
    AlertTriangle,
    DollarSign,
    Tag,
    BadgePercent,
    Layers,
    Info,
    FileText,
    FolderTree,
    Smartphone,
    Receipt,
    FileCheck,
    Scale,
    Percent,
    Wrench,
    ShoppingCart,
    Zap,
    TrendingDown,
    BarChart3,
    Archive,
    Hash,
    ChevronRight,
    Box,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { ColumnDef } from '@/components/data-table';
import { DataTable } from '@/components/data-table';
import { FilterBar, FilterField } from '@/components/filter-bar';
import { ModuleHeader } from '@/components/module-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cleanParams, cn } from '@/lib/utils';
import type { Paginated } from '@/types/app';
import { notifySuccess, notifyError } from '@/utils/notifications';

interface Option {
    id: number;
    nombre: string;
    marca_id?: number;
    categoria_id?: number;
    specs_json?: Record<string, string>;
}

interface ModeloOption {
    id: number;
    nombre: string;
    nombre_comercial: string;
    codigo_modelo?: string;
    marca_id: number;
    familia_id: number;
    categoria_id: number;
    marca: string;
    familia: string;
    categoria: string;
    specs_json?: Record<string, string>;
}

interface Producto {
    id: number;
    modelo_id?: number | null;
    categoria_id?: number | null;
    marca_id?: number | null;
    empresa_id: number;
    sucursal_id: number;
    sku: string;
    codigo_barras?: string;
    nombre_variante: string;
    condicion: 'nuevo' | 'usado' | 'reacondicionado' | 'repuesto';
    tipo_producto?: 'venta' | 'repuesto' | 'servicio';
    tipo_venta: 'unidad' | 'granel' | 'paquete';
    usa_inventario: boolean;
    variant_specs?: Record<string, string>;
    specs_completas?: Record<string, string>;
    precio_compra: number;
    precio_venta: number;
    precio_mayoreo: number;
    stock: number;
    stock_minimo: number;
    tipo_impuesto: 'gravado' | 'exento' | 'tasa_cero';
    tasa_iva: number;
    aplica_impuesto_adicional: boolean;
    tasa_impuesto_adicional: number;
    aplica_retencion: boolean;
    tasa_retencion: number;
    precio_incluye_impuestos: boolean;
    clave_sat_producto?: string;
    clave_sat_unidad?: string;
    objeto_impuesto_sat?: string;
    estado: boolean;
    modelo?: {
        id: number;
        nombre_comercial: string;
        codigo_modelo?: string;
        marca_id?: number;
        familia_id?: number;
        categoria_id?: number;
        marca?: { id: number; nombre: string };
        familia?: { id: number; nombre: string; specs_json?: Record<string, string> };
        categoria?: { id: number; nombre: string };
        specs_overrides?: Record<string, string>;
    };
    // Relaciones directas del producto (para repuestos sin modelo)
    marca?: { id: number; nombre: string } | null;
    categoria?: { id: number; nombre: string } | null;
    familia?: { id: number; nombre: string } | null;
}

interface Props {
    productos: Paginated<Producto>;
    categorias: Option[];
    marcas: Option[];
    familias: Option[];
    modelos: ModeloOption[];
    filters: {
        search?: string;
        modelo_id?: string;
        condicion?: string;
        tipo_producto?: string;
        sortBy?: string;
        sortDir?: string;
        perPage?: string;
    };
    stats: {
        totalProductos: number;
        stockTotal: number;
        stockBajoCount: number;
        valorInventario: number;
        tipoCounts?: {
            todos: number;
            venta: number;
            repuesto: number;
            servicio: number;
        };
    };
}

export default function Index({ productos, categorias: categoriasProp, marcas: marcasProp, familias: familiasProp, modelos: modelosProp, filters, stats }: Props) {
    const { __ } = useTranslate();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('general');
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

    // Filtro por tipo de producto en tabla
    const [tipoProductoFilter, setTipoProductoFilter] = useState<string>(filters.tipo_producto || 'all');
    const [modeloFilter, setModeloFilter] = useState<string>(filters.modelo_id || 'all');
    const [condicionFilter, setCondicionFilter] = useState<string>(filters.condicion || 'all');

    // Estados dinámicos para mantener listas actualizadas al crear sub-elementos en caliente
    const [categorias, setCategorias] = useState<Option[]>(categoriasProp);
    const [marcas, setMarcas] = useState<Option[]>(marcasProp);
    const [familias, setFamilias] = useState<Option[]>(familiasProp);
    const [modelos, setModelos] = useState<ModeloOption[]>(modelosProp);

    useEffect(() => { setCategorias(categoriasProp); }, [categoriasProp]);
    useEffect(() => { setMarcas(marcasProp); }, [marcasProp]);
    useEffect(() => { setFamilias(familiasProp); }, [familiasProp]);
    useEffect(() => { setModelos(modelosProp); }, [modelosProp]);

    // Filtros de cascada locales en el formulario de creación/edición
    const [selCategoriaId, setSelCategoriaId] = useState<string>('all');
    const [selMarcaId, setSelMarcaId] = useState<string>('all');
    const [selFamiliaId, setSelFamiliaId] = useState<string>('all');

    // Sync local cascade selectors into Inertia form data so they are sent to the backend
    useEffect(() => {
        setData((prev) => ({ ...prev, categoria_id: selCategoriaId !== 'all' ? selCategoriaId : '' }));
    }, [selCategoriaId]);
    useEffect(() => {
        setData((prev) => ({ ...prev, marca_id: selMarcaId !== 'all' ? selMarcaId : '' }));
    }, [selMarcaId]);

    // Sub-creaciones rápidas en caliente (Modales Inline)
    const [isNewCategoriaOpen, setIsNewCategoriaOpen] = useState(false);
    const [newCategoriaNombre, setNewCategoriaNombre] = useState('');
    const [isSavingCategoria, setIsSavingCategoria] = useState(false);

    const [isNewMarcaOpen, setIsNewMarcaOpen] = useState(false);
    const [newMarcaNombre, setNewMarcaNombre] = useState('');
    const [isSavingMarca, setIsSavingMarca] = useState(false);

    const [isNewFamiliaOpen, setIsNewFamiliaOpen] = useState(false);
    const [newFamiliaNombre, setNewFamiliaNombre] = useState('');
    const [isSavingFamilia, setIsSavingFamilia] = useState(false);

    const [isNewModeloOpen, setIsNewModeloOpen] = useState(false);
    const [newModeloNombre, setNewModeloNombre] = useState('');
    const [newModeloCodigo, setNewModeloCodigo] = useState('');
    const [isSavingModelo, setIsSavingModelo] = useState(false);

    // Modal de Edición Rápida de Especificaciones del Producto
    const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
    const [specsTargetProducto, setSpecsTargetProducto] = useState<Producto | null>(null);
    const [modalSpecs, setModalSpecs] = useState<Record<string, string>>({});
    const [isSavingSpecs, setIsSavingSpecs] = useState(false);

    // Filtros de tabla
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    // Inertia Form
    const { data, setData, post, put, processing, errors, reset } = useForm({
        modelo_id: '',
        categoria_id: '',
        marca_id: '',
        sku: '',
        codigo_barras: '',
        nombre_variante: '',
        condicion: 'nuevo',
        tipo_producto: 'venta',
        tipo_venta: 'unidad',
        usa_inventario: true,
        variant_specs: {} as Record<string, string>,
        precio_compra: '',
        precio_venta: '',
        precio_mayoreo: '',
        stock: '' as unknown as number,
        stock_minimo: 2,
        tipo_impuesto: 'gravado',
        tasa_iva: '16.00',
        aplica_impuesto_adicional: false,
        tasa_impuesto_adicional: '0.00',
        aplica_retencion: false,
        tasa_retencion: '0.00',
        precio_incluye_impuestos: true,
        clave_sat_producto: '43191501',
        clave_sat_unidad: 'H87',
        objeto_impuesto_sat: '02',
        estado: true,
    });

    const handleMarcaSelect = (val: string) => {
        setSelMarcaId(val);
    };

    const handleCategoriaSelect = (val: string) => {
        setSelCategoriaId(val);
    };

    // Modelos filtrados en cascada según Categoría, Marca y Familia seleccionadas
    const filteredModelos = modelos.filter((m) => {
        if (selMarcaId !== 'all' && String(m.marca_id) !== String(selMarcaId)) return false;
        if (selCategoriaId !== 'all' && m.categoria_id && String(m.categoria_id) !== String(selCategoriaId)) return false;
        if (selFamiliaId !== 'all' && m.familia_id && String(m.familia_id) !== String(selFamiliaId)) return false;
        return true;
    });

    const filteredFamilias = familias.filter((f) => {
        if (selCategoriaId !== 'all' && f.categoria_id && String(f.categoria_id) !== selCategoriaId) return false;
        if (selMarcaId !== 'all' && f.marca_id && String(f.marca_id) !== selMarcaId) return false;
        return true;
    });

    const handleFilter = (customTipo?: string) => {
        const targetTipo = customTipo !== undefined ? customTipo : tipoProductoFilter;
        router.get(
            '/admin/productos',
            cleanParams({
                search: searchTerm,
                modelo_id: modeloFilter === 'all' ? undefined : modeloFilter,
                condicion: condicionFilter === 'all' ? undefined : condicionFilter,
                tipo_producto: targetTipo === 'all' ? undefined : targetTipo,
            }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setModeloFilter('all');
        setCondicionFilter('all');
        setTipoProductoFilter('all');
        router.get('/admin/productos', {}, { preserveState: true, preserveScroll: true });
    };

    const handleCreate = () => {
        setEditingProducto(null);
        reset();
        setData((prev) => ({
            ...prev,
            stock: 0,
            stock_minimo: 2,
        }));
        setSelCategoriaId('all');
        setSelMarcaId('all');
        setSelFamiliaId('all');
        setActiveTab('general');
        setIsCreateOpen(true);
    };

    const handleEdit = (prod: Producto) => {
        setEditingProducto(prod);

        // Determine categoria/marca from model or directly from product
        const catId = prod.modelo?.categoria_id ? String(prod.modelo.categoria_id) : (prod.categoria_id ? String(prod.categoria_id) : 'all');
        const marcaId = prod.modelo?.marca_id ? String(prod.modelo.marca_id) : (prod.marca_id ? String(prod.marca_id) : 'all');
        const familiaId = prod.modelo?.familia_id ? String(prod.modelo.familia_id) : 'all';

        setSelCategoriaId(catId);
        setSelMarcaId(marcaId);
        setSelFamiliaId(familiaId);

        setData({
            modelo_id: prod.modelo_id ? String(prod.modelo_id) : '',
            categoria_id: catId !== 'all' ? catId : '',
            marca_id: marcaId !== 'all' ? marcaId : '',
            sku: prod.sku,
            codigo_barras: prod.codigo_barras || '',
            nombre_variante: prod.nombre_variante,
            condicion: prod.condicion,
            tipo_producto: prod.tipo_producto || (prod.condicion === 'repuesto' ? 'repuesto' : 'venta'),
            tipo_venta: prod.tipo_venta || 'unidad',
            usa_inventario: prod.usa_inventario ?? true,
            variant_specs: prod.variant_specs || {},
            precio_compra: String(prod.precio_compra),
            precio_venta: String(prod.precio_venta),
            precio_mayoreo: String(prod.precio_mayoreo || '0.00'),
            stock: prod.stock,
            stock_minimo: prod.stock_minimo,
            tipo_impuesto: prod.tipo_impuesto || 'gravado',
            tasa_iva: String(prod.tasa_iva ?? '16.00'),
            aplica_impuesto_adicional: prod.aplica_impuesto_adicional ?? false,
            tasa_impuesto_adicional: String(prod.tasa_impuesto_adicional ?? '0.00'),
            aplica_retencion: prod.aplica_retencion ?? false,
            tasa_retencion: String(prod.tasa_retencion ?? '0.00'),
            precio_incluye_impuestos: prod.precio_incluye_impuestos ?? true,
            clave_sat_producto: prod.clave_sat_producto || '43191501',
            clave_sat_unidad: prod.clave_sat_unidad || 'H87',
            objeto_impuesto_sat: prod.objeto_impuesto_sat || '02',
            estado: prod.estado,
        });

        setActiveTab('general');
        setIsCreateOpen(true);
    };

    const generateSkuSuggestion = (mod: ModeloOption | undefined, nombreProducto: string, codigoBarras?: string) => {
        const cleanName = (nombreProducto || mod?.nombre || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .toUpperCase();

        const rawCode = codigoBarras?.trim() || mod?.codigo_modelo || (mod ? `MOD${mod.id}` : '');
        const cleanCode = rawCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        if (cleanCode && cleanName) {
            return `${cleanCode}-${cleanName}`;
        }
        return cleanName || cleanCode || 'SKU-PROD';
    };

    const handleSelectModelo = (modeloId: string, customModelosList?: ModeloOption[]) => {
        const list = customModelosList || modelos;
        const mod = list.find((m) => String(m.id) === modeloId);
        if (!mod) return;

        if (mod.categoria_id) setSelCategoriaId(String(mod.categoria_id));
        if (mod.marca_id) setSelMarcaId(String(mod.marca_id));
        if (mod.familia_id) setSelFamiliaId(String(mod.familia_id));

        let nombre = mod.nombre;
        const subSpecs = Object.values(data.variant_specs || {});

        if (subSpecs.length > 0) {
            nombre += ` (${subSpecs.slice(0, 3).join(' / ')})`;
        }

        const newSku = generateSkuSuggestion(mod, nombre, data.codigo_barras);

        setData((prev) => ({
            ...prev,
            modelo_id: modeloId,
            nombre_variante: nombre,
            sku: newSku,
        }));
    };

    const handleQuickCreateCategoria = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newCategoriaNombre.trim();
        if (!nombreTarget) return;

        setIsSavingCategoria(true);
        router.post(
            '/admin/categorias',
            { nombre: nombreTarget, estado: true },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Categoría creada correctamente.'));
                    setIsNewCategoriaOpen(false);
                    setNewCategoriaNombre('');

                    const catsUpdated = (page.props as any)?.categorias as Option[] || [];
                    setCategorias(catsUpdated);

                    const creada = catsUpdated.find((c) => c.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || catsUpdated[catsUpdated.length - 1];
                    if (creada) {
                        setSelCategoriaId(String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la categoría.')),
                onFinish: () => setIsSavingCategoria(false),
            }
        );
    };

    const handleQuickCreateMarca = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newMarcaNombre.trim();
        if (!nombreTarget) return;

        setIsSavingMarca(true);
        router.post(
            '/admin/marcas',
            { nombre: nombreTarget, estado: true },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Marca creada correctamente.'));
                    setIsNewMarcaOpen(false);
                    setNewMarcaNombre('');

                    const marcasUpdated = (page.props as any)?.marcas as Option[] || [];
                    setMarcas(marcasUpdated);

                    const creada = marcasUpdated.find((m) => m.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || marcasUpdated[marcasUpdated.length - 1];
                    if (creada) {
                        setSelMarcaId(String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la marca.')),
                onFinish: () => setIsSavingMarca(false),
            }
        );
    };

    const handleQuickCreateFamilia = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newFamiliaNombre.trim();
        if (!nombreTarget) return;

        const marcaTargetId = selMarcaId !== 'all' ? selMarcaId : (marcas[0]?.id ? String(marcas[0].id) : '');
        if (!marcaTargetId) {
            notifyError(__('Selecciona o crea una marca primero.'));
            return;
        }

        setIsSavingFamilia(true);
        router.post(
            '/admin/familias',
            {
                nombre: nombreTarget,
                marca_id: marcaTargetId,
                categoria_id: selCategoriaId !== 'all' ? selCategoriaId : null,
                estado: true,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Familia creada correctamente.'));
                    setIsNewFamiliaOpen(false);
                    setNewFamiliaNombre('');

                    const familiasUpdated = (page.props as any)?.familias as Option[] || [];
                    setFamilias(familiasUpdated);

                    const creada = familiasUpdated.find((f) => f.nombre.toLowerCase() === nombreTarget.toLowerCase())
                        || familiasUpdated[familiasUpdated.length - 1];
                    if (creada) {
                        setSelFamiliaId(String(creada.id));
                    }
                },
                onError: () => notifyError(__('Error al crear la familia.')),
                onFinish: () => setIsSavingFamilia(false),
            }
        );
    };

    const handleQuickCreateModelo = (e: React.FormEvent) => {
        e.preventDefault();
        const nombreTarget = newModeloNombre.trim();
        if (!nombreTarget) return;

        const marcaTargetId = selMarcaId !== 'all' ? selMarcaId : (marcas[0]?.id ? String(marcas[0].id) : '');
        const familiaTargetId = selFamiliaId !== 'all' ? selFamiliaId : (familias[0]?.id ? String(familias[0].id) : '1');
        const categoriaTargetId = selCategoriaId !== 'all' ? selCategoriaId : (categorias[0]?.id ? String(categorias[0].id) : '');

        if (!marcaTargetId) {
            notifyError(__('Debes tener seleccionada una marca para crear el modelo.'));
            return;
        }

        setIsSavingModelo(true);
        router.post(
            '/admin/modelos',
            {
                nombre_comercial: nombreTarget,
                codigo_modelo: newModeloCodigo.trim() || null,
                marca_id: marcaTargetId,
                familia_id: familiaTargetId,
                categoria_id: categoriaTargetId || null,
                estado: true,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    notifySuccess(__('Modelo creado correctamente.'));
                    setIsNewModeloOpen(false);
                    setNewModeloNombre('');
                    setNewModeloCodigo('');

                    const modelosUpdated = (page.props as any)?.modelos as ModeloOption[] || [];
                    setModelos(modelosUpdated);

                    const creado = modelosUpdated.find((m) => m.nombre_comercial.toLowerCase() === nombreTarget.toLowerCase())
                        || modelosUpdated[modelosUpdated.length - 1];
                    if (creado) {
                        handleSelectModelo(String(creado.id), modelosUpdated);
                    }
                },
                onError: () => notifyError(__('Error al crear el modelo.')),
                onFinish: () => setIsSavingModelo(false),
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const pCompra = parseFloat(data.precio_compra);
        if (isNaN(pCompra) || pCompra <= 0) {
            notifyError(__('El precio de compra (costo) debe ser un monto válido mayor a 0.00.'));
            return;
        }

        const pVenta = parseFloat(data.precio_venta);
        if (isNaN(pVenta) || pVenta <= 0) {
            notifyError(__('El precio de venta (minorista) debe ser un monto válido mayor a 0.00.'));
            return;
        }

        if (data.precio_mayoreo && parseFloat(data.precio_mayoreo) < 0) {
            notifyError(__('El precio de mayoreo no puede ser negativo.'));
            return;
        }

        // For repuestos, modelo_id is optional but nombre_variante is required
        if (data.tipo_producto === 'repuesto' && !data.nombre_variante.trim()) {
            notifyError(__('El nombre del repuesto es obligatorio.'));
            return;
        }

        // For non-repuesto products, modelo_id is required
        if (data.tipo_producto !== 'repuesto' && !data.modelo_id) {
            notifyError(__('Debe seleccionar el modelo del equipo.'));
            return;
        }

        if (editingProducto) {
            put(`/admin/productos/${editingProducto.id}`, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Producto actualizado correctamente.'));
                },
                onError: () => notifyError(__('Error al actualizar el producto.')),
            });
        } else {
            post('/admin/productos', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    notifySuccess(__('Producto creado correctamente.'));
                },
                onError: () => notifyError(__('Error al crear el producto.')),
            });
        }
    };

    const handleDelete = (prod: Producto) => {
        if (confirm(__('¿Estás seguro de eliminar este producto del inventario?'))) {
            router.delete(`/admin/productos/${prod.id}`, {
                onSuccess: () => notifySuccess(__('Producto eliminado correctamente.')),
                onError: () => notifyError(__('Error al eliminar el producto.')),
            });
        }
    };

    const handleOpenSpecsModal = (prod: Producto) => {
        setSpecsTargetProducto(prod);
        setModalSpecs(prod.variant_specs || {});
        setIsSpecsModalOpen(true);
    };

    const handleSaveQuickSpecs = (e: React.FormEvent) => {
        e.preventDefault();
        if (!specsTargetProducto) return;

        setIsSavingSpecs(true);
        router.put(
            `/admin/productos/${specsTargetProducto.id}`,
            {
                modelo_id: String(specsTargetProducto.modelo_id),
                sku: specsTargetProducto.sku,
                codigo_barras: specsTargetProducto.codigo_barras || '',
                nombre_variante: specsTargetProducto.nombre_variante,
                condicion: specsTargetProducto.condicion,
                tipo_venta: specsTargetProducto.tipo_venta,
                usa_inventario: specsTargetProducto.usa_inventario,
                precio_compra: String(specsTargetProducto.precio_compra),
                precio_venta: String(specsTargetProducto.precio_venta),
                precio_mayoreo: String(specsTargetProducto.precio_mayoreo || 0),
                stock: specsTargetProducto.stock,
                stock_minimo: specsTargetProducto.stock_minimo,
                tipo_impuesto: specsTargetProducto.tipo_impuesto,
                tasa_iva: String(specsTargetProducto.tasa_iva),
                aplica_impuesto_adicional: specsTargetProducto.aplica_impuesto_adicional,
                tasa_impuesto_adicional: String(specsTargetProducto.tasa_impuesto_adicional),
                aplica_retencion: specsTargetProducto.aplica_retencion,
                tasa_retencion: String(specsTargetProducto.tasa_retencion),
                precio_incluye_impuestos: specsTargetProducto.precio_incluye_impuestos,
                clave_sat_producto: specsTargetProducto.clave_sat_producto,
                clave_sat_unidad: specsTargetProducto.clave_sat_unidad,
                objeto_impuesto_sat: specsTargetProducto.objeto_impuesto_sat,
                estado: specsTargetProducto.estado,
                variant_specs: modalSpecs,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    notifySuccess(__('Especificaciones actualizadas correctamente.'));
                    setIsSpecsModalOpen(false);
                    setSpecsTargetProducto(null);
                },
                onError: () => notifyError(__('Error al actualizar las especificaciones.')),
                onFinish: () => setIsSavingSpecs(false),
            }
        );
    };

    const getTypeConfig = (prod: Producto) => {
        const tipo = prod.tipo_producto || (prod.condicion === 'repuesto' ? 'repuesto' : 'venta');
        if (tipo === 'repuesto') return {
            label: __('Repuesto'),
            icon: <Wrench className="h-3 w-3" />,
            className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
            dot: 'bg-violet-500',
        };
        if (tipo === 'servicio') return {
            label: __('Servicio'),
            icon: <Zap className="h-3 w-3" />,
            className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
            dot: 'bg-amber-500',
        };
        return {
            label: __('Venta POS'),
            icon: <ShoppingCart className="h-3 w-3" />,
            className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
            dot: 'bg-blue-500',
        };
    };

    const getCondicionConfig = (condicion: string) => {
        const map: Record<string, { label: string; color: string }> = {
            nuevo: { label: __('Nuevo'), color: 'text-emerald-600 dark:text-emerald-400' },
            usado: { label: __('Usado'), color: 'text-orange-500 dark:text-orange-400' },
            reacondicionado: { label: __('Reacond.'), color: 'text-blue-500 dark:text-blue-400' },
            repuesto: { label: __('Repuesto'), color: 'text-violet-500 dark:text-violet-400' },
        };
        return map[condicion] || { label: condicion, color: 'text-slate-500' };
    };

    const columns: ColumnDef<Producto>[] = [
        {
            header: __('Producto'),
            cell: (prod) => {
                const typeConfig = getTypeConfig(prod);
                const condConfig = getCondicionConfig(prod.condicion);
                return (
                    <div className="flex items-start gap-3 min-w-0 py-0.5">
                        {/* Icono tipo */}
                        <div className={cn(
                            "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border",
                            prod.tipo_producto === 'repuesto' || prod.condicion === 'repuesto'
                                ? 'bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-800'
                                : prod.tipo_producto === 'servicio'
                                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800'
                        )}>
                            {prod.tipo_producto === 'repuesto' || prod.condicion === 'repuesto'
                                ? <Wrench className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                : prod.tipo_producto === 'servicio'
                                    ? <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    : <Box className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            {/* Nombre */}
                            <span
                                className="font-semibold text-[13px] text-slate-900 dark:text-slate-100 leading-tight truncate"
                                title={prod.nombre_variante}
                            >
                                {prod.nombre_variante}
                            </span>

                            {/* SKU + badges */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                    <Hash className="h-2.5 w-2.5" />
                                    {prod.sku}
                                </span>
                                <span className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                                    typeConfig.className
                                )}>
                                    {typeConfig.icon}
                                    {typeConfig.label}
                                </span>
                                <span className={cn('text-[10px] font-medium capitalize', condConfig.color)}>
                                    • {condConfig.label}
                                </span>
                                {!prod.estado && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900 px-1.5 py-0.5 rounded">
                                        <XCircle className="h-2.5 w-2.5" />
                                        {__('Inactivo')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            header: __('Catálogo'),
            cell: (prod) => {
                const modelName = prod.modelo?.nombre_comercial;
                const brandName = prod.modelo?.marca?.nombre || prod.marca?.nombre;
                const catName = prod.modelo?.categoria?.nombre || prod.categoria?.nombre;
                return (
                    <div className="flex flex-col gap-1">
                        {modelName ? (
                            <div className="flex items-center gap-1.5">
                                <Smartphone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={modelName}>
                                    {modelName}
                                </span>
                            </div>
                        ) : (
                            <span className="text-[11px] italic text-slate-400">{__('Sin modelo')}</span>
                        )}
                        <div className="flex flex-wrap items-center gap-1">
                            {brandName && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
                                    {brandName}
                                </span>
                            )}
                            {catName && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                    {catName}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: __('Precios'),
            cell: (prod) => (
                <div className="flex flex-col gap-1 min-w-[110px]">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">PVP</span>
                        <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                            ${Number(prod.precio_venta).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {prod.precio_mayoreo > 0 && (
                        <div className="flex items-center gap-1">
                            <BadgePercent className="h-3 w-3 text-violet-400" />
                            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                                ${Number(prod.precio_mayoreo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-slate-400">{__('mayor.')}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wide">{__('costo')}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ${Number(prod.precio_compra).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            header: __('Stock'),
            cell: (prod) => {
                if (!prod.usa_inventario) {
                    return (
                        <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                <Archive className="h-3 w-3" />
                                {__('Intangible')}
                            </span>
                            <span className="text-[9px] text-slate-400">{__('Sin control de stock')}</span>
                        </div>
                    );
                }

                const pct = prod.stock_minimo > 0
                    ? Math.min(100, Math.round((prod.stock / (prod.stock_minimo * 3)) * 100))
                    : 100;
                const isLow = prod.stock <= prod.stock_minimo;
                const isEmpty = prod.stock === 0;

                return (
                    <div className="flex flex-col gap-1.5 min-w-[90px]">
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                'text-[13px] font-bold leading-none',
                                isEmpty ? 'text-rose-600 dark:text-rose-400'
                                    : isLow ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-800 dark:text-slate-200'
                            )}>
                                {Number(prod.stock).toLocaleString('es-AR')}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase">
                                {prod.tipo_venta === 'granel' ? 'kg' : 'u.'}
                            </span>
                        </div>

                        {/* Barra de stock */}
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    isEmpty ? 'bg-rose-500'
                                        : isLow ? 'bg-amber-400'
                                            : 'bg-emerald-500'
                                )}
                                style={{ width: `${Math.max(2, pct)}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-1">
                            {isEmpty ? (
                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide">{__('Agotado')}</span>
                            ) : isLow ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                                    <TrendingDown className="h-2.5 w-2.5" />
                                    {__('Stock bajo')}
                                </span>
                            ) : (
                                <span className="text-[9px] text-slate-400">{__('mín.')} {prod.stock_minimo}</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: __('Acciones'),
            stopRowClick: true,
            cell: (prod) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handleEdit(prod)}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                            {__('Editar Producto')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleOpenSpecsModal(prod); }}
                        >
                            <SlidersHorizontal className="mr-2 h-4 w-4 text-indigo-500" />
                            {__('Ver Especificaciones')}
                            {Object.keys(prod.variant_specs || {}).length > 0 && (
                                <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                                    {Object.keys(prod.variant_specs || {}).length}
                                </span>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(prod)}
                            className="text-rose-600 dark:text-rose-400 focus:text-rose-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {__('Eliminar')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const breadcrumbs = [
        { title: __('Inicio'), href: '/dashboard' },
        { title: __('Inventario'), href: '/admin/productos' },
        { title: __('Productos & Variantes') },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'tipo_producto',
            label: __('Tipo de Inventario'),
            type: 'select',
            options: [
                { label: __('Todos los tipos'), value: 'all' },
                { label: __('🛍️ Productos Venta (POS)'), value: 'venta' },
                { label: __('🛠️ Repuestos Taller'), value: 'repuesto' },
                { label: __('⚡ Servicios'), value: 'servicio' },
            ],
            value: tipoProductoFilter,
            onChange: (val) => { setTipoProductoFilter(val); handleFilter(val); },
        },
        {
            name: 'modelo_id',
            label: __('Modelo de Equipo'),
            type: 'select',
            options: [
                { label: __('Todos los modelos'), value: 'all' },
                ...modelos.map((m) => ({ label: m.nombre, value: String(m.id) })),
            ],
            value: modeloFilter,
            onChange: (val) => { setModeloFilter(val); handleFilter(); },
        },
        {
            name: 'condicion',
            label: __('Condición'),
            type: 'select',
            options: [
                { label: __('Todas las condiciones'), value: 'all' },
                { label: __('Nuevo'), value: 'nuevo' },
                { label: __('Usado'), value: 'usado' },
                { label: __('Reacondicionado'), value: 'reacondicionado' },
                { label: __('Para Repuesto'), value: 'repuesto' },
            ],
            value: condicionFilter,
            onChange: (val) => { setCondicionFilter(val); handleFilter(); },
        },
    ];

    const catalogInheritedSpecs = specsTargetProducto ? {
        ...(specsTargetProducto.modelo?.specs_overrides || {})
    } : {};

    const selectedModeloInForm = modelos.find(m => String(m.id) === data.modelo_id);
    const formInheritedSpecs = selectedModeloInForm ? (selectedModeloInForm.specs_json || {}) : {};
    const formCombinedSpecs = {
        ...formInheritedSpecs,
        'Condición': data.condicion ? data.condicion.toUpperCase() : 'NUEVO',
        'Modalidad de Venta': data.tipo_venta === 'granel' ? 'A Granel (Decimales)' : (data.tipo_venta === 'paquete' ? 'Como Paquete / Kit' : 'Por Unidad / Pza'),
        'Maneja Inventario': data.usa_inventario ? 'Sí' : 'No',
        ...data.variant_specs,
    };

    return (
        <>
            <Head title={__('Productos & Inventario')} />

            <div className="space-y-6">
                <Breadcrumbs items={breadcrumbs} />

                <ModuleHeader
                    icon={<Package className="h-6 w-6 text-white" />}
                    title={__('Productos & Variantes de Inventario')}
                    description={__('Gestión de stock físico, atributos de variante, precio de venta minorista, precio mayoreo y fichas técnicas.')}
                    colorClassName="bg-blue-600"
                >
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {__('Nuevo Producto')}
                    </Button>
                </ModuleHeader>

                {/* Tarjetas Estadísticas de Inventario */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={__('Total de Productos')}
                        value={stats.totalProductos}
                        icon={<Package className="h-5 w-5 text-blue-500" />}
                        description={__('Variantes registradas en catálogo')}
                    />
                    <StatCard
                        title={__('Stock Físico Total')}
                        value={stats.stockTotal}
                        icon={<Boxes className="h-5 w-5 text-emerald-500" />}
                        description={__('Unidades disponibles en sucursal')}
                    />
                    <StatCard
                        title={__('Alertas de Stock Bajo')}
                        value={stats.stockBajoCount}
                        icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                        description={__('Productos cerca del límite mínimo')}
                    />
                    <StatCard
                        title={__('Valor del Inventario')}
                        value={`$${stats.valorInventario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                        icon={<DollarSign className="h-5 w-5 text-purple-500" />}
                        description={__('Valoración total a precio de venta')}
                    />
                </div>

                {/* Pestañas de Filtrado Rápido por Tipo de Inventario */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => { setTipoProductoFilter('all'); handleFilter('all'); }}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                            tipoProductoFilter === 'all'
                                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                        )}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        {__('Todo el Inventario')}
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            tipoProductoFilter === 'all'
                                ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        )}>
                            {stats.tipoCounts?.todos ?? stats.totalProductos}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTipoProductoFilter('venta'); handleFilter('venta'); }}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                            tipoProductoFilter === 'venta'
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-950"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-800 dark:hover:text-blue-400"
                        )}
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {__('Venta POS')}
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            tipoProductoFilter === 'venta'
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        )}>
                            {stats.tipoCounts?.venta ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTipoProductoFilter('repuesto'); handleFilter('repuesto'); }}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                            tipoProductoFilter === 'repuesto'
                                ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-200 dark:shadow-violet-950"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-800 dark:hover:text-violet-400"
                        )}
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        {__('Repuestos')}
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            tipoProductoFilter === 'repuesto'
                                ? 'bg-white/20 text-white'
                                : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                        )}>
                            {stats.tipoCounts?.repuesto ?? 0}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setTipoProductoFilter('servicio'); handleFilter('servicio'); }}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border",
                            tipoProductoFilter === 'servicio'
                                ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200 dark:shadow-amber-950"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:text-amber-600 dark:hover:border-amber-800 dark:hover:text-amber-400"
                        )}
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {__('Servicios')}
                        <span className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                            tipoProductoFilter === 'servicio'
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        )}>
                            {stats.tipoCounts?.servicio ?? 0}
                        </span>
                    </button>
                </div>

                {/* Barra de Filtros */}
                <FilterBar
                    fields={filterFields}
                    searchPlaceholder={__('Buscar por SKU, nombre, código de barras o modelo...')}
                    searchValue={searchTerm}
                    onSearchChange={(value) => { setSearchTerm(value); handleFilter(); }}
                    onFilter={handleFilter}
                    onClear={handleClearFilters}
                />

                {/* Tabla Principal */}
                <DataTable
                    data={productos}
                    columns={columns}
                    filters={filters}
                    emptyMessage={__('No hay productos ni variantes registradas.')}
                    emptyState={{
                        title: __('Sin Productos'),
                        description: __('Crea el primer producto o variante física de equipo para comenzar tu inventario.'),
                        ctaLabel: __('Crear Producto'),
                        onCtaClick: handleCreate,
                    }}
                    rowClassName={() => 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors'}
                    onRowClick={(prod) => handleEdit(prod)}
                />

                {/* Modal Organizado por PESTAÑAS (TABS) de Creación / Edición de Producto */}
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={(open) => {
                        if (!open && (isNewCategoriaOpen || isNewMarcaOpen || isNewFamiliaOpen || isNewModeloOpen)) {
                            return;
                        }
                        setIsCreateOpen(open);
                    }}
                >
                    <DialogContent
                        className="sm:max-w-4xl max-h-[90vh] flex flex-col"
                        onPointerDownOutside={(e) => {
                            if (isNewCategoriaOpen || isNewMarcaOpen || isNewFamiliaOpen || isNewModeloOpen) {
                                e.preventDefault();
                            }
                        }}
                        onInteractOutside={(e) => {
                            if (isNewCategoriaOpen || isNewMarcaOpen || isNewFamiliaOpen || isNewModeloOpen) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                {editingProducto ? __('Editar Producto / Variante') : __('Nuevo Producto / Variante')}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Configura modalidades de venta, inventario, precios, impuestos y facturación electrónica CFDI.')}
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                    e.preventDefault();
                                }
                            }}
                            className="flex-1 flex flex-col min-h-0 space-y-4 py-2"
                        >
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                                <TabsList className="grid grid-cols-5 w-full h-10 mb-3 bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto">
                                    <TabsTrigger value="general" className="text-xs gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-2">
                                        <Info className="h-3.5 w-3.5 text-blue-500" />
                                        {__('1. General & Precios')}
                                    </TabsTrigger>
                                    <TabsTrigger value="impuestos" className="text-xs gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-2">
                                        <Receipt className="h-3.5 w-3.5 text-indigo-500" />
                                        {__('2. Impuestos')}
                                    </TabsTrigger>
                                    <TabsTrigger value="cfdi" className="text-xs gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-2">
                                        <FileCheck className="h-3.5 w-3.5 text-teal-500" />
                                        {__('3. CFDI / SAT')}
                                    </TabsTrigger>
                                    <TabsTrigger value="atributos" className="text-xs gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-2">
                                        <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />
                                        {__('4. Atributos')}
                                    </TabsTrigger>
                                    <TabsTrigger value="ficha" className="text-xs gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 px-2">
                                        <FileText className="h-3.5 w-3.5 text-amber-500" />
                                        {__('5. Ficha')}
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                                    {/* PESTAÑA UNIFICADA: GENERAL, PRECIOS, STOCK Y CATÁLOGO */}
                                    <TabsContent value="general" className="space-y-4 m-0">
                                        {/* 1. CATÁLOGO: CATEGORÍA, MARCA Y MODELO (PRIMERO) */}
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Layers className="h-4 w-4 text-indigo-500" />
                                                {__('Catálogo del Producto (Categoría, Marca y Modelo)')}
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                {/* Categoría (col-span-4) */}
                                                <div className="md:col-span-4 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="cat_select" className="text-xs font-medium">{__('Categoría')}</Label>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => setIsNewCategoriaOpen(true)}
                                                            className="h-auto p-0 text-[11px] text-blue-600 dark:text-blue-400 gap-1 font-normal"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {__('+ Nueva Categoría')}
                                                        </Button>
                                                    </div>
                                                    <SearchableSelect
                                                        id="cat_select"
                                                        value={selCategoriaId}
                                                        onChange={(val) => handleCategoriaSelect(val)}
                                                        options={[
                                                            { value: 'all', label: __('Todas las categorías') },
                                                            ...categorias.map((c) => ({ value: String(c.id), label: c.nombre }))
                                                        ]}
                                                        placeholder={__('Todas las categorías')}
                                                        searchPlaceholder={__('Buscar categoría...')}
                                                    />
                                                </div>

                                                {/* Marca (col-span-4) */}
                                                <div className="md:col-span-4 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="marca_select" className="text-xs font-medium">{__('Marca')}</Label>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => setIsNewMarcaOpen(true)}
                                                            className="h-auto p-0 text-[11px] text-blue-600 dark:text-blue-400 gap-1 font-normal"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {__('+ Nueva Marca')}
                                                        </Button>
                                                    </div>
                                                    <SearchableSelect
                                                        id="marca_select"
                                                        value={selMarcaId}
                                                        onChange={(val) => handleMarcaSelect(val)}
                                                        options={[
                                                            { value: 'all', label: __('Todas las marcas') },
                                                            ...marcas.map((m) => ({ value: String(m.id), label: m.nombre }))
                                                        ]}
                                                        placeholder={__('Todas las marcas')}
                                                        searchPlaceholder={__('Buscar marca...')}
                                                    />
                                                </div>

                                                {/* Modelo (col-span-4 - Obligatorio) */}
                                                <div className="md:col-span-4 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="modelo_select" className="text-xs font-semibold text-blue-600 dark:text-blue-400 required">{__('Modelo Exacto')}</Label>
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => setIsNewModeloOpen(true)}
                                                            className="h-auto p-0 text-[11px] text-blue-600 dark:text-blue-400 gap-1 font-semibold"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            {__('+ Nuevo Modelo')}
                                                        </Button>
                                                    </div>
                                                    <SearchableSelect
                                                        id="modelo_select"
                                                        value={data.modelo_id}
                                                        onChange={(val) => handleSelectModelo(val)}
                                                        options={filteredModelos.map((m) => ({
                                                            value: String(m.id),
                                                            label: m.nombre,
                                                            description: `${m.marca} • ${m.categoria}`
                                                        }))}
                                                        placeholder={__('Buscar y seleccionar modelo...')}
                                                        searchPlaceholder={__('Escribe para buscar...')}
                                                    />
                                                    {errors.modelo_id && <p className="text-xs text-rose-500">{errors.modelo_id}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. IDENTIFICACIÓN DEL PRODUCTO / VARIANTE (LUEGO) */}
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Package className="h-4 w-4 text-blue-500" />
                                                {__('Identificación del Producto / Variante')}
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                {/* Código de Barras */}
                                                <div className="md:col-span-4 space-y-1.5">
                                                    <Label htmlFor="codigo_barras" className="text-xs font-medium">{__('Código (EAN / UPC / Barras)')}</Label>
                                                    <Input
                                                        id="codigo_barras"
                                                        value={data.codigo_barras}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const mod = modelos.find((m) => String(m.id) === data.modelo_id);
                                                            setData((prev) => ({
                                                                ...prev,
                                                                codigo_barras: val,
                                                                sku: generateSkuSuggestion(mod, prev.nombre_variante, val),
                                                            }));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        placeholder="Ej: 779123456789"
                                                        className="font-mono text-xs"
                                                    />
                                                    {errors.codigo_barras && <p className="text-xs text-rose-500">{errors.codigo_barras}</p>}
                                                </div>

                                                {/* Nombre del Producto */}
                                                <div className="md:col-span-5 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="nombre_variante" className="text-xs required">{__('Nombre del Producto')}</Label>
                                                        {data.tipo_producto === 'repuesto' && (
                                                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200">
                                                                ✏️ {__('Edición Habilitada')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Input
                                                        id="nombre_variante"
                                                        value={data.nombre_variante}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const mod = modelos.find((m) => String(m.id) === data.modelo_id);
                                                            setData((prev) => ({
                                                                ...prev,
                                                                nombre_variante: val,
                                                                sku: generateSkuSuggestion(mod, val, prev.codigo_barras),
                                                            }));
                                                        }}
                                                        placeholder={data.tipo_producto === 'repuesto' ? __('ej: Pantalla OLED Incell iPhone 13 Pro Black') : __('Se genera automáticamente al seleccionar el modelo')}
                                                        readOnly={data.tipo_producto !== 'repuesto'}
                                                        className={cn(
                                                            "text-xs font-medium",
                                                            data.tipo_producto !== 'repuesto'
                                                                ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-700 dark:text-slate-300"
                                                                : "bg-white dark:bg-slate-950 border-purple-300 focus:border-purple-600 text-purple-950 dark:text-purple-100 font-bold"
                                                        )}
                                                    />
                                                    {errors.nombre_variante && <p className="text-xs text-rose-500">{errors.nombre_variante}</p>}
                                                </div>

                                                {/* SKU (readOnly) */}
                                                <div className="md:col-span-3 space-y-1.5">
                                                    <Label htmlFor="sku" className="text-xs required">{__('SKU (Código Único)')}</Label>
                                                    <Input
                                                        id="sku"
                                                        value={data.sku}
                                                        onChange={(e) => setData('sku', e.target.value)}
                                                        placeholder={__('Autogenerado')}
                                                        readOnly
                                                        className="font-mono text-xs bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-700 dark:text-slate-300"
                                                    />
                                                    {errors.sku && <p className="text-xs text-rose-500">{errors.sku}</p>}
                                                </div>

                                                {/* Tipo de Inventario / Destino */}
                                                <div className="md:col-span-12 space-y-1.5 pt-1">
                                                    <Label htmlFor="tipo_producto_form" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Boxes className="w-3.5 h-3.5 text-purple-600" />
                                                        {__('Tipo de Inventario / Destino del Producto *')}
                                                    </Label>
                                                    <Select
                                                        value={data.tipo_producto || 'venta'}
                                                        onValueChange={(val) => {
                                                            setData((prev) => ({
                                                                ...prev,
                                                                tipo_producto: val as any,
                                                                condicion: val === 'repuesto' ? 'repuesto' : prev.condicion,
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger id="tipo_producto_form" className="text-xs h-9 font-semibold bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-900">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="venta" className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                                                🛍️ {__('Producto para Venta POS (Comercial / Venta Directa en Caja)')}
                                                            </SelectItem>
                                                            <SelectItem value="repuesto" className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                                                🛠️ {__('Repuesto / Refacción de Taller (Asignable a Órdenes de Reparación)')}
                                                            </SelectItem>
                                                            <SelectItem value="servicio" className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                                                ⚡ {__('Servicio Técnico / Mano de Obra (Intangible sin stock físico)')}
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {data.tipo_producto === 'repuesto'
                                                            ? __('Este item se listará prioritariamente al asignar piezas en el Servicio Técnico de Reparaciones.')
                                                            : (data.tipo_producto === 'servicio'
                                                                ? __('Este item representa un servicio o trabajo técnico intangibe.')
                                                                : __('Este item estará disponible en el Punto de Venta (POS) para venta libre.'))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. ESTRUCTURA DE PRECIOS Y STOCK */}
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                                {__('Estructura de Precios & Inventario')}
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="precio_compra" className="text-xs required">{__('Precio Compra (Costo)')}</Label>
                                                    <Input
                                                        id="precio_compra"
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        placeholder="0.00"
                                                        value={data.precio_compra}
                                                        onChange={(e) => setData('precio_compra', e.target.value)}
                                                        className="h-9 text-xs font-medium"
                                                    />
                                                    {errors.precio_compra && <p className="text-xs text-rose-500">{errors.precio_compra}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="precio_venta" className="text-xs required">{__('Precio Venta (Minorista)')}</Label>
                                                    <Input
                                                        id="precio_venta"
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        placeholder="0.00"
                                                        value={data.precio_venta}
                                                        onChange={(e) => setData('precio_venta', e.target.value)}
                                                        className="h-9 text-xs font-bold text-emerald-600"
                                                    />
                                                    {errors.precio_venta && <p className="text-xs text-rose-500">{errors.precio_venta}</p>}
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="precio_mayoreo" className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                                        <BadgePercent className="h-3.5 w-3.5 text-purple-500" />
                                                        {__('Precio Mayoreo')}
                                                    </Label>
                                                    <Input
                                                        id="precio_mayoreo"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.precio_mayoreo}
                                                        onChange={(e) => setData('precio_mayoreo', e.target.value)}
                                                        className="h-9 text-xs font-semibold text-purple-600 border-purple-200 dark:border-purple-900"
                                                    />
                                                    {errors.precio_mayoreo && <p className="text-xs text-rose-500">{errors.precio_mayoreo}</p>}
                                                </div>
                                            </div>

                                            {/* Inventario y Stock */}
                                            <div className={cn(
                                                "p-3 rounded-lg border space-y-3 transition-all",
                                                data.usa_inventario ? "bg-background" : "bg-slate-100/50 opacity-60 pointer-events-none"
                                            )}>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="stock" className={cn("text-xs", data.usa_inventario && "required")}>
                                                            {__('Stock Actual (Permite 0)')}
                                                        </Label>
                                                        <Input
                                                            id="stock"
                                                            type="number"
                                                            step={data.tipo_venta === 'granel' ? '0.001' : '1'}
                                                            min="0"
                                                            required={data.usa_inventario}
                                                            placeholder={__('Ej: 10')}
                                                            value={data.stock === '' || data.stock === null || data.stock === undefined ? '' : data.stock}
                                                            onChange={(e) => setData('stock', e.target.value === '' ? '' as any : Number(e.target.value))}
                                                            className="h-9 font-semibold"
                                                        />
                                                        {errors.stock && <p className="text-xs text-rose-500 font-semibold">{errors.stock}</p>}
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="stock_minimo" className="text-xs required">{__('Stock Mínimo (Alerta)')}</Label>
                                                        <Input
                                                            id="stock_minimo"
                                                            type="number"
                                                            step={data.tipo_venta === 'granel' ? '0.001' : '1'}
                                                            min="0"
                                                            value={data.stock_minimo}
                                                            onChange={(e) => setData('stock_minimo', Number(e.target.value))}
                                                            className="h-9"
                                                        />
                                                        {errors.stock_minimo && <p className="text-xs text-rose-500">{errors.stock_minimo}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. MODALIDAD DE VENTA, CONDICIÓN Y ESTADO */}
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="tipo_venta" className="text-xs required font-medium">{__('¿Cómo se vende?')}</Label>
                                                    <Select
                                                        value={data.tipo_venta}
                                                        onValueChange={(val: any) => setData('tipo_venta', val)}
                                                    >
                                                        <SelectTrigger id="tipo_venta" className="w-full h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                            <SelectItem value="unidad">{__('Por unidad / pza')}</SelectItem>
                                                            <SelectItem value="granel">{__('A granel (usa decimales)')}</SelectItem>
                                                            <SelectItem value="paquete">{__('Como paquete / kit')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label htmlFor="condicion" className="text-xs font-medium">{__('Condición del Equipo')}</Label>
                                                    <Select
                                                        value={data.condicion}
                                                        onValueChange={(val: any) => setData('condicion', val)}
                                                    >
                                                        <SelectTrigger id="condicion" className="w-full h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                            <SelectItem value="nuevo">{__('Nuevo')}</SelectItem>
                                                            <SelectItem value="usado">{__('Usado')}</SelectItem>
                                                            <SelectItem value="reacondicionado">{__('Reacondicionado')}</SelectItem>
                                                            <SelectItem value="repuesto">{__('Para Repuesto')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex items-center justify-between rounded-lg border p-2 bg-background">
                                                        <Label className="text-[11px] font-semibold">{__('Inventario')}</Label>
                                                        <Switch
                                                            checked={data.usa_inventario}
                                                            onCheckedChange={(checked) => setData('usa_inventario', checked)}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg border p-2 bg-background">
                                                        <Label className="text-[11px] font-semibold">{__('Activo')}</Label>
                                                        <Switch
                                                            checked={data.estado}
                                                            onCheckedChange={(checked) => setData('estado', checked)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* PESTAÑA 2: IMPUESTOS (GLOBAL MULTIPAÍS) */}
                                    <TabsContent value="impuestos" className="space-y-4 m-0">
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <Receipt className="h-4 w-4 text-indigo-500" />
                                                {__('Configuración de Impuestos (Global / Multipaís)')}
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Tipo de Impuesto */}
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="tipo_impuesto" className="text-xs required">{__('Tratamiento Fiscal')}</Label>
                                                    <Select
                                                        value={data.tipo_impuesto}
                                                        onValueChange={(val: any) => setData('tipo_impuesto', val)}
                                                    >
                                                        <SelectTrigger id="tipo_impuesto" className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                            <SelectItem value="gravado">{__('Gravado (Aplica IVA / Tax Estándar)')}</SelectItem>
                                                            <SelectItem value="exento">{__('Exento de Impuestos')}</SelectItem>
                                                            <SelectItem value="tasa_cero">{__('Tasa Cero (0%)')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Tasa IVA / VAT / Tax Principal */}
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="tasa_iva" className="text-xs required">{__('Tasa Impuesto Principal (%)')}</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="tasa_iva"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            disabled={data.tipo_impuesto !== 'gravado'}
                                                            value={data.tipo_impuesto === 'gravado' ? data.tasa_iva : '0.00'}
                                                            onChange={(e) => setData('tasa_iva', e.target.value)}
                                                            className="h-9 pr-7"
                                                        />
                                                        <Percent className="h-3.5 w-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Impuesto Adicional y Retención */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                                                {/* Impuesto Adicional */}
                                                <div className="space-y-2 rounded-md border p-3 bg-background">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-semibold">{__('Impuesto Adicional / Especial')}</Label>
                                                        <Switch
                                                            checked={data.aplica_impuesto_adicional}
                                                            onCheckedChange={(checked) => setData('aplica_impuesto_adicional', checked)}
                                                        />
                                                    </div>
                                                    {data.aplica_impuesto_adicional && (
                                                        <div className="relative pt-1">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={data.tasa_impuesto_adicional}
                                                                onChange={(e) => setData('tasa_impuesto_adicional', e.target.value)}
                                                                placeholder="Tasa %"
                                                                className="h-8 text-xs pr-7"
                                                            />
                                                            <Percent className="h-3.5 w-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Retención */}
                                                <div className="space-y-2 rounded-md border p-3 bg-background">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-semibold">{__('Aplica Retención de Impuesto')}</Label>
                                                        <Switch
                                                            checked={data.aplica_retencion}
                                                            onCheckedChange={(checked) => setData('aplica_retencion', checked)}
                                                        />
                                                    </div>
                                                    {data.aplica_retencion && (
                                                        <div className="relative pt-1">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={data.tasa_retencion}
                                                                onChange={(e) => setData('tasa_retencion', e.target.value)}
                                                                placeholder="Tasa Retención %"
                                                                className="h-8 text-xs pr-7"
                                                            />
                                                            <Percent className="h-3.5 w-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Precio Incluye Impuestos */}
                                            <div className="flex items-center justify-between rounded-lg border p-3 bg-background">
                                                <div>
                                                    <Label className="text-xs font-semibold">{__('El precio de venta ya incluye impuestos')}</Label>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {data.precio_incluye_impuestos
                                                            ? __('El precio minorista es final (desglosa impuesto en la factura).')
                                                            : __('El impuesto se suma como un cargo adicional sobre el precio de venta.')}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={data.precio_incluye_impuestos}
                                                    onCheckedChange={(checked) => setData('precio_incluye_impuestos', checked)}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* PESTAÑA 4: FACTURACIÓN / CFDI (SAT) */}
                                    <TabsContent value="cfdi" className="space-y-4 m-0">
                                        <div className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                <FileCheck className="h-4 w-4 text-teal-500" />
                                                {__('Facturación Electrónica & Catálogos Fiscales (CFDI / SAT)')}
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Clave ProdServ SAT */}
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="clave_sat_producto" className="text-xs font-medium">{__('Clave de Producto / Servicio Fiscal (SAT)')}</Label>
                                                    <Input
                                                        id="clave_sat_producto"
                                                        value={data.clave_sat_producto}
                                                        onChange={(e) => setData('clave_sat_producto', e.target.value)}
                                                        placeholder="Ej: 43191501 (Celulares) / 43211500 (PC)"
                                                        className="font-mono text-xs"
                                                    />
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <span className="text-[10px] text-muted-foreground">{__('Sugerencias:')}</span>
                                                        <button type="button" onClick={() => setData('clave_sat_producto', '43191501')} className="text-[10px] text-blue-600 hover:underline">43191501 (Celulares)</button>
                                                        <button type="button" onClick={() => setData('clave_sat_producto', '43211500')} className="text-[10px] text-blue-600 hover:underline">43211500 (Computadoras)</button>
                                                        <button type="button" onClick={() => setData('clave_sat_producto', '43191600')} className="text-[10px] text-blue-600 hover:underline">43191600 (Accesorios)</button>
                                                        <button type="button" onClick={() => setData('clave_sat_producto', '84111506')} className="text-[10px] text-blue-600 hover:underline">84111506 (Servicios)</button>
                                                    </div>
                                                </div>

                                                {/* Clave Unidad SAT */}
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="clave_sat_unidad" className="text-xs font-medium">{__('Clave de Unidad Fiscal (SAT)')}</Label>
                                                    <Select
                                                        value={data.clave_sat_unidad}
                                                        onValueChange={(val) => setData('clave_sat_unidad', val)}
                                                    >
                                                        <SelectTrigger id="clave_sat_unidad" className="w-full font-mono text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                            <SelectItem value="H87">H87 - Pieza / Unidad</SelectItem>
                                                            <SelectItem value="KGM">KGM - Kilogramo</SelectItem>
                                                            <SelectItem value="MTR">MTR - Metro</SelectItem>
                                                            <SelectItem value="E48">E48 - Unidad de Servicio</SelectItem>
                                                            <SelectItem value="XPK">XPK - Paquete</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {/* Objeto de Impuesto SAT */}
                                            <div className="space-y-1.5 pt-2 border-t">
                                                <Label htmlFor="objeto_impuesto_sat" className="text-xs font-medium">{__('Objeto de Impuesto Fiscal (SAT CFDI 4.0)')}</Label>
                                                <Select
                                                    value={data.objeto_impuesto_sat}
                                                    onValueChange={(val) => setData('objeto_impuesto_sat', val)}
                                                >
                                                    <SelectTrigger id="objeto_impuesto_sat" className="w-full text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                        <SelectItem value="02">02 - Sí objeto de impuesto</SelectItem>
                                                        <SelectItem value="01">01 - No objeto de impuesto</SelectItem>
                                                        <SelectItem value="03">03 - Sí objeto de impuesto y no obligado al desglose</SelectItem>
                                                        <SelectItem value="04">04 - Sí objeto de impuesto y no causa impuesto</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* PESTAÑA 5: ATRIBUTOS DE VARIANTE */}
                                    <TabsContent value="atributos" className="space-y-4 m-0">
                                        <SpecEditor
                                            initialSpecs={data.variant_specs}
                                            onChange={(specs) => {
                                                const mod = modelos.find((m) => String(m.id) === data.modelo_id);
                                                let nombre = mod ? mod.nombre : data.nombre_variante;
                                                const subSpecs = Object.values(specs || {});
                                                if (mod && subSpecs.length > 0) {
                                                    nombre = `${mod.nombre} (${subSpecs.slice(0, 3).join(' / ')})`;
                                                }
                                                const newSku = generateSkuSuggestion(mod, nombre, data.codigo_barras);
                                                setData((prev) => ({
                                                    ...prev,
                                                    variant_specs: specs,
                                                    nombre_variante: nombre,
                                                    sku: newSku,
                                                }));
                                            }}
                                            title={__('Atributos de Variante')}
                                            description={__('Define la RAM, Almacenamiento, Color u otras características específicas de esta variante física.')}
                                        />
                                    </TabsContent>

                                    {/* PESTAÑA 6: FICHA TÉCNICA COMBINADA (VISTA PREVIA EN VIVO) */}
                                    <TabsContent value="ficha" className="space-y-4 m-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-semibold flex items-center gap-1.5">
                                                    <Layers className="h-4 w-4 text-amber-500" />
                                                    {__('Ficha Técnica Combinada (Vista Previa)')}
                                                </Label>
                                                <span className="text-xs font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border">
                                                    {Object.keys(formCombinedSpecs).length} {__('atributos totales')}
                                                </span>
                                            </div>

                                            {Object.keys(formCombinedSpecs).length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                                                    {Object.entries(formCombinedSpecs).map(([k, v]) => (
                                                        <div key={k} className="p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{k}</span>
                                                            <span className="text-xs font-medium text-foreground mt-0.5">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                                                    {__('Selecciona un modelo del catálogo para previsualizar la ficha técnica combinada.')}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>

                            <DialogFooter className="pt-2 border-t mt-auto">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingProducto ? __('Guardar Cambios') : __('Crear Producto')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sub-Modal 1: Creación Rápida de Categoría */}
                <Dialog open={isNewCategoriaOpen} onOpenChange={setIsNewCategoriaOpen}>
                    <DialogContent
                        className="sm:max-w-md"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsNewCategoriaOpen(false);
                        }}
                    >
                        <form onSubmit={handleQuickCreateCategoria}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FolderTree className="h-5 w-5 text-blue-500" />
                                    {__('Nueva Categoría')}
                                </DialogTitle>
                                <DialogDescription>{__('Crea una nueva categoría en caliente sin salir del formulario.')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new_cat_name" className="required">{__('Nombre de Categoría')}</Label>
                                    <Input
                                        id="new_cat_name"
                                        value={newCategoriaNombre}
                                        onChange={(e) => setNewCategoriaNombre(e.target.value)}
                                        placeholder="Ej: Consolas de Videojuegos"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setIsNewCategoriaOpen(false); }}>{__('Cancelar')}</Button>
                                <Button type="submit" disabled={isSavingCategoria}>{isSavingCategoria ? __('Guardando...') : __('Crear Categoría')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sub-Modal 2: Creación Rápida de Marca */}
                <Dialog open={isNewMarcaOpen} onOpenChange={setIsNewMarcaOpen}>
                    <DialogContent
                        className="sm:max-w-md"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsNewMarcaOpen(false);
                        }}
                    >
                        <form onSubmit={handleQuickCreateMarca}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-blue-500" />
                                    {__('Nueva Marca')}
                                </DialogTitle>
                                <DialogDescription>{__('Crea una nueva marca de fabricante en caliente.')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new_marca_name" className="required">{__('Nombre de Marca')}</Label>
                                    <Input
                                        id="new_marca_name"
                                        value={newMarcaNombre}
                                        onChange={(e) => setNewMarcaNombre(e.target.value)}
                                        placeholder="Ej: Sony / Nintendo / Asus"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setIsNewMarcaOpen(false); }}>{__('Cancelar')}</Button>
                                <Button type="submit" disabled={isSavingMarca}>{isSavingMarca ? __('Guardando...') : __('Crear Marca')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sub-Modal 3: Creación Rápida de Familia */}
                <Dialog open={isNewFamiliaOpen} onOpenChange={setIsNewFamiliaOpen}>
                    <DialogContent
                        className="sm:max-w-md"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsNewFamiliaOpen(false);
                        }}
                    >
                        <form onSubmit={handleQuickCreateFamilia}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-blue-500" />
                                    {__('Nueva Familia de Equipos')}
                                </DialogTitle>
                                <DialogDescription>{__('Crea una línea o familia de productos en caliente.')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new_fam_name" className="required">{__('Nombre de Familia')}</Label>
                                    <Input
                                        id="new_fam_name"
                                        value={newFamiliaNombre}
                                        onChange={(e) => setNewFamiliaNombre(e.target.value)}
                                        placeholder="Ej: PlayStation Series / ROG Phone"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setIsNewFamiliaOpen(false); }}>{__('Cancelar')}</Button>
                                <Button type="submit" disabled={isSavingFamilia}>{isSavingFamilia ? __('Guardando...') : __('Crear Familia')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Sub-Modal 4: Creación Rápida de Modelo */}
                <Dialog open={isNewModeloOpen} onOpenChange={setIsNewModeloOpen}>
                    <DialogContent
                        className="sm:max-w-md"
                        onPointerDownOutside={(e) => e.preventDefault()}
                        onInteractOutside={(e) => e.preventDefault()}
                        onEscapeKeyDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsNewModeloOpen(false);
                        }}
                    >
                        <form onSubmit={handleQuickCreateModelo}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-blue-500" />
                                    {__('Nuevo Modelo de Equipo')}
                                </DialogTitle>
                                <DialogDescription>{__('Crea un nuevo modelo exacto en el catálogo en caliente.')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new_mod_name" className="required">{__('Nombre Comercial de Modelo')}</Label>
                                    <Input
                                        id="new_mod_name"
                                        value={newModeloNombre}
                                        onChange={(e) => setNewModeloNombre(e.target.value)}
                                        placeholder="Ej: PlayStation 5 Slim"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new_mod_code">{__('Código Técnico (Opcional)')}</Label>
                                    <Input
                                        id="new_mod_code"
                                        value={newModeloCodigo}
                                        onChange={(e) => setNewModeloCodigo(e.target.value)}
                                        placeholder="Ej: CFI-2000"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={(e) => { e.stopPropagation(); setIsNewModeloOpen(false); }}>{__('Cancelar')}</Button>
                                <Button type="submit" disabled={isSavingModelo}>{isSavingModelo ? __('Guardando...') : __('Crear Modelo')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Modal de Edición Rápida de Especificaciones del Producto */}
                <Dialog open={isSpecsModalOpen} onOpenChange={setIsSpecsModalOpen}>
                    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-bold">
                                <SlidersHorizontal className="h-5 w-5 text-blue-500 shrink-0" />
                                {__('Especificaciones Técnicas -')} {specsTargetProducto?.nombre_variante}
                            </DialogTitle>
                            <DialogDescription>
                                {__('Este producto cuenta con :count atributos específicos y :total especificaciones totales acumuladas en ficha técnica.', {
                                    count: String(Object.keys(specsTargetProducto?.variant_specs || {}).length),
                                    total: String(Object.keys(specsTargetProducto?.specs_completas || {}).length)
                                })}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Muestra las Especificaciones Heredadas del Catálogo (Modelo) si existen */}
                        {Object.keys(catalogInheritedSpecs).length > 0 && (
                            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/50 space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    {__('Especificaciones Heredadas del Modelo:')}
                                </span>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                    {Object.entries(catalogInheritedSpecs).map(([k, v]) => (
                                        <span key={k} className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-background border shadow-2xs text-slate-800 dark:text-slate-200">
                                            <strong className="text-slate-600 dark:text-slate-400 mr-1">{k}:</strong> {String(v)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveQuickSpecs} className="space-y-4 py-2">
                            <SpecEditor
                                initialSpecs={modalSpecs}
                                onChange={setModalSpecs}
                                title={__('Atributos Específicos del Producto')}
                                description={__('Añade o modifica los atributos de esta variante (RAM, Almacenamiento, Color, etc.).')}
                            />

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button type="button" variant="outline" onClick={() => setIsSpecsModalOpen(false)}>
                                    {__('Cancelar')}
                                </Button>
                                <Button type="submit" disabled={isSavingSpecs} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {isSavingSpecs ? __('Guardando...') : __('Guardar Especificaciones')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
