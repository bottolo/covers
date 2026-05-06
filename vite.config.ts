import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

function debugLog(hypothesisId: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/68f9398e-38f8-4dd5-93e6-d8cbb3b4d6b5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f800cc'},body:JSON.stringify({sessionId:'f800cc',runId:'pre-fix',hypothesisId,location:'vite.config.ts',message,data,timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

debugLog('H1', 'vite-config-loaded', {
  nodeEnv: process.env.NODE_ENV ?? null,
  hasCloudflareApiToken: Boolean(process.env.CLOUDFLARE_API_TOKEN),
  hasCloudflareAccountId: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
  hasWranglerEmail: Boolean(process.env.CLOUDFLARE_EMAIL),
})

export default defineConfig(({ command, mode }) => {
  debugLog('H2', 'defineConfig-invoked', { command, mode })
  debugLog('H3', 'cloudflare-plugin-enabled', { enabled: true })
  return {
    plugins: [react(), tailwindcss(), cloudflare()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
  }
})