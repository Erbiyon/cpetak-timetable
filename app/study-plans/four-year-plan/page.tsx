"use client"

import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { useEffect, useState } from "react"

export default function FourYearPlan() {
    const [year, setYear] = useState<string>("xxxx")
    const [terms, setTerms] = useState<any[]>([])
    const [yearLevels, setYearLevels] = useState<any[]>([])

    useEffect(() => {
        async function fetchTerm() {
            const res = await fetch("/api/term")
            if (res.ok) {
                const data = await res.json()
                setTerms(data)

                const term1 = data.find((t: any) => t.name === "ภาคเรียนที่ 1")
                if (term1 && term1.start) {
                    const startYear = new Date(term1.start).getFullYear() + 543

                    setYear(startYear.toString())
                }
            }
        }
        fetchTerm()

        async function fetchYearLevels() {
            const res = await fetch("/api/year-level")
            if (res.ok) {
                const data = await res.json()
                setYearLevels(data)
            }
        }
        fetchYearLevels()
    }, [])

    const academicYear = year
    const academicYear2 = parseInt(year) + 1
    const academicYear3 = parseInt(year) + 2
    const academicYear4 = parseInt(year) + 3

    return (
        <div className="container mx-auto py-4">
            <div className="py-5 mx-48">
                <h1>แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYear}</h1>
                <h3>หลักสูตรวืศวกรรมคอมพิวเตอร์ <span className="text-green-600">4 ปี</span> มทร.ล้านนา ตาก</h3>
            </div>
            <SelectCustom />
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[0]?.name} {terms[0]?.name}/{academicYear}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[0]?.name}/${academicYear}`}
                        yearLevel={yearLevels[0]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[0]?.name} {terms[1]?.name}/{academicYear}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[1]?.name}/${academicYear}`}
                        yearLevel={yearLevels[0]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[1]?.name} {terms[0]?.name}/{academicYear2}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[0]?.name}/${academicYear2}`}
                        yearLevel={yearLevels[1]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[1]?.name} {terms[1]?.name}/{academicYear2}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[1]?.name}/${academicYear2}`}
                        yearLevel={yearLevels[1]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[2]?.name} {terms[0]?.name}/{academicYear3}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[0]?.name}/${academicYear3}`}
                        yearLevel={yearLevels[2]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[2]?.name} {terms[1]?.name}/{academicYear3}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[1]?.name}/${academicYear3}`}
                        yearLevel={yearLevels[2]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[3]?.name} {terms[0]?.name}/{academicYear4}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[0]?.name}/${academicYear4}`}
                        yearLevel={yearLevels[3]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
            <CardStudyPlansCustom>
                <div className="flex justify-between items-center mx-8">
                    <h2>{yearLevels[3]?.name} {terms[1]?.name}/{academicYear4}</h2>
                    <AddSubjectCustom
                        planType="FOUR_YEAR"
                        termYear={`${terms[1]?.name}/${academicYear4}`}
                        yearLevel={yearLevels[3]?.name}
                    />
                </div>
            </CardStudyPlansCustom>
        </div>
    )
}