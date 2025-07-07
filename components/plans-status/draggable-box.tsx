import { useDraggable } from "@dnd-kit/core";

export default function DraggableBox({ id, label }: { id: string; label: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id
    });

    const style = {
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab"
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="rounded border shadow-sm bg-card w-[52px] h-[48px] flex items-center justify-center text-xs overflow-hidden mx-auto whitespace-pre-line"
        >
            {label}
        </div>
    );
}