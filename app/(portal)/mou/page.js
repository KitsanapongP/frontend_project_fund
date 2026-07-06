"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MouPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mou/admin_dashboard");
  }, [router]);

  return null;
}
