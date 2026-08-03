import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/middleware";

async function login(formData: FormData) {
  "use server";
  const id = formData.get("id");
  const password = formData.get("password");
  if (
    !process.env.ADMIN_ID ||
    !process.env.ADMIN_PASSWORD ||
    id !== process.env.ADMIN_ID ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    redirect("/admin/login?error=1");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, process.env.ADMIN_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin/write");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-serif text-2xl">Muse of Seoul Studio</h1>
      <p className="mt-1 text-sm text-black/50">관리자 아이디와 비밀번호를 입력하세요.</p>
      <form action={login} className="mt-8 flex flex-col gap-3">
        <input
          type="text"
          name="id"
          required
          autoFocus
          placeholder="ID"
          className="rounded-md border border-black/15 px-4 py-3 text-sm outline-none focus:border-black/40"
        />
        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="rounded-md border border-black/15 px-4 py-3 text-sm outline-none focus:border-black/40"
        />
        {error && <p className="text-sm text-red-600">비밀번호가 틀렸어요.</p>}
        <button className="rounded-md bg-black px-4 py-3 text-sm text-white hover:bg-black/80">로그인</button>
      </form>
    </main>
  );
}
