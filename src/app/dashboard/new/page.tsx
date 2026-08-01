import { redirect } from "next/navigation";

/* ---------------------------------------------------------
 * /dashboard/new — digantikan oleh CreateProjectDialog.
 * Tetap ada sebagai fallback (link lama / bookmark).
 * ------------------------------------------------------- */
export default function NewProjectPage() {
  redirect("/dashboard");
}
