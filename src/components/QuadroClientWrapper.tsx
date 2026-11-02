"use client";

import dynamic from "next/dynamic";
import React from "react";

const QuadroCanvasInternal = dynamic(
  () => import("./QuadroCanvas").then((mod) => mod.QuadroCanvas),
  { ssr: false }
);

export function QuadroClientWrapper(props: any) {
  return <QuadroCanvasInternal {...props} />;
}
