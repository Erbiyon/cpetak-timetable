import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import ThemeProviderCustom from "@/components/theme-provider/theme-provider-custom";
import AuthSessionProvider from "@/components/providers/session-provider";
import HideNavbarCustom from "@/components/hide-navbar/hide-navbar-custom";

const sarabun = Sarabun({
    subsets: ["thai", "latin"],
    weight: "400"
});

export const metadata: Metadata = {
    title: "ระบบจัดตารางเรียน",
    description: "จัดทำโดย DekCom",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${sarabun.className} antialiased`}>
                <AuthSessionProvider>
                    <ThemeProviderCustom>
                        <HideNavbarCustom>
                            {children}
                        </HideNavbarCustom>
                    </ThemeProviderCustom>
                </AuthSessionProvider>
            </body>
        </html>
    );
}