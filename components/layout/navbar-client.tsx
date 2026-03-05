"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { type Session } from "next-auth";
import { Avatar } from "@/components/ui/avatar";

export function NavbarClient({ session }: { session: Session | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="inline-flex h-8 items-center rounded-md bg-accent px-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-hover"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/library"
        className="hidden text-sm text-text-secondary hover:text-text-primary transition-colors md:block"
      >
        My Shelf
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="User menu"
          aria-expanded={menuOpen}
        >
          <Avatar
            src={session.user.image}
            name={session.user.name ?? session.user.username}
            size="sm"
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-subtle bg-bg-elevated py-1 shadow-xl">
            <div className="border-b border-subtle px-4 py-2.5">
              <p className="text-sm font-medium text-text-primary">
                {session.user.name ?? session.user.username}
              </p>
              <p className="text-xs text-text-tertiary">@{session.user.username}</p>
            </div>
            <nav className="py-1">
              <Link
                href={`/users/${session.user.username}`}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
              >
                Your Profile
              </Link>
              <Link
                href="/library"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
              >
                My Shelf
              </Link>
              <Link
                href="/feed"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
              >
                Activity Feed
              </Link>
            </nav>
            <div className="border-t border-subtle py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
