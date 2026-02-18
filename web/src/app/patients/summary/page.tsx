import { Suspense } from "react";
import SummaryClient from "./SummaryClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SummaryClient />
    </Suspense>
  );
}