"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="h-screen w-full flex items-center justify-center font-[Geist]">
      <nav className="absolute -translate-y-1/2 top-1/2 rounded-full px-10 py-2 border-neutral-800">
        <div className="flex flex-col items-center space-y-4">
          {/* Login Status */}
          <div className="text-center">
            {status === "loading" ? (
              <p className="text-neutral-500 text-sm">Loading...</p>
            ) : session ? (
              <div className="text-neutral-300 text-sm">
                <p>Welcome, {session.user?.email}</p>
                <p className="text-xs text-neutral-500">You are logged in</p>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">You are not logged in</p>
            )}
          </div>

          {/* Navigation Links */}
          <ul className="flex space-x-4">
            <li>
              <Link
                href="/dashboard"
                className="text-neutral-700 hover:text-neutral-200 transition-colors duration-200 text-lg"
              >
                Dashboard
              </Link>
            </li>
            <li>
              {session ? (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-neutral-700 cursor-pointer hover:text-neutral-200 transition-colors duration-200 text-lg"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-neutral-700 hover:text-neutral-200 transition-colors duration-200 text-lg"
                >
                  Login
                </Link>
              )}
            </li>
            <li>
              <a
                href="/register"
                className="text-neutral-700 hover:text-neutral-200 transition-colors duration-200 text-lg"
              >
                Register
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
