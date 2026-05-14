import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'turntable.fm — reborn',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

// One-shot reload when a chunk fails to load — covers the brief window after
// a deploy where the HTML references new asset hashes but the static files
// haven't fully propagated to the edge that served the HTML.
const chunkReloadScript = `
  (function(){
    var KEY = "__chunk_reload_at";
    function reload(){
      var now = Date.now();
      var last = +(sessionStorage.getItem(KEY) || 0);
      if (now - last < 8000) return; // avoid reload loops
      sessionStorage.setItem(KEY, String(now));
      location.reload();
    }
    window.addEventListener("error", function(e){
      var msg = e && (e.message || (e.error && e.error.message)) || "";
      if (/Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError/i.test(msg)) reload();
    });
    window.addEventListener("unhandledrejection", function(e){
      var msg = e && e.reason && (e.reason.message || String(e.reason)) || "";
      if (/Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError/i.test(msg)) reload();
    });
  })();
`;

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: chunkReloadScript }} />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
