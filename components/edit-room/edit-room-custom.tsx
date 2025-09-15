"use client";

import { useState } from "react";
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
import { Loader2, Edit } from "lucide-react";

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

    const handleSubmit = async () => {
        if (!roomNumber.trim()) {
            alert("กรุณากรอกเลขห้อง");
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
                setOpen(false);


                if (onRoomUpdated) {
                    onRoomUpdated();
                }
            } else {
                alert("เกิดข้อผิดพลาดในการแก้ไขห้อง");
            }
        } catch (error) {
            console.error("Error updating room:", error);
            alert("เกิดข้อผิดพลาดในการแก้ไขห้อง");
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
                <Button variant="ghost" size="sm">
                    <Edit color="#ff8000" className="w-4 h-4 mr-1" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        แก้ไขข้อมูลห้อง
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
                            className="col-span-3"
                            placeholder="กรอกเลขห้อง"
                            disabled={updating}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">อาคาร</Label>
                        <div className="col-span-3 text-sm text-muted-foreground">
                            {roomType}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">ประเภทห้อง</Label>
                        <RadioGroup
                            value={roomCategory}
                            onValueChange={setRoomCategory}
                            className="col-span-3"
                            disabled={updating}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="บรรยาย" id="edit-lecture" />
                                <Label htmlFor="edit-lecture">บรรยาย</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ปฏิบัติ" id="edit-practical" />
                                <Label htmlFor="edit-practical">ปฏิบัติ</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={updating}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={updating || !roomNumber.trim()}
                    >
                        {updating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                กำลังแก้ไข...
                            </>
                        ) : (
                            "บันทึก"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}