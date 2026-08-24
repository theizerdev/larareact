export default function AppLogo() {
    return (
        <div className="flex items-center">
            <img
                src="/image/logo/7.png"
                alt="Fix Sale"
                className="h-8 w-auto object-contain dark:block [[data-sidebar=dark]_&]:block hidden"
            />
            <img
                src="/image/logo/5.png"
                alt="Fix Sale"
                className="h-8 w-auto object-contain dark:hidden [[data-sidebar=dark]_&]:hidden block"
            />
        </div>
    );
}
