import { Head } from '@inertiajs/react';
import { Check } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import LanguageTabs from '@/components/language-tabs';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    const { __ } = useTranslate();
    const { settings, updateSetting, appearance } = useTemplateSettings();

    const presetColors = [
        { name: 'indigo', hex: '#6366f1', label: __('Indigo') },
        { name: 'teal', hex: '#0d9488', label: __('Teal') },
        { name: 'orange', hex: '#ea580c', label: __('Orange') },
        { name: 'pink', hex: '#db2777', label: __('Pink') },
        { name: 'blue', hex: '#2563eb', label: __('Blue') },
    ];

    return (
        <>
            <Head title={__('Configuración de apariencia')} />

            <div className="flex flex-col gap-8">
                <PageHeader
                    title={__('Appearance')}
                    description={__('Personaliza el tema visual de tu cuenta')}
                />

                {/* Theme Mode Card */}
                <SectionCard
                    title={__('Tema')}
                    description={__(
                        'Selecciona el modo de color que prefieras',
                    )}
                >
                    <AppearanceTabs />
                </SectionCard>

                {/* System Layout Settings Card */}
                <SectionCard
                    title={__('Layout Customization')}
                    description={__('Configura las opciones predeterminadas de visualización del sistema')}
                >
                    <div className="space-y-6 max-w-xl">
                        {/* Primary Color presets */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {__('Primary Color')}
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                                {presetColors.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => updateSetting('primaryColor', color.name)}
                                        style={{ backgroundColor: color.hex }}
                                        className={cn(
                                            "relative h-8 w-8 rounded-md cursor-pointer transition-all border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm hover:scale-105",
                                            settings.primaryColor === color.name && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                                        )}
                                        title={color.label}
                                    >
                                        {settings.primaryColor === color.name && (
                                            <Check className="size-4 text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skin & Width */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Apariencia (Skin)')}
                                </label>
                                <Select value={settings.skin} onValueChange={(val: any) => updateSetting('skin', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">{__('Predeterminado')}</SelectItem>
                                        <SelectItem value="bordered">{__('Bordes')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Ancho de Contenido')}
                                </label>
                                <Select value={settings.contentWidth} onValueChange={(val: any) => updateSetting('contentWidth', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wide">{__('Ancho (Wide)')}</SelectItem>
                                        <SelectItem value="compact">{__('Compacto')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Navbar Type & Direction */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Tipo de Navbar')}
                                </label>
                                <Select value={settings.navbarType} onValueChange={(val: any) => updateSetting('navbarType', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sticky">{__('Fijo (Sticky)')}</SelectItem>
                                        <SelectItem value="static">{__('Estático (Static)')}</SelectItem>
                                        <SelectItem value="hidden">{__('Oculto (Hidden)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                    {__('Dirección de Escritura')}
                                </label>
                                <Select value={settings.direction} onValueChange={(val: any) => updateSetting('direction', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ltr">{__('Izquierda a Derecha (LTR)')}</SelectItem>
                                        <SelectItem value="rtl">{__('Derecha a Izquierda (RTL)')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Collapsed Menu & Semi Dark toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30 border-border">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {__('Menú Colapsado')}
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">
                                        {__('Colapsar menú lateral')}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.collapsed}
                                    onCheckedChange={(checked) => updateSetting('collapsed', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50/50 dark:bg-slate-900/30 border-border">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        {__('Barra Lateral Semi Oscura')}
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">
                                        {__('Fondo oscuro en tema claro')}
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.semiDark}
                                    onCheckedChange={(checked) => updateSetting('semiDark', checked)}
                                    disabled={appearance === 'dark'}
                                />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* Language Card */}
                <SectionCard
                    title={__('Language')}
                    description={__('Select Language')}
                >
                    <LanguageTabs />
                </SectionCard>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Configuración',
            href: editAppearance(),
        },
        {
            title: 'Apariencia',
            href: editAppearance(),
        },
    ],
};
