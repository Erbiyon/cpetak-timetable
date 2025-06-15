import InbuildingRoom from "@/components/room-components/in-building-room";
import IndepartmentRoom from "@/components/room-components/in-department-room";
import OutdepartmentRoom from "@/components/room-components/out-departmant-room";

export default function Rooms() {
    return (
        <div className="grid grid-cols-3 gap-4 p-5">
            <div>
                <IndepartmentRoom />
            </div>
            <div>
                <InbuildingRoom />
            </div>
            <div>
                <OutdepartmentRoom />
            </div>
        </div>
    )
}