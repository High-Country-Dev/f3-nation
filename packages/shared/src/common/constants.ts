// Use process.env so that importing here doesn't cause issues like circular dependencies

export const isProd = process.env.NEXT_PUBLIC_CHANNEL === "prod";

export const isDevelopment = process.env.NODE_ENV === "development";
export const isTest = process.env.NODE_ENV === "test";
