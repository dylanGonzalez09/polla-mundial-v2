import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createProxySupabaseClient } from "@/lib/supabase/proxy";

const authRoutes = ["/login", "/register"];
const protectedRoutes = ["/bracket", "/ranking", "/players", "/admin"];

export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxySupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/bracket", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
