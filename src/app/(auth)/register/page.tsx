"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, institution }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar. Coba lagi.");
        setLoading(false);
        return;
      }

      // Langsung login otomatis setelah register
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan koneksi. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[380px] card-dark p-8">
      <h1 className="font-[var(--font-manrope)] font-bold text-xl mb-1.5">
        Buat akun NetSim
      </h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-6">
        Gratis — untuk menyimpan topologi &amp; konfigurasi jaringannya.
      </p>

      {error && (
        <div className="mb-4 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            required
            className="input-dark"
            placeholder="Raka Syauqi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
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
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            className="input-dark"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Institusi <span className="normal-case text-[var(--text-dim)] font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            className="input-dark"
            placeholder="Sekolah / Kampus / Perusahaan"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-accent w-full mt-1">
          {loading ? "Membuat akun..." : "Daftar"}
        </button>
      </form>

      <p className="text-[13px] text-[var(--text-muted)] text-center mt-6">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-[var(--accent)] font-semibold no-underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
