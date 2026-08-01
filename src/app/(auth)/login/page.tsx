"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px] glass-panel rounded-xl p-8">
      <h1 className="text-[22px] font-semibold text-primary mb-1.5">
        Masuk ke NetSim
      </h1>
      <p className="text-[13px] text-secondary mb-6">
        Lanjutkan simulasi topologi jaringanmu.
      </p>

      {error && (
        <div className="mb-4 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block label-caps text-secondary mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            className="input-dark"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block label-caps text-secondary mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            className="input-dark"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-accent w-full mt-1">
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      <p className="text-[13px] text-secondary text-center mt-6">
        Belum punya akun?{" "}
        <Link href="/register" className="text-neon font-semibold no-underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
