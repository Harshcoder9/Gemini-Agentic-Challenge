'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';

export function Navbar() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="animate-slide-down sticky top-0 z-40 border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-white/5 dark:bg-[#050d1a]/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-blue-600">
            Fin<span className="text-zinc-900 dark:text-white">Agent</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link
            href="/"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/portfolio"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Portfolio
          </Link>

          <Link
            href="/chart-vision"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Chart Vision
          </Link>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {loading ? (
            <Spinner size="sm" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? 'User avatar'}
                  className="h-8 w-8 rounded-full ring-2 ring-blue-500"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:inline">
                {user.displayName}
              </span>
              <button
                onClick={signOutUser}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
