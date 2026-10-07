import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Pina a raiz neste projeto. Há lockfiles soltos em diretórios ancestrais
// (~/package-lock.json) que fazem o Next inferir a raiz errada do workspace,
// quebrando a resolução de `@import "@heroui/styles"` no Tailwind v4.
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  allowedDevOrigins: ['192.168.1.36', '192.168.0.153'],
};

export default nextConfig;
