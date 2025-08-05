import IndepartmentTeacher from "@/components/teacher-table/in-department-teacher";
import OutTeacher from "@/components/teacher-table/out-teacher";

export default function Teachers() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div className="space-y-4">
                <IndepartmentTeacher />
            </div>
            <div className="space-y-4">
                <OutTeacher />
            </div>
        </div>
    )
}