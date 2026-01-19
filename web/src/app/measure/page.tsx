import { Suspense } from "react";
import MeasureClient from "./MeasureClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MeasureClient />
    </Suspense>
  );
}