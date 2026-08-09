const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

export const BASE_PATH =
  configuredBasePath && configuredBasePath !== "/"
    ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
    : "";

export function withBasePath(assetPath: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(assetPath)) return assetPath;

  const normalizedPath = `/${assetPath.replace(/^\/+/, "")}`;
  return `${BASE_PATH}${normalizedPath}`;
}
