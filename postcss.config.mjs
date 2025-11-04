import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/**
 * Prefer Tailwind v4 postcss plugin if available, else fallback to v3 plugin name.
 */
function resolvePlugins() {
  try {
    require.resolve('@tailwindcss/postcss')
    return { '@tailwindcss/postcss': {} }
  } catch (_) {
    return { tailwindcss: {} }
  }
}

export default {
  plugins: resolvePlugins(),
}
