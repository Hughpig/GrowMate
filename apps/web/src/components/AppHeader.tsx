import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/dashboard", label: "总览" },
  { href: "/journal", label: "成长日记" },
  { href: "/mood", label: "情绪打卡" },
  { href: "/archive", label: "AI档案" },
  { href: "/ai", label: "AI陪伴" },
  { href: "/learn", label: "成长课程" },
  { href: "/community", label: "社区" },
];

export async function AppHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f6f4efcc] backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-violet-600 text-sm font-bold text-white shadow-md">
            G
          </span>
          <div>
            <div className="text-sm font-bold tracking-tight">GrowMate · 伴成长</div>
            <div className="text-[11px] text-stone-500">记录 · 识人 · 陪伴 · 成长</div>
          </div>
        </Link>

        {session ? (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-2.5 py-1.5 text-sm text-stone-600 hover:bg-white hover:text-stone-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-stone-600 sm:inline">
                {session.displayName}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                登录
              </Link>
              <Link href="/register" className="btn btn-primary">
                开启档案
              </Link>
            </>
          )}
        </div>
      </div>
      {session ? (
        <div className="container flex gap-2 overflow-x-auto pb-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}
