"use client";

import dynamic from "next/dynamic";

export const RCVUploadDynamic = dynamic(
  () => import("./rcv-upload-client").then(mod => mod.RCVUploadClient),
  {
    ssr: false,
    loading: () => <div className="h-64 bg-muted/10 animate-pulse rounded-[2.5rem] border border-dashed border-border" />
  }
);
