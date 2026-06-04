"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

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
            alert("กรุณากรอกเลขห้อง");
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
                setRoomNumber("");
                setRoomCategory("บรรยาย");
                setOpen(false);
                if (onRoomAdded) {
                    onRoomAdded();
                }
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "เกิดข้อผิดพลาดในการเพิ่มห้อง");
            }
        } catch (error) {
            console.error("Error adding room:", error);
            alert("เกิดข้อผิดพลาดในการเพิ่มห้อง");
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
                <Button variant="outline">เพิ่มห้องใหม่</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        เพิ่มห้องใหม่
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roomNumber" className="text-right">
                            เลขห้อง
                        </Label>
                        <Input
                            id="roomNumber"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            className={`col-span-3 ${isDuplicate ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            placeholder="กรอกเลขห้อง"
                            disabled={adding}
                        />
                        {isDuplicate && (
                            <p className="col-span-3 col-start-2 text-xs text-red-500">
                                ห้องนี้มีอยู่แล้ว
                            </p>
                        )}
                    </div>

                    {title && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">อาคาร</Label>
                            <div className="col-span-3 text-sm text-muted-foreground">
                                {title}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">ประเภทห้อง</Label>
                        <RadioGroup
                            value={roomCategory}
                            onValueChange={setRoomCategory}
                            className="col-span-3"
                            disabled={adding}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="บรรยาย" id="lecture" />
                                <Label htmlFor="lecture">บรรยาย</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ปฏิบัติ" id="practical" />
                                <Label htmlFor="practical">ปฏิบัติ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ไม่ระบุ" id="unspecified" />
                                <Label htmlFor="unspecified">ไม่ระบุ</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={adding}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={adding || !roomNumber.trim() || isDuplicate}
                    >
                        {adding ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                กำลังเพิ่ม...
                            </>
                        ) : (
                            "เพิ่มห้อง"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}