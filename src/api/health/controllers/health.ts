export default {
  async check(ctx: any) {
    try {
      await strapi.db.connection.raw('select 1');
      ctx.body = { status: 'ok' };
    } catch {
      ctx.status = 503;
      ctx.body = { status: 'unavailable' };
    }
  },
};
