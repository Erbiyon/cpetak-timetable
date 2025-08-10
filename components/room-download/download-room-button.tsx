import { Download } from "lucide-react";
import { Button } from "../ui/button";

export default function DownloadRoomButton() {
    return (
        <Button variant="secondary">
            <Download /> ดาวน์โหลดตารางห้อง
        </Button>
    );
}