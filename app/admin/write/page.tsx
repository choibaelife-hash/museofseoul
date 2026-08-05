import { Suspense } from "react";
import { WriteWizard } from "@/components/admin/WriteWizard";

export default function AdminWritePage() {
  return (
    <Suspense fallback={null}>
      <WriteWizard />
    </Suspense>
  );
}
