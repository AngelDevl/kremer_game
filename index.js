export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Define route mappings
    const routes = {
      "/": "game.html",
      "/game": "game.html",
      "/privacy-policy": "privacy_policy.html",
      "/terms-of-service": "terms_of_service.html"
    };
    
    // Check if the path exists in our routes
    if (routes[path]) {
      try {
        // Try to fetch the associated HTML file
        const response = await fetch(new URL(routes[path], url.origin));
        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.error(`Error serving ${routes[path]}:`, error);
      }
    }
    
    // If we get here, either the route doesn't exist or there was an error
    // Serve the not_found.html page with a 404 status
    try {
      const notFoundResponse = await fetch(new URL("not_found.html", url.origin));
      if (notFoundResponse.ok) {
        return new Response(await notFoundResponse.text(), {
          status: 404,
          headers: {
            "Content-Type": "text/html;charset=UTF-8"
          }
        });
      }
    } catch (error) {
      console.error("Error serving not_found.html:", error);
    }
    
    // Fallback if even not_found.html fails
    return new Response("404 - Page Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      }
    });
  }
};