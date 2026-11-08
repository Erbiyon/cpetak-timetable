"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

interface EditRoomCustomProps {
    roomId: string;
    roomCode: string;
    roomType: string;
    roomCate?: string;
    onRoomUpdated?: () => void;
}

export default function EditRoomCustom({
    roomId,
    roomCode,
    roomType,
    roomCate,
    onRoomUpdated
}: EditRoomCustomProps) {
    const [open, setOpen] = useState(false);
    const [roomNumber, setRoomNumber] = useState(roomCode);
    const [roomCategory, setRoomCategory] = useState(roomCate || "บรรยาย");
    const [updating, setUpdating] = useState(false);
    const [existingCodes, setExistingCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        fetch("/api/room")
            .then((r) => r.json())
            .then((rooms: { roomCode: string; roomType: string }[]) => {
                const buildingType = roomType.trim().toLowerCase();
                setExistingCodes(
                    rooms
                        .filter((r) => r.roomType.trim().toLowerCase() === buildingType)
                        .map((r) => r.roomCode.trim().toLowerCase())
                );
            })
            .catch(() => setExistingCodes([]));
    }, [open, roomType]);

    const isDuplicate =
        roomNumber.trim().toLowerCase() !== roomCode.trim().toLowerCase() &&
        existingCodes.includes(roomNumber.trim().toLowerCase());

    const handleSubmit = async () => {
        if (!roomNumber.trim()) {
            toast.error("กรุณากรอกเลขห้อง");
            return;
        }

        try {
            setUpdating(true);
            const res = await fetch(`/api/room/${roomId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomCode: roomNumber.trim(),
                    roomType: roomType,
                    roomCate: roomCategory,
                }),
            });

            if (res.ok) {
                toast.success(`อัปเดตข้อมูลห้อง ${roomNumber.trim()} เรียบร้อยแล้ว`);
                setOpen(false);
                if (onRoomUpdated) {
                    onRoomUpdated();
                }
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "เกิดข้อผิดพลาดในการแก้ไขห้อง");
            }
        } catch (error) {
            console.error("Error updating room:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setRoomNumber(roomCode);
            setRoomCategory(roomCate || "บรรยาย");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    title={`แก้ไขห้อง ${roomCode}`}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-sans font-bold">แก้ไขข้อมูลห้องเรียน</DialogTitle>
                    <DialogDescription className="font-sans text-xs text-muted-foreground">
                        ปรับปรุงข้อมูลเลขห้องและประเภทการใช้งาน
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-3">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roomNumber" className="text-right text-xs font-medium font-sans">
                            เลขห้อง
                        </Label>
                        <div className="col-span-3 space-y-1">
                            <Input
                                id="roomNumber"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className={`font-sans ${isDuplicate ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                placeholder="กรอกเลขห้อง เช่น 621"
                                disabled={updating}
                            />
                            {isDuplicate && (
                                <p className="text-xs text-destructive font-sans">
                                    เลขห้องนี้มีอยู่ในอาคารนี้แล้ว
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-medium font-sans">อาคาร</Label>
                        <div className="col-span-3 text-xs text-muted-foreground font-sans bg-muted/40 px-3 py-2 rounded-md border border-border/60">
                            {roomType}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-medium font-sans">ประเภทห้อง</Label>
                        <RadioGroup
                            value={roomCategory}
                            onValueChange={setRoomCategory}
                            className="col-span-3 flex items-center gap-6"
                            disabled={updating}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="บรรยาย" id="edit-lecture" />
                                <Label htmlFor="edit-lecture" className="text-xs font-sans cursor-pointer">
                                    ห้องบรรยาย
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ปฏิบัติ" id="edit-practical" />
                                <Label htmlFor="edit-practical" className="text-xs font-sans cursor-pointer">
                                    ห้องปฏิบัติการ
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={updating}
                        className="font-sans"
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={updating || !roomNumber.trim() || isDuplicate}
                        className="font-sans"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                กำลังบันทึก...
                            </>
                        ) : (
                            "บันทึกข้อมูล"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}