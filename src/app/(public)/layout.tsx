import type { ReactNode } from "react";
import Navbar from "@/components/ui/Navbar";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
