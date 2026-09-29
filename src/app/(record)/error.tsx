"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function RecordError({ reset }: { reset: () => void }) {
  return (
    <main className="px-4 py-6">
      <RouteError reset={reset} />
    </main>
  );
}
