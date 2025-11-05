import { NextRequest, NextResponse } from "next/server";
import { login } from "@/server/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    const result = await login(email, password, ip);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (!result.token) {
      return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 });
    }

    // Configurar cookie na resposta
    const response = NextResponse.json({ success: true, user: result.user });
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL") || error.message.includes("connection")) {
        return NextResponse.json({ error: "Servidor não configurado. Verifique DATABASE_URL." }, { status: 500 });
      }
      if (error.message.includes("JWT_SECRET")) {
        return NextResponse.json({ error: "Servidor não configurado. Verifique JWT_SECRET." }, { status: 500 });
      }
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

