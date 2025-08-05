import { Download } from "lucide-react";
import { Button } from "../ui/button";

export default function DownloadButtonTimetable() {
    return (
        <Button variant="secondary">
            <Download /> ดาวน์โหลดตารางเรียน
        </Button>
    );
}