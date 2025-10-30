export const isDev = process.env.NODE_ENV === 'development';
export const isProd = process.env.NODE_ENV === 'production';
export const enableReactCompiler = process.env.NEXT_ENABLE_REACT_COMPILER !== '0';

export function getEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}
