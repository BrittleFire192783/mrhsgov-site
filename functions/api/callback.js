function page(status, payload) {
  return `<!doctype html>
<html>
  <body>
    <script>
      const msg = 'authorization:github:${status}:${JSON.stringify(payload)}';
      if (window.opener) {
        window.opener.postMessage(msg, "*");
        window.close();
      }
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
    return new Response("Missing code", { status: 400 });
  }

  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
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

  const token = await tokenResp.json();

  if (!token.access_token) {
    return new Response(page("error", token), {
      headers: { "Content-Type": "text/html" },
      status: 401,
    });
  }

  return new Response(
    page("success", { token: token.access_token, provider: "github" }),
    { headers: { "Content-Type": "text/html" } }
  );
}