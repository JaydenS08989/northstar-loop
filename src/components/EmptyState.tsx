import type React from "react";
import Button from "./Button";
type EmptyStateProps = { title: string; description: string; action?: string; onAction?: () => void };
const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, onAction }) => <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-neutral-300 p-8"><h3 className="text-lg font-semibold">{title}</h3><p className="max-w-xl text-sm text-neutral-600">{description}</p>{action ? <Button onClick={onAction}>{action}</Button> : null}</div>;
export default EmptyState;
