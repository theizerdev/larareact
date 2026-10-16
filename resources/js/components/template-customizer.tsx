import { Settings, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';
import TemplateCustomizerContent from '@/components/template-customizer-content';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useTemplateSettings } from '@/hooks/use-template-settings';
import { useTranslate } from '@/hooks/use-translate';

export default function TemplateCustomizer() {
    const { __ } = useTranslate();
    const [isOpen, setIsOpen] = useState(false);

    const {
        updateAppearance,
        updateSetting,
    } = useTemplateSettings();

    // Reset settings to default values
    const handleReset = () => {
        updateSetting('primaryColor', 'indigo');
        updateSetting('skin', 'default');
        updateSetting('semiDark', false);
        updateSetting('collapsed', false);
        updateSetting('navbarType', 'sticky');
        updateSetting('contentWidth', 'wide');
        updateSetting('direction', 'ltr');
        updateAppearance('system');
    };

    return (
        <>
            {/* Floating Settings Button with Spinning Hover animation */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex h-10 w-10 items-center justify-center rounded-l-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border-l border-t border-b border-indigo-400/20 focus:outline-none cursor-pointer transition-all hover:pr-1 group"
                title={__('Customize Template')}
            >
                <Settings className="size-5 animate-[spin_8s_linear_infinite] group-hover:scale-110 transition-transform" />
            </button>

            {/* Template Customizer Side Panel */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-[380px] sm:w-[420px] overflow-y-auto p-6 scrollbar-thin">
                    <SheetHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {__('Template Customizer')}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-1">
                                    {__('Customize and preview in real time')}
                                </SheetDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleReset}
                                className="h-8 w-8 text-muted-foreground hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title={__('Reset to Defaults')}
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="py-6">
                        <TemplateCustomizerContent layoutMode="drawer" />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
