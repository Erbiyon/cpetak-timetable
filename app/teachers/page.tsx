import IndepartmentTeacher from "@/components/teacher-table/in-department-teacher";
import OutTeacher from "@/components/teacher-table/out-teacher";

export default function Teachers() {
    return (
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">จัดการข้อมูลอาจารย์</h1>
                <p className="text-sm text-muted-foreground mt-0.5">ข้อมูลอาจารย์ผู้สอนประจำสาขาและอาจารย์ผู้สอนภายนอก</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <IndepartmentTeacher />
                </div>
                <div className="space-y-4">
                    <OutTeacher />
                </div>
            </div>
        </div>
    )
}