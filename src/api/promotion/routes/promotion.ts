export default {
  routes: [
    {
      method: "GET",
      path: "/promotions/preview/:documentId",
      handler: "promotion.preview",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/promotions/active",
      handler: "promotion.active",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/promotions/:slug",
      handler: "promotion.findBySlug",
      config: { auth: false },
    },
  ],
};
