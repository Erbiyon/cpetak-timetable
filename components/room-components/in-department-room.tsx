import DelectRoomButtonCustom from "../delect-room-button/delect-room-button-custom";
import AddRoomCustom from "../add-room/add-room-custom";
import EditRoomCustom from "../edit-room/edit-room-custom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Building2, Loader2, School } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";

interface Room {
  id: number;
  roomCode: string;
  roomType: string;
  roomCate?: string;
}

export default function IndepartmentRoom() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/room");
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((r: Room) => r.roomType === "อาคารสาขาวิศวกรรมคอมพิวเตอร์");
        setRooms(filtered);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDeleted = () => {
    fetchRooms();
  };

  const handleRoomAdded = () => {
    fetchRooms();
  };

  const handleRoomUpdated = () => {
    fetchRooms();
  };

  return (
    <div className="bg-card text-card-foreground flex flex-col rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 border-b border-border/80 bg-muted/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 font-sans">
              <School className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              อาคารสาขาวิศวกรรมคอมพิวเตอร์
            </h2>
            <Badge variant="outline" className="text-xs font-mono font-medium border-border">
              {rooms.length} ห้อง
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            ห้องบรรยายและห้องปฏิบัติการเฉพาะสาขาวิชา
          </p>
        </div>
        <AddRoomCustom
          onRoomAdded={handleRoomAdded}
          title="อาคารสาขาวิศวกรรมคอมพิวเตอร์"
        />
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground font-sans">
              กำลังโหลดข้อมูลห้อง...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-b border-border/70 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-foreground font-sans">
                    เลขห้อง
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-foreground font-sans">
                    ประเภทห้อง
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-foreground font-sans">
                    ดำเนินการ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <TableRow key={room.id} className="hover:bg-muted/30 transition-colors border-b border-border/60">
                      <TableCell className="font-mono text-xs font-medium text-foreground">
                        {room.roomCode}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-normal font-sans bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                        >
                          {room.roomCate || "ห้องปฏิบัติการ/บรรยาย"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <EditRoomCustom
                            roomId={String(room.id)}
                            roomCode={room.roomCode}
                            roomType={room.roomType}
                            roomCate={room.roomCate || ""}
                            onRoomUpdated={handleRoomUpdated}
                          />
                          <DelectRoomButtonCustom
                            roomId={String(room.id)}
                            roomName={room.roomCode}
                            onDeleted={handleDeleted}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-10 text-xs font-sans"
                    >
                      <Building2 className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/60" />
                      ไม่มีข้อมูลห้องเรียนในอาคารสาขา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
