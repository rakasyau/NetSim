"use client";

import { useEffect, useState, type FormEvent } from "react";

type Profile = {
  id: string;
  name: string;
  email: string;
  institution: string;
  role: string;
  createdAt: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name);
          setInstitution(data.user.institution ?? "");
        }
      })
      .catch(() => setError("Gagal memuat profil."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, institution }),
    });
    const data = await res.json().catch(() => ({}));

    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan.");
      return;
    }
    setMessage("Profil berhasil diperbarui ✅");
    setProfile(data.user);
  }

  return (
    <div className="max-w-[520px]">
      <h2 className="font-[var(--font-manrope)] font-bold text-xl mb-6">Pengaturan Profil</h2>

      {error && (
        <div className="mb-4 text-[13px] bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-[13px] bg-[var(--accent-dim)] border border-[var(--accent)]/40 text-[var(--accent)] rounded-lg px-3 py-2.5">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-dark p-6 flex flex-col gap-4">
        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            required
            className="input-dark"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Email <span className="text-[10px] normal-case">(tidak bisa diubah)</span>
          </label>
          <input
            type="email"
            disabled
            className="input-dark opacity-50 cursor-not-allowed"
            value={profile?.email ?? ""}
          />
        </div>

        <div>
          <label className="block text-[12px] text-[var(--text-dim)] uppercase tracking-wide font-semibold mb-1.5">
            Institusi
          </label>
          <input
            type="text"
            className="input-dark"
            placeholder="Sekolah / Kampus / Perusahaan"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-accent w-full mt-1">
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      {profile && (
        <p className="text-[11px] text-[var(--text-dim)] mt-4">
          Member sejak {new Date(profile.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {" · "}Role: {profile.role}
        </p>
      )}
    </div>
  );
}
