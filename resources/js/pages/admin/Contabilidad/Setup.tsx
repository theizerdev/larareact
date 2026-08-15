import { Head, router } from '@inertiajs/react';
import { Building2, Calculator, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ModuleHeader } from '@/components/module-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


interface RubroOption {
    id: string;
    nombre: string;
    desc: string;
}

interface Props {
    config?: any;
    rubros: RubroOption[];
}

export default function Setup({ config, rubros }: Props) {
    const [selectedRubro, setSelectedRubro] = useState<string>(config?.rubro_comercial || 'hibrido');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/contabilidad/setup', { rubro: selectedRubro }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Contabilidad', href: '#' },
        { title: 'Configuración por Rubro', href: '/admin/contabilidad/setup' },
    ];

    return (
        <>
            <Head title="Configuración de Contabilidad Automática" />

            <div className="space-y-6">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <ModuleHeader
                    title="Contabilidad Automática SAT México"
                    description="Configure el rubro comercial de su empresa para auto-generar su Catálogo de Cuentas oficial del SAT con Código Agrupador."
                    icon={<Calculator className="w-6 h-6" />}
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-blue-100 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-600 text-white font-bold">Paso 1</Badge>
                                <CardTitle className="text-lg">Seleccione el Rubro Comercial (Catálogo SAT México)</CardTitle>
                            </div>
                            <CardDescription>
                                El sistema creará el catálogo oficial del SAT con Código Agrupador y vinculará automáticamente las ventas POS, compras e IVA.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {rubros.map((r) => {
                                const isSelected = selectedRubro === r.id;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => setSelectedRubro(r.id)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                                                : 'border-slate-200 hover:border-blue-300 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.nombre}</h4>
                                                {isSelected && (
                                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                        <Check className="w-3 h-3 stroke-[3]" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-0">
                        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 font-bold text-blue-200 text-sm">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    Generación 100% Automática
                                </div>
                                <p className="text-xs text-blue-100 max-w-xl">
                                    Al confirmar, se creará el Plan de Cuentas (PUC) estándar de la empresa y se enlazarán las reglas para que el POS genere asientos contables en segundo plano.
                                </p>
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 shrink-0 shadow-lg"
                            >
                                {isSubmitting ? 'Configurando...' : 'Generar Contabilidad'}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}
