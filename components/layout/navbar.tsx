import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-50 border-b border-subtle bg-bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-text-primary hover:text-accent transition-colors"
          >
            GameShelf
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/games"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Games
            </Link>
            <Link
              href="/forum"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Forum
            </Link>
          </nav>
        </div>

        <NavbarClient session={session} />
      </div>
    </header>
  );
}
