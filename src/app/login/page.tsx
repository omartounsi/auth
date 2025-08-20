"use client";
import { useState } from "react";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        // Login successful, redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-left w-[17%] mx-auto justify-center">
      <Link href="/" className="p-2">
        <IoArrowBack className="w-7 h-7 rounded-full text-neutral-600/40 hover:text-neutral-500" />
      </Link>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border border-neutral-900 rounded-full px-4 py-2 focus:outline-none text-neutral-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-neutral-900 rounded-full p-4 py-2 focus:outline-none text-neutral-400"
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="border border-transparent text-neutral-700 cursor-pointer rounded-full px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:border-neutral-800 hover:text-neutral-500 transition-all duration-200"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
