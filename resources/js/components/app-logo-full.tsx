import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogoFull() {
    return (
        <div className="flex items-center gap-3">
            <AppLogoIcon className="h-9 w-auto text-black dark:text-white" />
            <span className="text-2xl font-bold tracking-tight text-black dark:text-white">
                lara<span className="bg-gradient-to-r from-[#FF2D20] to-[#00F2FE] bg-clip-text text-transparent">react</span>
            </span>
        </div>
    );
}
