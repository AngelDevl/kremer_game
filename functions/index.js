export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const routes = {
      "/": "game.html",
      "/game": "game.html",
      "/privacy-policy": "privacy_policy.html",
      "/terms-of-service": "terms_of_service.html"
    };

    const fileToServe = routes[path] || "not_found.html";
    const assetRequest = new Request(`https://static.kremer.men/${fileToServe}`, request);

    const assetResponse = await env.ASSETS.fetch(assetRequest);

    if (!routes[path] && assetResponse.ok) {
      return new Response(await assetResponse.text(), {
        status: 404,
        headers: {
          "Content-Type": "text/html;charset=UTF-8"
        }
      });
    }

    return assetResponse;
  }
};
