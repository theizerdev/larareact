export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-transparent">
                <img src="/image/logo/larareact_icon.png" alt="LaraReact Icon" className="size-8 object-contain" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold text-black dark:text-white">
                    lara<span className="bg-gradient-to-r from-[#FF2D20] to-[#00F2FE] bg-clip-text text-transparent">react</span>
                </span>
            </div>
        </>
    );
}
