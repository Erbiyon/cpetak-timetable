"use client"

import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function DveMsixPlan() {
    const [year, setYear] = useState<string>("xxxx")
    const [terms, setTerms] = useState<any[]>([])
    const [yearLevels, setYearLevels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                const [termRes, yearRes] = await Promise.all([
                    fetch("/api/term"),
                    fetch("/api/year-level")
                ])

                if (termRes.ok) {
                    const termData = await termRes.json()
                    setTerms(termData)

                    const term1 = termData.find((t: any) => t.name === "ภาคเรียนที่ 1")
                    if (term1 && term1.start) {
                        const startYear = new Date(term1.start).getFullYear() + 543
                        setYear(startYear.toString())
                    }
                }

                if (yearRes.ok) {
                    const yearData = await yearRes.json()
                    setYearLevels(yearData)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const academicYear = year || "xxxx"
    const academicYear2 = parseInt(year) + 1 || "xxxx"

    if (loading) {
        return (
            <div className="container mx-auto py-4">
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-4">
            <div className="py-5 mx-48">
                <h1>แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYear}</h1>
                <h3>หลักสูตรวืศวกรรมคอมพิวเตอร์ <span className="text-yellow-600">ม.6 ขึ้น ปวส.</span> มทร.ล้านนา ตาก</h3>
            </div>
            <SelectCustom />
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[0]?.name}/${academicYear}`}
                yearLevel={yearLevels[0]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[0]?.name} {terms[0]?.name}/{academicYear}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[0]?.name}/${academicYear}`}
                            yearLevel={yearLevels[0]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[1]?.name}/${academicYear}`}
                yearLevel={yearLevels[0]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[0]?.name} {terms[1]?.name}/{academicYear}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[1]?.name}/${academicYear}`}
                            yearLevel={yearLevels[0]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[2]?.name}/${academicYear}`}
                yearLevel={yearLevels[0]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[0]?.name} {terms[2]?.name}/{academicYear}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[2]?.name}/${academicYear}`}
                            yearLevel={yearLevels[0]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[0]?.name}/${academicYear2}`}
                yearLevel={yearLevels[1]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[1]?.name} {terms[0]?.name}/{academicYear2}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[0]?.name}/${academicYear2}`}
                            yearLevel={yearLevels[1]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[1]?.name}/${academicYear2}`}
                yearLevel={yearLevels[1]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[1]?.name} {terms[1]?.name}/{academicYear2}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[1]?.name}/${academicYear2}`}
                            yearLevel={yearLevels[1]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
            <CardStudyPlansCustom
                planType="DVE-MSIX"
                termYear={`${terms[2]?.name}/${academicYear2}`}
                yearLevel={yearLevels[1]?.name}
            >
                {({ onAdded }) => (
                    <div className="flex justify-between items-center mx-8">
                        <h2>{yearLevels[1]?.name} {terms[2]?.name}/{academicYear2}</h2>
                        <AddSubjectCustom
                            planType="DVE-MSIX"
                            termYear={`${terms[2]?.name}/${academicYear2}`}
                            yearLevel={yearLevels[1]?.name}
                            onAdded={onAdded}
                        />
                    </div>
                )}
            </CardStudyPlansCustom>
        </div>
    )
}