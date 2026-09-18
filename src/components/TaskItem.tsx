import type React from "react";
import { CalendarClock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { Task } from "@/types";
import Badge from "./Badge";

type TaskItemProps = {
  task: Task;
  onComplete?: (task: Task) => void;
  onReopen?: (task: Task) => void;
  onReschedule?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete, onReopen, onReschedule, onEdit, onDelete }) => (
  <div className="flex items-center gap-3 border-b border-neutral-100 py-3 last:border-b-0">
    {task.status === "completed" && onReopen ? (
      <button type="button" aria-label={`Reopen ${task.title}`} onClick={() => onReopen(task)} className="grid size-5 shrink-0 place-items-center rounded-full border border-neutral-400 bg-black text-white">
        <RotateCcw className="size-3" />
      </button>
    ) : onComplete ? (
      <button type="button" aria-label={`Mark ${task.title} complete`} onClick={() => onComplete(task)} className="size-5 shrink-0 rounded-full border border-neutral-400 hover:border-black hover:bg-neutral-100" />
    ) : (
      <span className="size-5 shrink-0 rounded-full border border-neutral-300" aria-hidden />
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{task.title}</p>
      <p className="text-xs text-neutral-500">{task.estimatedMinutes} min{task.dueDate ? ` · due ${task.dueDate.slice(0, 10)}` : ""}</p>
    </div>
    <Badge tone={task.status === "blocked" ? "warning" : task.status === "completed" ? "success" : "neutral"}>{task.priority}</Badge>
    {onReschedule ? <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black" onClick={() => onReschedule(task)} aria-label={`Reschedule ${task.title}`}><CalendarClock className="size-4" /></button> : null}
    {onEdit ? <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><Pencil className="size-4" /></button> : null}
    {onDelete ? <button type="button" className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}><Trash2 className="size-4" /></button> : null}
  </div>
);

export default TaskItem;
