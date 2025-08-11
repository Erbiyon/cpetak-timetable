"use client"

import { AddSubjectCustom } from "@/components/add-subject/add-subject-custom";
import CardStudyPlansCustom from "@/components/card-study-plans-table/card-study-plans-custom";
import { SelectCustom } from "@/components/select/select-custom";
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function FourYearPlan() {
    const [year, setYear] = useState<string>("")
    const [terms, setTerms] = useState<any[]>([])
    const [yearLevels, setYearLevels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                // ตั้งค่าปีปัจจุบันเป็นค่าเริ่มต้น (ปี พ.ศ.)
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
    const academicYear3 = parseInt(year) + 2 || new Date().getFullYear() + 545
    const academicYear4 = parseInt(year) + 3 || new Date().getFullYear() + 546

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    <span className="ml-2 text-sm sm:text-base">กำลังโหลดข้อมูล...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-4">
            {/* Header Section */}
            <div className="py-4 sm:py-6 lg:py-8 px-2 sm:px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-48">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-3 break-words leading-tight">
                    แผนการเรียนสำหรับนักศึกษาที่เข้ารับการศึกษาในปีการศึกษา {academicYear}
                </h1>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
                    หลักสูตรวิศวกรรมคอมพิวเตอร์ <span className="text-green-600 font-medium">4 ปี</span> มทร.ล้านนา ตาก
                </h3>
            </div>

            {/* Select Component */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <SelectCustom currentYear={year} onYearChange={handleYearChange} planType="FOUR_YEAR" />
            </div>

            {/* Study Plan Cards */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Year 1 */}
                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
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
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[0]?.name}/${academicYear}`}
                                    yearLevel={yearLevels[0]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
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
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[1]?.name}/${academicYear}`}
                                    yearLevel={yearLevels[0]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                {/* Year 2 */}
                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
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
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[0]?.name}/${academicYear2}`}
                                    yearLevel={yearLevels[1]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
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
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[1]?.name}/${academicYear2}`}
                                    yearLevel={yearLevels[1]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                {/* Year 3 */}
                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
                    termYear={`${terms[0]?.name}/${academicYear3}`}
                    yearLevel={yearLevels[2]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[2]?.name} {terms[0]?.name}/{academicYear3}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[0]?.name}/${academicYear3}`}
                                    yearLevel={yearLevels[2]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
                    termYear={`${terms[1]?.name}/${academicYear3}`}
                    yearLevel={yearLevels[2]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[2]?.name} {terms[1]?.name}/{academicYear3}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[1]?.name}/${academicYear3}`}
                                    yearLevel={yearLevels[2]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                {/* Year 4 */}
                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
                    termYear={`${terms[0]?.name}/${academicYear4}`}
                    yearLevel={yearLevels[3]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[3]?.name} {terms[0]?.name}/{academicYear4}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[0]?.name}/${academicYear4}`}
                                    yearLevel={yearLevels[3]?.name}
                                    onAdded={onAdded}
                                />
                            </div>
                        </div>
                    )}
                </CardStudyPlansCustom>

                <CardStudyPlansCustom
                    planType="FOUR_YEAR"
                    termYear={`${terms[1]?.name}/${academicYear4}`}
                    yearLevel={yearLevels[3]?.name}
                >
                    {({ onAdded }) => (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 lg:gap-4 mx-3 sm:mx-4 md:mx-6 lg:mx-8">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words leading-tight">
                                {yearLevels[3]?.name} {terms[1]?.name}/{academicYear4}
                            </h2>
                            <div className="shrink-0 self-start sm:self-center">
                                <AddSubjectCustom
                                    planType="FOUR_YEAR"
                                    termYear={`${terms[1]?.name}/${academicYear4}`}
                                    yearLevel={yearLevels[3]?.name}
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