"use client";

import { useRouter } from "next/navigation";
import { CreateProjectDialog } from "@/components/create-project-dialog";

/* Halaman Simulasi Baru — langsung tampilkan dialog create */
export function NewProjectClient() {
  const router = useRouter();
  return (
    <CreateProjectDialog
      open
      onClose={() => {
        router.back();
      }}
    />
  );
}
