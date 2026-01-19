import { Suspense } from "react";
import RecordsClient from "./RecordsClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RecordsClient />
    </Suspense>
  );
}