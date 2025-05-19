export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Define route mappings
    const routes = {
      "/": "game.html",
      "/game": "game.html",
      "/privacy-policy": "privacy_policy.html",
      "/terms-of-service": "terms_of_service.html"
    };

    // Resolve static file path
    const fileToServe = routes[path] || "not_found.html";

    const assetRequest = new Request(new URL(`/${fileToServe}`, request.url), request);

    const assetResponse = await env.ASSETS.fetch(assetRequest);

    // Return 404 if route wasn't matched
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
