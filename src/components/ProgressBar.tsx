import type React from "react";
type ProgressBarProps = { value: number; label?: string };
const ProgressBar: React.FC<ProgressBarProps> = ({ value, label }) => { const safe = Math.min(100, Math.max(0, value)); return <div className="flex flex-col gap-2">{label ? <div className="flex justify-between text-xs text-neutral-600"><span>{label}</span><span>{safe}%</span></div> : null}<div className="h-2 overflow-hidden rounded-full bg-neutral-100" aria-label={label ?? "Progress"} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe}><div className="h-full rounded-full bg-black" style={{ width: `${safe}%` }} /></div></div>; };
export default ProgressBar;
