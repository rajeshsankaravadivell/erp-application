import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>Your account doesn&apos;t have permission to view this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className="text-primary underline underline-offset-4">
            Back to home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
