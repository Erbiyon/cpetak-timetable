import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";

export default function TransferPlan() {
    return (
        <div className="container mx-auto py-4">
            <div className="py-5 mx-48">
                <h1>แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา 25xx</h1>
                <h3>หลักสูตรวืศวกรรมคอมพิวเตอร์ เทียบโอน มทร.ล้านนา ตาก</h3>
            </div>
            <SelectCustom />
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 1/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 2/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 3/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 1/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 2/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 3/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 3 ภาคเรียนที่ 1/xxxx</h2>
                    <AddSubjectCustom />
                </div>
            </CardStudyPlansCustom>
        </div>
    )
}