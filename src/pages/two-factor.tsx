import type React from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, Button, Card, FormField, Input, Logo } from "@/components";
import { verificationCodeSchema, type VerificationCodeValues } from "@/validation";

type Factor = "totp" | "backup";

const TwoFactorPage: React.FC = () => {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [factor, setFactor] = useState<Factor>("totp");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VerificationCodeValues>({ resolver: zodResolver(verificationCodeSchema) });

  const submit = form.handleSubmit(async ({ code }) => {
    setFormError(null);
    const result = factor === "totp"
      ? await signIn.mfa.verifyTOTP({ code })
      : await signIn.mfa.verifyBackupCode({ code });
    if (result.error) return setFormError(result.error.message || "We couldn't verify that code.");
    if (signIn.status !== "complete") return setFormError("Additional verification is still required.");
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/dashboard");
        if (url.startsWith("http")) window.location.href = url;
        else void router.push(url);
      },
    });
  });

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md p-7">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Verify it's you</h1>
        <p className="mt-2 text-sm text-neutral-600">Enter a code from your authenticator app or use a backup code.</p>
        {formError ? <div className="mt-5"><Alert title="Verification failed" content={formError} variant="destructive" /></div> : null}
        <div className="mt-6 flex gap-2" role="group" aria-label="Verification method">
          <Button type="button" variant={factor === "totp" ? "primary" : "secondary"} onClick={() => setFactor("totp")}>Authenticator</Button>
          <Button type="button" variant={factor === "backup" ? "primary" : "secondary"} onClick={() => setFactor("backup")}>Backup code</Button>
        </div>
        <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
          <FormField label={factor === "totp" ? "Authenticator code" : "Backup code"} htmlFor="code" error={form.formState.errors.code?.message}>
            <Input id="code" autoComplete="one-time-code" {...form.register("code")} />
          </FormField>
          <Button type="submit" loading={fetchStatus === "fetching" || form.formState.isSubmitting}>Continue</Button>
        </form>
      </Card>
    </div>
  );
};

export default TwoFactorPage;
