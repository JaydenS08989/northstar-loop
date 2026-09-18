import type React from "react";
import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Alert, AppShell, Badge, Button, Card, FormField, Input } from "@/components";
import { apiFetch, queryKeys, requirePageAuth } from "@/lib";
import type { UserProfile } from "@/types";
import { settingsSchema, type SettingsValues } from "@/validation";

type TotpSetup = { secret: string; uri: string };

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const profile = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiFetch<UserProfile>("/api/profile"),
  });
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      profile: { displayName: "" },
      planning: { dailyAvailableMinutes: 90, defaultFocusMinutes: 30, workingDays: [1, 2, 3, 4, 5], workStyle: "balanced" },
      notifications: { goalCompleted: true, milestoneCompleted: true, planningReminders: true },
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      profile: { displayName: profile.data.displayName },
      planning: profile.data.planning,
      notifications: profile.data.notifications,
    });
  }, [form, profile.data]);

  const save = useMutation({
    mutationFn: (values: SettingsValues) => apiFetch<UserProfile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        displayName: values.profile.displayName,
        planning: values.planning,
        notifications: values.notifications,
      }),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      form.reset(form.getValues());
    },
  });

  const createTotp = async () => {
    if (!user) return;
    setSecurityMessage(null);
    try {
      const resource = await user.createTOTP();
      setTotpSetup({ secret: resource.secret, uri: resource.uri });
    } catch {
      setSecurityMessage("Authenticator setup is unavailable for this account configuration.");
    }
  };

  const verifyTotp = async () => {
    if (!user) return;
    setSecurityMessage(null);
    try {
      await user.verifyTOTP({ code: totpCode });
      await user.reload();
      setTotpSetup(null);
      setTotpCode("");
      setSecurityMessage("Authenticator verification is now enabled.");
    } catch {
      setSecurityMessage("That authenticator code could not be verified.");
    }
  };

  const disableTotp = async () => {
    if (!user) return;
    setSecurityMessage(null);
    try {
      await user.disableTOTP();
      await user.reload();
      setSecurityMessage("Authenticator verification has been disabled.");
    } catch {
      setSecurityMessage("We couldn't change your authenticator settings.");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your Northstar Loop account and application data? This cannot be undone.")) return;
    await apiFetch<{ deleted: true }>("/api/account", { method: "DELETE" });
    await signOut({ redirectUrl: "/" });
  };

  return (
    <AppShell title="Settings">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-neutral-600">Basic account information used inside Northstar Loop.</p>
          </div>
          <form className="flex flex-col gap-5" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
            <FormField label="Display name" htmlFor="displayName" error={form.formState.errors.profile?.displayName?.message}>
              <Input id="displayName" {...form.register("profile.displayName")} />
            </FormField>
            <FormField label="Email" htmlFor="email" hint="Authentication identity is managed by Clerk.">
              <Input id="email" value={profile.data?.email ?? user?.primaryEmailAddress?.emailAddress ?? ""} disabled readOnly />
            </FormField>

            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-xl font-semibold">Planning</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FormField label="Available minutes per day" htmlFor="daily" error={form.formState.errors.planning?.dailyAvailableMinutes?.message}>
                  <Input id="daily" type="number" {...form.register("planning.dailyAvailableMinutes", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Default focus duration" htmlFor="focus" error={form.formState.errors.planning?.defaultFocusMinutes?.message}>
                  <Input id="focus" type="number" {...form.register("planning.defaultFocusMinutes", { valueAsNumber: true })} />
                </FormField>
              </div>
              <FormField label="Work style" htmlFor="workStyle" error={form.formState.errors.planning?.workStyle?.message}>
                <select id="workStyle" className="min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-neutral-200" {...form.register("planning.workStyle")}>
                  <option value="short">Short sessions</option>
                  <option value="balanced">Balanced</option>
                  <option value="deep">Deep work</option>
                </select>
              </FormField>
              <fieldset className="mt-5">
                <legend className="text-sm font-medium">Working days</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                      <input type="checkbox" value={value} className="size-4 accent-black" {...form.register("planning.workingDays", { valueAsNumber: true })} />
                      {label}
                    </label>
                  ))}
                </div>
                {form.formState.errors.planning?.workingDays?.message ? <p className="mt-2 text-xs text-red-700">{form.formState.errors.planning.workingDays.message}</p> : null}
              </fieldset>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="size-4 accent-black" {...form.register("notifications.goalCompleted")} />
                  <span>Goal completion emails</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="size-4 accent-black" {...form.register("notifications.milestoneCompleted")} />
                  <span>Milestone completion emails</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="size-4 accent-black" {...form.register("notifications.planningReminders")} />
                  <span>Planning reminder emails</span>
                </label>
              </div>
            </div>

            {save.isError ? <Alert title="Settings not saved" content="We couldn't update your preferences. Please try again." variant="destructive" /> : null}
            {save.isSuccess ? <Alert title="Settings saved" content="Your profile and planning preferences are up to date." variant="success" /> : null}
            <div><Button type="submit" loading={save.isPending} disabled={!form.formState.isDirty}>Save settings</Button></div>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-semibold">Security</h2><p className="mt-1 text-sm text-neutral-600">Manage password and multi-factor protection with Clerk-backed account primitives.</p></div>
            <Badge>{user?.twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}</Badge>
          </div>
          {securityMessage ? <div className="mt-5"><Alert title="Security update" content={securityMessage} variant="info" /></div> : null}
          <div className="mt-6 rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-medium">Authenticator app</p><p className="mt-1 text-sm text-neutral-600">Use time-based one-time passwords as a second factor.</p></div>
              {user?.totpEnabled ? <Button variant="secondary" type="button" onClick={disableTotp}>Disable</Button> : <Button type="button" onClick={createTotp}>Set up</Button>}
            </div>
            {totpSetup ? <div className="mt-5 border-t border-neutral-200 pt-5"><p className="text-sm text-neutral-700">Add this secret to your authenticator app, then enter a generated code.</p><code className="mt-3 block break-all rounded-lg bg-neutral-100 p-3 text-xs">{totpSetup.secret}</code><p className="mt-2 break-all text-xs text-neutral-500">{totpSetup.uri}</p><div className="mt-4 flex gap-2"><Input aria-label="Authenticator verification code" value={totpCode} onChange={(event) => setTotpCode(event.target.value)} inputMode="numeric" /><Button type="button" onClick={verifyTotp}>Verify</Button></div></div> : null}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold">Account</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="secondary" type="button" onClick={() => signOut({ redirectUrl: "/" })}>Log out</Button>
            <Button variant="destructive" type="button" onClick={deleteAccount}>Delete account</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => requirePageAuth(ctx);
export default SettingsPage;
