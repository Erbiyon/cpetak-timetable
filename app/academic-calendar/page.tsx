import CalendarCustom from "@/components/calendar/calendar-custom"
import { Label } from "@radix-ui/react-label"

export default function AcademicCalendar() {

    return (
        <div className="bg-card text-card-foreground flex flex-col gap-2 rounded-xl border m-10 py-5 shadow-sm mx-48">
            <div className="max-w-7xl mx-auto items-center">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <h3 className="py-8">วันเริ่มภาคการศึกษา</h3>
                        <h3>วันสิ้นสุดภาคการศึกษา</h3>
                    </div>
                    <div>
                        <Label htmlFor="date" className="px-1">
                            ภาคเรียนที่ 1
                        </Label>
                        <CalendarCustom />
                        <br />
                        <CalendarCustom />
                    </div>
                    <div>
                        <Label htmlFor="date" className="px-1">
                            ภาคเรียนที่ 2
                        </Label>
                        <CalendarCustom />
                        <br />
                        <CalendarCustom />
                    </div>
                    <div>
                        <Label htmlFor="date" className="px-1">
                            ภาคเรียนที่ 3
                        </Label>
                        <CalendarCustom />
                        <br />
                        <CalendarCustom />
                    </div>
                </div>
            </div>
        </div>
    )
}