"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Resultados oficiales", icon: "⚽" },
  { href: "/admin/correcciones", label: "Correcciones de jugadores", icon: "🛠️" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              active
                ? "border border-[#4d9aff] bg-[#1769e0] !text-white shadow-[0_8px_24px_rgba(23,105,224,0.24)]"
                : "border border-white/15 bg-[#101f31] !text-[#dbe5f5] hover:border-[#4d9aff] hover:!text-white"
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
