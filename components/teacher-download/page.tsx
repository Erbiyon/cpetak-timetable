import { Download } from "lucide-react";
import { Button } from "../ui/button";

export default function DownloadTeacherButton() {
    return (
        <Button variant="secondary">
            <Download /> ดาวน์โหลดตารางสอน
        </Button>
    );
}