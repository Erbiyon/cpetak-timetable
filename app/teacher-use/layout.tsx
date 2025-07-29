import { TeacherNavbarCustom } from "@/components/teacher-navbar/teacher-navbar-custom";

export default function TeacherUseLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="teacher-use-layout">
            <TeacherNavbarCustom />
            {children}
        </div>
    );
}
