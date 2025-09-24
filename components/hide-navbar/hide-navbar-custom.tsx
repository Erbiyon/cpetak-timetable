"use client";

import { usePathname } from "next/navigation";
import { NavigationMenuCustom } from "@/components/navbar/navbar-custom";

export default function HideNavbarCustom({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const hideNavbarPages = [
        "/login",
        "/",
        "/teacher-use",
        "/teacher-use/time-table",
        "/teacher-use/request-room"
    ];

    const shouldHideNavbar = hideNavbarPages.includes(pathname);

    if (shouldHideNavbar) {
        return <>{children}</>;
    }

    return (
        <>
            <NavigationMenuCustom />
            {children}
        </>
    );
}