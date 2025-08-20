"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Clock timer effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };

    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center font-[Geist]">
        <div className="text-neutral-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="h-screen flex items-center justify-center font-[Geist]">
        <div className="text-neutral-500 text-lg">Redirecting...</div>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="h-screen w-full flex items-center justify-center font-[Geist]">
      <div className="text-center max-w-2xl">
        {/* user */}
        <div className="mb-8">
          <h1 className="text-2xl text-neutral-300 mb-2">Dashboard</h1>
          <p className="text-neutral-500 text-sm">
            Welcome, {session.user?.email}
          </p>

          {/* clock */}
          <div className="mt-4 p-3 ">
            <div className="text-neutral-400 text-sm mb-1">Current Time</div>
            <div className="font-mono text-lg text-neutral-300">
              {currentTime}
            </div>
          </div>
        </div>

        {/* token  */}
        <div className="space-y-6 mb-8">
          <div className="text-center">
            <h2 className="text-lg text-neutral-400 mb-4">Token Status</h2>
            <div className="space-y-2 text-sm text-neutral-500">
              <p>
                <span className="text-neutral-400">Access Token:</span>{" "}
                <span
                  className={
                    session.accessToken ? "text-green-400" : "text-red-400"
                  }
                >
                  {session.accessToken ? "Present" : "Missing"}
                </span>
              </p>
              <p>
                <span className="text-neutral-400">Refresh Token:</span>{" "}
                <span
                  className={
                    session.refreshToken === null
                      ? "text-yellow-400"
                      : session.refreshToken
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {session.refreshToken === null
                    ? "NULL"
                    : session.refreshToken
                    ? "Present "
                    : "Missing"}
                </span>
              </p>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg text-neutral-400 mb-4">Auth flow</h3>
            <div className="space-y-3 text-xs text-neutral-500">
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    session.refreshToken ? "bg-green-400" : "bg-neutral-600"
                  }`}
                ></div>
                <span
                  className={
                    session.refreshToken
                      ? "text-neutral-300"
                      : "text-neutral-600"
                  }
                >
                  Step 1: Access token active
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    session.refreshToken === null
                      ? "bg-yellow-400"
                      : "bg-neutral-600"
                  }`}
                ></div>
                <span
                  className={
                    session.refreshToken === null
                      ? "text-neutral-300"
                      : "text-neutral-600"
                  }
                >
                  Step 2: Refresh token used
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-6">
          <Link
            href="/"
            className="text-neutral-700 hover:text-neutral-200 transition-colors duration-200 text-lg"
          >
            Home
          </Link>
          <button
            onClick={handleSignOut}
            className="text-neutral-700 hover:text-neutral-200 transition-colors duration-200 text-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
