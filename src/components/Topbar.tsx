import type React from "react";
import Link from "next/link";
import { Menu, Settings } from "lucide-react";
import { setMobileNavigationOpen, useAppDispatch } from "@/store";
import Logo from "./Logo";

type TopbarProps = { title: string };

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const dispatch = useAppDispatch();
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <button type="button" className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Open navigation" onClick={() => dispatch(setMobileNavigationOpen(true))}>
          <Menu className="size-5" aria-hidden />
        </button>
        <Logo />
      </div>
      <h1 className="hidden text-base font-semibold md:block">{title}</h1>
      <Link href="/settings" aria-label="Settings" className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"><Settings className="size-4" /></Link>
    </header>
  );
};

export default Topbar;
