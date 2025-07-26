"use client"

import { usePathname } from "next/navigation";
import { NavigationMenuCustom } from "@/components/navbar/navbar-custom";

export default function HideNavbar() {
    const pathname = usePathname();

    // หน้าที่ไม่ต้องแสดง Navigation Bar
    const hideNavbarPages = ["/login"];
    const shouldHideNavbar = hideNavbarPages.includes(pathname);

    if (shouldHideNavbar) {
        return null;
    }

    return <NavigationMenuCustom />;
}