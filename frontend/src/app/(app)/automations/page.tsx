import { Suspense } from "react";
import { Workspace } from "@/components/app/workspace";

export default function AutomationsPage() {
  return (
    <div className="h-full">
      <Suspense fallback={null}>
        <Workspace />
      </Suspense>
    </div>
  );
}
