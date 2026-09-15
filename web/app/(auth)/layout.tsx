import { AuthProvider } from "@/lib/firebase/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Civic Right", template: "%s | Civic Right" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        {children}
      </div>
    </AuthProvider>
  );
}
