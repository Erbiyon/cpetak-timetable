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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddRoomCustomProps {
    onRoomAdded?: () => void;
    title?: string;
}

export default function AddRoomCustom({ onRoomAdded, title }: AddRoomCustomProps) {
    const [open, setOpen] = useState(false);
    const [roomNumber, setRoomNumber] = useState("");
    const [roomCategory, setRoomCategory] = useState("บรรยาย");
    const [adding, setAdding] = useState(false);
    const [existingCodes, setExistingCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!open) return;
        fetch("/api/room")
            .then((r) => r.json())
            .then((rooms: { roomCode: string; roomType: string }[]) => {
                const buildingType = (title || "ทั่วไป").trim().toLowerCase();
                setExistingCodes(
                    rooms
                        .filter((r) => r.roomType.trim().toLowerCase() === buildingType)
                        .map((r) => r.roomCode.trim().toLowerCase())
                );
            })
            .catch(() => setExistingCodes([]));
    }, [open, title]);

    const isDuplicate =
        roomNumber.trim() !== "" &&
        existingCodes.includes(roomNumber.trim().toLowerCase());

    const handleSubmit = async () => {
        if (!roomNumber.trim()) {
            toast.error("กรุณากรอกเลขห้อง");
            return;
        }

        try {
            setAdding(true);
            const res = await fetch("/api/room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomCode: roomNumber.trim(),
                    roomType: title || "ทั่วไป",
                    roomCate: roomCategory,
                }),
            });

            if (res.ok) {
                toast.success(`เพิ่มห้อง ${roomNumber.trim()} สำเร็จ`);
                setRoomNumber("");
                setRoomCategory("บรรยาย");
                setOpen(false);
                if (onRoomAdded) {
                    onRoomAdded();
                }
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "เกิดข้อผิดพลาดในการเพิ่มห้อง");
            }
        } catch (error) {
            console.error("Error adding room:", error);
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setAdding(false);
        }
    };

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setRoomNumber("");
            setRoomCategory("บรรยาย");
            setExistingCodes([]);
        }
        setOpen(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2 font-sans font-medium shadow-xs">
                    <Plus className="h-4 w-4" />
                    เพิ่มห้องเรียน
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-sans font-bold text-lg">เพิ่มห้องเรียนใหม่</DialogTitle>
                    <DialogDescription className="font-sans text-xs text-muted-foreground">
                        ระบุเลขห้องและประเภทห้องสำหรับอาคารที่เลือก
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
                                placeholder="เช่น 621, LAB-1"
                                disabled={adding}
                            />
                            {isDuplicate && (
                                <p className="text-xs text-destructive font-sans">
                                    เลขห้องนี้มีอยู่ในอาคารนี้แล้ว
                                </p>
                            )}
                        </div>
                    </div>

                    {title && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs font-medium font-sans">อาคาร</Label>
                            <div className="col-span-3 text-xs text-muted-foreground font-sans bg-muted/40 px-3 py-2 rounded-md border border-border/60">
                                {title}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs font-medium font-sans">ประเภทห้อง</Label>
                        <RadioGroup
                            value={roomCategory}
                            onValueChange={setRoomCategory}
                            className="col-span-3 flex items-center gap-4"
                            disabled={adding}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="บรรยาย" id="lecture" />
                                <Label htmlFor="lecture" className="text-xs font-sans cursor-pointer">บรรยาย</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ปฏิบัติ" id="practical" />
                                <Label htmlFor="practical" className="text-xs font-sans cursor-pointer">ปฏิบัติ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ไม่ระบุ" id="unspecified" />
                                <Label htmlFor="unspecified" className="text-xs font-sans cursor-pointer">ไม่ระบุ</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={adding}
                        className="font-sans"
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={adding || !roomNumber.trim() || isDuplicate}
                        className="font-sans"
                    >
                        {adding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                กำลังเพิ่ม...
                            </>
                        ) : (
                            "เพิ่มห้องเรียน"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}