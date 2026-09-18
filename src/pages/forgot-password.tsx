import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSignIn } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, Button, Card, FormField, Input, Logo } from "@/components";
import {
  forgotPasswordEmailSchema,
  newPasswordSchema,
  verificationCodeSchema,
  type ForgotPasswordEmailValues,
  type NewPasswordValues,
  type VerificationCodeValues,
} from "@/validation";

type Step = "email" | "code" | "password";

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [step, setStep] = useState<Step>("email");
  const [formError, setFormError] = useState<string | null>(null);
  const emailForm = useForm<ForgotPasswordEmailValues>({ resolver: zodResolver(forgotPasswordEmailSchema) });
  const codeForm = useForm<VerificationCodeValues>({ resolver: zodResolver(verificationCodeSchema) });
  const passwordForm = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema) });

  const sendCode = emailForm.handleSubmit(async ({ email }) => {
    setFormError(null);
    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) return setFormError(createError.message || "We couldn't start the reset flow.");
    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) return setFormError(error.message || "We couldn't send the reset code.");
    setStep("code");
  });

  const verifyCode = codeForm.handleSubmit(async ({ code }) => {
    setFormError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) return setFormError(error.message || "That code couldn't be verified.");
    setStep("password");
  });

  const resetPassword = passwordForm.handleSubmit(async ({ password }) => {
    setFormError(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });
    if (error) return setFormError(error.message || "We couldn't update your password.");
    if (signIn.status === "needs_second_factor") {
      await router.push("/two-factor");
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/dashboard");
          if (url.startsWith("http")) window.location.href = url;
          else void router.push(url);
        },
      });
    }
  });

  const busy = fetchStatus === "fetching";
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md p-7">
        <Logo />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-neutral-600">Verify your email, then choose a new password.</p>
        {formError ? <div className="mt-5"><Alert title="Reset failed" content={formError} variant="destructive" /></div> : null}

        {step === "email" ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={sendCode}>
            <FormField label="Email" htmlFor="email" error={emailForm.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...emailForm.register("email")} />
            </FormField>
            <Button type="submit" loading={busy || emailForm.formState.isSubmitting}>Send reset code</Button>
          </form>
        ) : null}

        {step === "code" ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={verifyCode}>
            <FormField label="Verification code" htmlFor="code" error={codeForm.formState.errors.code?.message}>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" {...codeForm.register("code")} />
            </FormField>
            <Button type="submit" loading={busy || codeForm.formState.isSubmitting}>Verify code</Button>
          </form>
        ) : null}

        {step === "password" ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={resetPassword}>
            <FormField label="New password" htmlFor="password" error={passwordForm.formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...passwordForm.register("password")} />
            </FormField>
            <Button type="submit" loading={busy || passwordForm.formState.isSubmitting}>Set new password</Button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-neutral-600"><Link className="font-medium text-black underline" href="/sign-in">Back to sign in</Link></p>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
