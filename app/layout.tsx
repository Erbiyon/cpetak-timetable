import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import ThemeProviderCustom from "@/components/theme-provider/theme-provider-custom";
import HideNavbar from "@/components/hide-navbar/hide-navbar";
import AuthSessionProvider from "@/components/providers/session-provider";

const sarabun = Sarabun({
    subsets: ["thai", "latin"],
    weight: "400"
});

export const metadata: Metadata = {
    title: "ระบบจัดตารางเรียน",
    description: "Create by next app",
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
                        <HideNavbar />
                        {children}
                    </ThemeProviderCustom>
                </AuthSessionProvider>
            </body>
        </html>
    );
}