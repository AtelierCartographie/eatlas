Components inside this directory are used for the Server Side Rendering
as a templating engine in order to produce both previews and the final
static HTML.

Why are they in the `/client` directory then? Because they could potentially
be used by the client to render preview without the server help.
