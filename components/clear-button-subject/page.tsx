import { Eraser } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Loader2 } from "lucide-react";

interface ClearButtonSubjectProps {
    termYear?: string;
    yearLevel?: string;
    planType?: string;
    onClearComplete?: () => void;
}

export default function ClearButtonSubject({
    termYear = "",
    yearLevel = "",
    planType = "",
    onClearComplete
}: ClearButtonSubjectProps) {
    const [isClearing, setIsClearing] = useState(false);

    const handleClearSubjects = async () => {
        setIsClearing(true);
        try {
            // Call the API to delete all assignments for the current filter
            const response = await fetch('/api/timetable/clear', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    termYear: termYear || '1',
                    yearLevel: yearLevel || 'ปี 1',
                    planType: planType || 'TRANSFER',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to clear timetable');
            }

            // Call the callback to update UI after clearing
            if (onClearComplete) {
                onClearComplete();
            }

        } catch (error) {
            console.error("Error clearing timetable:", error);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="bg-transparent hover:bg-red-500 text-red-500 hover:text-white border border-red-500 hover:border-transparent gap-2"
                                disabled={isClearing}
                            >
                                {isClearing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Eraser className="h-4 w-4" />
                                )}
                                ล้างวิชา
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการล้างข้อมูลทั้งหมด</AlertDialogTitle>
                                <AlertDialogDescription>
                                    คุณต้องการล้างวิชาทั้งหมดในตารางนี้หรือไม่?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleClearSubjects}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    ยืนยัน
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TooltipTrigger>
                <TooltipContent>
                    <p>ล้างวิชาทั้งหมดในตาราง</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
