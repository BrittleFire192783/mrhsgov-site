async function exchangeCodeForToken({ code, clientId, clientSecret }) {
  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  let json = null;
  try {
    json = await resp.json();
  } catch {
    // ignore
  }

  return { ok: resp.ok, status: resp.status, json };
}

function renderCallbackPage(status, payload) {
  const safePayload = JSON.stringify(payload ?? {});

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>AP Timeline CMS OAuth</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; }
      code { background: #f3f3f3; padding: 2px 6px; border-radius: 6px; }
      .hint { opacity: 0.75; margin-top: 10px; }
    </style>
  </head>
  <body>
    <h2>Returning to CMS</h2>
    <div id="status">Status: <code>${status}</code></div>
    <div class="hint">If this window does not close automatically, close it and refresh the CMS tab.</div>

    <script>
      (function () {
        const payloadJson = ${safePayload};
        const msgString = 'authorization:github:${status}:' + JSON.stringify(payloadJson);

        // Try to notify the opener (Decap CMS).
        try {
          if (window.opener && !window.opener.closed) {
            // Send the exact string format Decap listens for.
            window.opener.postMessage(msgString, window.location.origin);
            // Also send a permissive copy for browsers that are picky.
            window.opener.postMessage(msgString, '*');

            // Close after a brief delay.
            setTimeout(() => window.close(), 300);
            return;
          }
        } catch (e) {
          // ignore
        }

        // Fallback: if we have no opener, go back to the admin page.
        try {
          window.location.replace('/admin/');
        } catch (e) {
          // ignore
        }
      })();
    </script>
  </body>
</html>`;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response("Missing GitHub OAuth secrets", { status: 500 });
  }

  if (!code) {
    return new Response(renderCallbackPage("error", { error: "missing_code" }), {
      headers: { "Content-Type": "text/html" },
      status: 400,
    });
  }

  const exchanged = await exchangeCodeForToken({ code, clientId, clientSecret });

  const accessToken = exchanged?.json?.access_token;

  if (!accessToken) {
    return new Response(
      renderCallbackPage("error", {
        error: "token_exchange_failed",
        status: exchanged.status,
        details: exchanged.json || null,
      }),
      {
        headers: { "Content-Type": "text/html" },
        status: 401,
      }
    );
  }

  return new Response(
    // Decap expects a payload containing at least a token.
    renderCallbackPage("success", { token: accessToken }),
    { headers: { "Content-Type": "text/html" } }
  );
}