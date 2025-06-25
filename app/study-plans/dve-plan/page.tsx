"use client"

import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { useEffect, useState } from "react"

export default function DvePlan() {
    const [year, setYear] = useState<string>("xxxx")

    useEffect(() => {
        async function fetchTerm() {
            const res = await fetch("/api/term")
            if (res.ok) {
                const data = await res.json()

                const term1 = data.find((t: any) => t.name === "ภาคเรียนที่ 1")
                if (term1 && term1.start) {
                    const startYear = new Date(term1.start).getFullYear() + 543
                    setYear(startYear.toString())
                }
            }
        }
        fetchTerm()
    }, [])

    return (
        <div className="container mx-auto py-4">
            <div className="py-5 mx-48">
                <h1>แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {year}</h1>
                <h3>หลักสูตรวืศวกรรมคอมพิวเตอร์ <span className="text-yellow-600">ปวส.</span> มทร.ล้านนา ตาก</h3>
            </div>
            <SelectCustom />
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 1/{year}</h2>
                    <AddSubjectCustom title={`ปี 1 ภาคเรียนที่ 1/${year}`} />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 2/{year}</h2>
                    <AddSubjectCustom title={`ปี 1 ภาคเรียนที่ 2/${year}`} />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 1 ภาคเรียนที่ 3/{year}</h2>
                    <AddSubjectCustom title={`ปี 1 ภาคเรียนที่ 3/${year}`} />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 1/{parseInt(year) + 1}</h2>
                    <AddSubjectCustom title={`ปี 2 ภาคเรียนที่ 1/${parseInt(year) + 1}`} />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 2/{parseInt(year) + 1}</h2>
                    <AddSubjectCustom title={`ปี 2 ภาคเรียนที่ 2/${parseInt(year) + 1}`} />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>ปี 2 ภาคเรียนที่ 3/{parseInt(year) + 1}</h2>
                    <AddSubjectCustom title={`ปี 2 ภาคเรียนที่ 3/${parseInt(year) + 1}`} />
                </div>
            </CardStudyPlansCustom>
        </div>
    )
}