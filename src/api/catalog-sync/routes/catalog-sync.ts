export default {
  routes: [
    {
      method: 'POST',
      path: '/internal/catalog-sync/product',
      handler: 'catalog-sync.product',
      config: { auth: false, policies: ['global::sync-token'] },
    },
    {
      method: 'POST',
      path: '/internal/catalog-sync/shop',
      handler: 'catalog-sync.shop',
      config: { auth: false, policies: ['global::sync-token'] },
    },
  ],
};
