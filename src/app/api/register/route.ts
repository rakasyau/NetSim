import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, User, ActivityLog } from "@/lib/db";

/* ---------------------------------------------------------
 * POST /api/register — daftar user baru
 * Validasi zod → cek duplikat → simpan (bcrypt hash di model)
 * ------------------------------------------------------- */
const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
  institution: z.string().trim().max(150).optional().default(""),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, institution } = parsed.data;

    await connectDB();

    // Cek duplikat email
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      institution,
      authProvider: "credentials",
      lastLoginAt: null,
    });

    await ActivityLog.create({
      userId: user._id,
      action: "login",
      metadata: { kind: "register" },
    });

    return NextResponse.json(
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          institution: user.institution,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
