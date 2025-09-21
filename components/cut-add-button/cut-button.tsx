import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Scissors, Trash2, TriangleAlert } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function CutButton({
    subject,
    onSplitSubject,
    onMergeSubject,
}: {
    subject: any
    onSplitSubject?: (
        subjectId: number,
        splitData: {
            part1: { lectureHour: number; labHour: number; partNumber: number }
            part2: { lectureHour: number; labHour: number; partNumber: number }
        }
    ) => void
    onMergeSubject?: (subjectId: number) => void
}) {

    const totalLectureHours = subject?.lectureHour || 0
    const totalLabHours = subject?.labHour || 0
    const totalHours = totalLectureHours + totalLabHours

    const [isCoTeaching, setIsCoTeaching] = useState(false)
    const [coTeachingDetails, setCoTeachingDetails] = useState<any>(null)


    useEffect(() => {
        const checkCoTeaching = async () => {
            if (!subject?.id) return;

            try {
                const response = await fetch(`/api/subject/co-teaching/check?subjectId=${subject.id}`);
                const data = await response.json();

                if (data.groupKey) {
                    setIsCoTeaching(true);
                    setCoTeachingDetails(data);
                } else {
                    setIsCoTeaching(false);
                    setCoTeachingDetails(null);
                }
            } catch (error) {
                console.error("Error checking co-teaching status:", error);
            }
        };

        checkCoTeaching();
    }, [subject?.id]);

    const currentPartNumber = useMemo(() => {
        const nameMatch = subject?.subjectName?.match(/\(ส่วนที่ (\d+)\)$/);
        return nameMatch ? parseInt(nameMatch[1], 10) : 1;
    }, [subject?.subjectName]);


    const [hoursPart1, setHoursPart1] = useState(Math.floor(totalHours / 2))


    const hoursPart2 = totalHours - hoursPart1


    const hasSomePartZeroHours = hoursPart1 === 0 || hoursPart2 === 0


    const infoMessage = useMemo(() => {
        if (hoursPart1 === 0) {
            return `ส่วนที่ ${currentPartNumber} มีชั่วโมงรวมเป็น 0 - จะปรับปรุงวิชาเป็นส่วนที่ ${currentPartNumber + 1} เท่านั้น`
        }
        if (hoursPart2 === 0) {
            return `ส่วนที่ ${currentPartNumber + 1} มีชั่วโมงรวมเป็น 0 - จะคงวิชาเดิมโดยไม่สร้างส่วนแบ่งเพิ่ม`
        }
        return `ทั้งสองส่วนจะถูกสร้างขึ้น - ส่วนที่ ${currentPartNumber} และส่วนที่ ${currentPartNumber + 1}`
    }, [hoursPart1, hoursPart2, currentPartNumber])


    const calculateSplit = () => {

        const ratio = hoursPart1 / totalHours


        let lectureHourPart1 = Math.round(totalLectureHours * ratio)
        let labHourPart1 = hoursPart1 - lectureHourPart1


        if (labHourPart1 < 0) {
            lectureHourPart1 += labHourPart1
            labHourPart1 = 0
        }


        const lectureHourPart2 = totalLectureHours - lectureHourPart1
        const labHourPart2 = totalLabHours - labHourPart1

        return {
            part1: {
                lectureHour: lectureHourPart1,
                labHour: labHourPart1,
                partNumber: currentPartNumber
            },
            part2: {
                lectureHour: lectureHourPart2,
                labHour: labHourPart2,
                partNumber: currentPartNumber + 1
            },
        }
    }


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (onSplitSubject && subject) {
            const splitData = calculateSplit()

            console.log("Splitting subject with data:", {
                originalSubject: {
                    id: subject.id,
                    name: subject.subjectName,
                    roomId: subject.roomId,
                    teacherId: subject.teacherId,
                    section: subject.section,
                    room: subject.room,
                    teacher: subject.teacher
                },
                splitData
            })

            onSplitSubject(subject.id, splitData)
        }
    }

    const isAlreadySplitSubject = subject?.subjectName?.includes('(ส่วนที่');


    const handleMerge = async (e: React.FormEvent) => {
        e.preventDefault()

        if (onMergeSubject && subject) {
            onMergeSubject(subject.id)
        }
    }

    const getPlanTypeText = (planType: string) => {
        switch (planType) {
            case "TRANSFER": return "เทียบโอน";
            case "FOUR_YEAR": return "4 ปี";
            case "DVE-MSIX": return "ปวส. (ม.6)";
            case "DVE-LVC": return "ปวส. (ปวช.)";
            default: return planType;
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="p-0 h-5 w-5"
                    title={isAlreadySplitSubject ? "แบ่งวิชาเพิ่ม หรือรวมส่วนกลับ" : "แบ่งวิชา"}
                >
                    <Scissors color="#ff0000" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isAlreadySplitSubject ? "จัดการส่วนวิชา" : "แบ่งวิชา"} {subject?.subjectCode}
                        {isAlreadySplitSubject ? ` (ส่วนที่ ${currentPartNumber})` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        {isAlreadySplitSubject
                            ? `คุณสามารถแบ่งวิชา ${subject?.subjectName.replace(/\(ส่วนที่ \d+\)$/, '')} เป็นส่วนเพิ่ม หรือรวมส่วนที่แบ่งกลับเป็นวิชาเดิม`
                            : `คุณสามารถแบ่งวิชา ${subject?.subjectName} ออกเป็น 2 ส่วน โดยกำหนดจำนวนชั่วโมงรวมของแต่ละส่วน`
                        }
                    </DialogDescription>
                </DialogHeader>

                {isCoTeaching && coTeachingDetails && (
                    <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                            <div className="font-medium">วิชาสอนร่วม วิชานี้เป็นวิชาสอนร่วมระหว่างแผนการเรียน {
                                coTeachingDetails.details.map((d: any) => getPlanTypeText(d.planType)).join(", ")}
                            </div>
                            <div className="text-sm">
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {isAlreadySplitSubject && (
                    <div className="border-b mb-2">
                        <div className="flex justify-center">
                            <DialogClose asChild>
                                <Button
                                    variant="destructive"
                                    onClick={handleMerge}
                                    className="flex items-center gap-2 mb-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    รวมส่วนกลับเป็นวิชาเดิม
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                )}


                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>
                                จำนวนชั่วโมงทั้งหมด: {totalHours} ชม. (บรรยาย {totalLectureHours} ชม. / ปฏิบัติ{" "}
                                {totalLabHours} ชม.)
                            </Label>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-14 text-right font-medium">ส่วนที่ {currentPartNumber}:</div>
                                <Slider
                                    min={0}
                                    max={totalHours}
                                    step={1}
                                    value={[hoursPart1]}
                                    onValueChange={(values) => setHoursPart1(values[0])}
                                    className="flex-1"
                                />
                                <div className="w-14 text-right">{hoursPart1} ชม.</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-14 text-right font-medium">ส่วนที่ {currentPartNumber + 1}:</div>
                                <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-md relative">
                                    <div
                                        className="absolute h-full bg-slate-200 dark:bg-slate-700 rounded-md"
                                        style={{ width: `${(hoursPart2 / totalHours) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="w-14 text-right text-muted-foreground">
                                    {hoursPart2} ชม.
                                </div>
                            </div>
                        </div>


                        <div className="rounded-lg border p-4 bg-card mt-2 shadow-sm">
                            <div className="text-sm font-medium mb-3">รายละเอียดการแบ่ง</div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="font-medium"></div>
                                <div
                                    className={`font-medium text-center py-1 px-2 rounded bg-primary/10 ${hoursPart1 === 0 ? "text-muted-foreground line-through opacity-50" : ""
                                        }`}
                                >
                                    ส่วนที่ {currentPartNumber}
                                </div>
                                <div
                                    className={`font-medium text-center py-1 px-2 rounded bg-primary/10 ${hoursPart2 === 0 ? "text-muted-foreground line-through opacity-50" : ""
                                        }`}
                                >
                                    ส่วนที่ {currentPartNumber + 1}
                                </div>

                                <div className="py-1 font-medium">รวม</div>
                                <div
                                    className={`text-center font-medium py-1 ${hoursPart1 === 0
                                        ? "text-muted-foreground opacity-50"
                                        : "border-primary"
                                        }`}
                                >
                                    {hoursPart1} ชม.
                                </div>
                                <div
                                    className={`text-center font-medium py-1 ${hoursPart2 === 0
                                        ? "text-muted-foreground opacity-50"
                                        : "border-primary"
                                        }`}
                                >
                                    {hoursPart2} ชม.
                                </div>
                            </div>
                        </div>


                        <Alert
                            variant={hasSomePartZeroHours ? "destructive" : "default"}
                            className={`bg-muted/50 ${hasSomePartZeroHours ? "border-yellow-500 dark:border-yellow-700" : ""}`}
                        >
                            <Info className={`h-4 w-4 ${hasSomePartZeroHours ? "text-yellow-600 dark:text-yellow-400" : ""}`} />
                            <AlertDescription>
                                {infoMessage}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter className="mt-3">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">
                                ยกเลิก
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="submit">
                                แบ่งวิชา
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}