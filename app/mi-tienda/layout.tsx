"use client";
import React from "react";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AuthProvider } from "@/lib/AuthContext";
import { UserProvider } from "../context/UserContext";
import { Navbar } from "@/app/components/Navbar";
import Sidebar from "@/app/components/mi-tienda/Sidebar";
import BottomBar from "@/app/components/mi-tienda/BottomBar";

export default function PreClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            
            <div className="flex">
              <Sidebar />
              
              <main className="flex-1 md:ml-0 mb-16 md:mb-0 min-w-0">
                {children}
              </main>
            </div>
            
            <BottomBar />
          </div>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
