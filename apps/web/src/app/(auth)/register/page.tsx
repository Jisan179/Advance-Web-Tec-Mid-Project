import Link from "next/link";
import { Button, Field } from "@/components/ui";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-muted">Registration preview. Use the Tester demo account to sign in.</p>
      <fieldset disabled className="mt-6 space-y-4">
        <Field label="Full name" autoComplete="name" />
        <Field label="Email" type="email" autoComplete="username" />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." />
        <Button type="button" variant="primary" className="w-full" disabled>Create account</Button>
      </fieldset>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link>
      </p>
    </>
  );
}
