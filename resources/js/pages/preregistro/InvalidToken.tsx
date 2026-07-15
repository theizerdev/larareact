import React from 'react';
import { Head } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

interface InvalidTokenProps {
    error: string;
}

export default function InvalidToken({ error }: InvalidTokenProps) {
    return (
        <>
            <Head title="Enlace no válido - Pre-registro" />
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl px-10">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/50">
                                <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                                Enlace de registro inválido
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                                {error}
                            </p>
                            <div className="text-xs text-slate-400 dark:text-slate-500">
                                Si necesitas un nuevo enlace, por favor ponte en contacto con la administración de la empresa.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
