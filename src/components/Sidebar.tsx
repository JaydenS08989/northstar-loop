import type React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { BarChart3, Crosshair, Goal, LayoutDashboard, ListTodo, Settings, X } from "lucide-react";
import { useAppDispatch, useAppSelector, setMobileNavigationOpen } from "@/store";
import { cn } from "@/utils";
import Logo from "./Logo";

const items = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/today", "Today", ListTodo],
  ["/goals", "Goals", Goal],
  ["/focus", "Focus", Crosshair],
  ["/insights", "Insights", BarChart3],
] as const;

const SidebarContents: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const router = useRouter();
  return (
    <>
      <div className="mb-8"><Logo /></div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Primary navigation">
        {items.map(([href, label, Icon]) => {
          const active = router.pathname === href || (href === "/goals" && router.pathname.startsWith("/goals/"));
          return (
            <Link
              href={href}
              key={href}
              onClick={onNavigate}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black", active && "bg-neutral-100 text-black")}
            >
              <Icon className="size-4" aria-hidden />{label}
            </Link>
          );
        })}
      </nav>
      <Link href="/settings" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-black">
        <Settings className="size-4" aria-hidden />Settings
      </Link>
    </>
  );
};

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.mobileNavigationOpen);
  const close = () => dispatch(setMobileNavigationOpen(false));

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-5 md:flex md:flex-col">
        <SidebarContents />
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/25" type="button" aria-label="Close navigation" onClick={close} />
          <aside className="relative flex h-full w-[min(19rem,88vw)] flex-col border-r border-neutral-200 bg-white p-5 shadow-xl">
            <button type="button" onClick={close} className="absolute right-4 top-4 rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Close navigation">
              <X className="size-5" />
            </button>
            <SidebarContents onNavigate={close} />
          </aside>
        </div>
      ) : null}
    </>
  );
};

export default Sidebar;
