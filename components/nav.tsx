"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  tour: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/bracket", label: "Bracket", tour: "nav-bracket", icon: "🏆" },
  { href: "/players", label: "Jugadores", tour: "nav-players", icon: "👥" },
  { href: "/ranking", label: "Ranking", tour: "nav-ranking", icon: "📊" },
];

const ADMIN_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  tour: "nav-admin",
  icon: "🛠️",
};

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            data-tour={item.tour}
            href={item.href}
            className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-[#1769e0] !text-white shadow-[0_8px_24px_rgba(23,105,224,0.28)]"
                : "!text-[#c8d2e3] hover:bg-white/8 hover:!text-white"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomTabsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[var(--chrome-line)] bg-[var(--chrome)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            data-tour={item.tour}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
              active ? "!text-[#ffd45a]" : "!text-[#c8d2e3]"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
