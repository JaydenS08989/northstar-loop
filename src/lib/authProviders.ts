import type { IconType } from "react-icons";
import { FaApple, FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";

export type OAuthStrategy =
  | "oauth_google"
  | "oauth_github"
  | "oauth_microsoft"
  | "oauth_apple";

export type AuthProvider = {
  strategy: OAuthStrategy;
  label: string;
  icon: IconType;
};

const registry: Record<OAuthStrategy, AuthProvider> = {
  oauth_google: { strategy: "oauth_google", label: "Google", icon: FaGoogle },
  oauth_github: { strategy: "oauth_github", label: "GitHub", icon: FaGithub },
  oauth_microsoft: { strategy: "oauth_microsoft", label: "Microsoft", icon: FaMicrosoft },
  oauth_apple: { strategy: "oauth_apple", label: "Apple", icon: FaApple },
};

export const getConfiguredAuthProviders = (): AuthProvider[] =>
  (process.env.NEXT_PUBLIC_CLERK_OAUTH_STRATEGIES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is OAuthStrategy => value in registry)
    .map((value) => registry[value]);
