"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Header from "../layout/Header";

export default function DetailLayout({ children }) {
  const { isLoading: isAuthLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthLoading) setIsReady(true);
  }, [isAuthLoading]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-24 lg:pt-22 px-4 pb-8 w-full flex justify-center">
        <div className="w-full max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
