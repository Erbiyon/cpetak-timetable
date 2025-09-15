"use client"

import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { useEffect, useState } from "react"

export default function DveMsixPlan() {
    const [year, setYear] = useState<string>("")
    const [terms, setTerms] = useState<any[]>([])
    const [yearLevels, setYearLevels] = useState<any[]>([])
    const [_loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)


                const currentYear = new Date().getFullYear() + 543
                setYear(currentYear.toString())

                const [termRes, yearRes] = await Promise.all([
                    fetch("/api/term"),
                    fetch("/api/year-level")
                ])

                if (termRes.ok) {
                    const termData = await termRes.json()
                    setTerms(termData)
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

    const handleYearChange = (newYear: string) => {
        setYear(newYear)
    }

    const academicYear = year || new Date().getFullYear() + 543
    const academicYear2 = parseInt(year) + 1 || new Date().getFullYear() + 544

    return (
        <div className="container mx-auto px-4 py-4">

            <div className="py-4 sm:py-6 lg:py-8 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-48">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 break-words leading-tight">
                    แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYear}
                </h1>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
                    หลักสูตรวิศวกรรมคอมพิวเตอร์ <span className="text-yellow-600 font-medium">ปวส. (ม.6)</span> มทร.ล้านนา ตาก
                </h3>
            </div>


            <div className="mb-4 sm:mb-6 lg:mb-8">
                <SelectCustom currentYear={year} onYearChange={handleYearChange} planType="DVE-MSIX" />
            </div>


            <div className="space-y-4 sm:space-y-6 lg:space-y-8">

                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[0]?.name}/${academicYear}`}
                    yearLevel={yearLevels[0]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[0]?.name} {terms[0]?.name}/{academicYear}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[0]?.name}/${academicYear}`}
                                    yearLevel={yearLevels[0]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[1]?.name}/${academicYear}`}
                    yearLevel={yearLevels[0]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[0]?.name} {terms[1]?.name}/{academicYear}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[1]?.name}/${academicYear}`}
                                    yearLevel={yearLevels[0]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[2]?.name}/${academicYear}`}
                    yearLevel={yearLevels[0]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[0]?.name} {terms[2]?.name}/{academicYear}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[2]?.name}/${academicYear}`}
                                    yearLevel={yearLevels[0]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>


                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[0]?.name}/${academicYear2}`}
                    yearLevel={yearLevels[1]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[1]?.name} {terms[0]?.name}/{academicYear2}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[0]?.name}/${academicYear2}`}
                                    yearLevel={yearLevels[1]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[1]?.name}/${academicYear2}`}
                    yearLevel={yearLevels[1]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[1]?.name} {terms[1]?.name}/{academicYear2}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[1]?.name}/${academicYear2}`}
                                    yearLevel={yearLevels[1]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="DVE-MSIX"
                    termYear={`${terms[2]?.name}/${academicYear2}`}
                    yearLevel={yearLevels[1]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[1]?.name} {terms[2]?.name}/{academicYear2}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="DVE-MSIX"
                                    termYear={`${terms[2]?.name}/${academicYear2}`}
                                    yearLevel={yearLevels[1]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>
            </div>
        </div>
    )
}