import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { TableCustom } from "@/components/table/table-custom";
import { Button } from "@/components/ui/button";

export default function FourYearPlan() {
    return (
        <div className="container mx-auto py-4">
            <div className="py-5">
                <h1>แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา 25xx</h1>
                <h3>หลักสูตรวืศวกรรมคอมพิวเตอร์ 4 ปี มทร.ล้านนา ตาก</h3>
            </div>

            <SelectCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 1 ภาคเรียนที่ 1/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 1 ภาคเรียนที่ 2/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 2 ภาคเรียนที่ 1/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 2 ภาคเรียนที่ 2/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 3 ภาคเรียนที่ 1/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 3 ภาคเรียนที่ 2/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 4 ภาคเรียนที่ 1/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />

            <div className="flex justify-between items-center">
                <h2 className="py-5">ปี 4 ภาคเรียนที่ 2/xxxx</h2>
                <AddSubjectCustom />
            </div>

            <TableCustom />
        </div>
    )
}