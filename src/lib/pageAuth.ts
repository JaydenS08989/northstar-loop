import { buildClerkProps, getAuth } from "@clerk/nextjs/server";
import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
export const requirePageAuth = (ctx: GetServerSidePropsContext): GetServerSidePropsResult<Record<string, unknown>> => { const { isAuthenticated } = getAuth(ctx.req); if (!isAuthenticated) return { redirect: { destination: `/sign-in?redirect_url=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } }; return { props: { ...buildClerkProps(ctx.req) } }; };
