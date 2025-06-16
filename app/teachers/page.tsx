import IndepartmentTeacher from "@/components/teacher-table/in-department-teacher";
import OutdepartmentTeacher from "@/components/teacher-table/out-department-teacher";

export default function Teachers() {
    return (
        <div className="grid grid-cols-2 gap-4 p-5">
            <div>
                <IndepartmentTeacher />
            </div>
            <div>
                <OutdepartmentTeacher />
            </div>
        </div>
    )
}