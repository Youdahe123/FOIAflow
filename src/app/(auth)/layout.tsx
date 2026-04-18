import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            <span className="font-heading text-3xl text-primary tracking-tight">
              Snowden
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="border border-border bg-surface px-6 py-8 sm:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
