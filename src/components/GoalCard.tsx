import type React from "react";
import Link from "next/link";
import type { Goal } from "@/types";
import { formatDate } from "@/utils";
import Badge from "./Badge";
import Card from "./Card";
type GoalCardProps = { goal: Goal; progress?: number };
const GoalCard: React.FC<GoalCardProps> = ({ goal, progress }) => <Link href={`/goals/${goal.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"><Card className="transition hover:border-neutral-400"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{goal.title}</h3><p className="mt-1 line-clamp-2 text-sm text-neutral-600">{goal.description || goal.successCriteria}</p></div><Badge>{goal.priority}</Badge></div><div className="mt-5 flex items-center justify-between text-xs text-neutral-500"><span>{progress === undefined ? goal.status.replaceAll("_", " ") : `${progress}% complete`}</span><span>{formatDate(goal.targetDate)}</span></div></Card></Link>;
export default GoalCard;
