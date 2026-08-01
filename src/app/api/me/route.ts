import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB, User } from "@/lib/db";

/* ---------------------------------------------------------
 * GET /api/me — profil user yang login
 * PUT /api/me — update nama & institusi
 * ------------------------------------------------------- */
const updateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100).optional(),
  institution: z.string().trim().max(150).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      institution: user.institution,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: parsed.data },
    { new: true }
  );

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      institution: user.institution,
    },
  });
}
