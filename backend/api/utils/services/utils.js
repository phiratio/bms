'use strict';

module.exports = {
  /**
   *  Gets socket ids from Redis of a provided user
   *  @param userId string MongoDB Id
   *  @returns Set of socket ids
   */
  getSockets: async userId => {
    const connections = new Set();
    const stream = await strapi.connections.redis.scanStream({
      match: `accounts:${userId}:sockets:*`,
    });
    stream.on('data', async resultKeys => {
      for (let i=0; i < resultKeys.length; i++) {
        connections.add(resultKeys[i]);
      }
    });
    let end = new Promise((resolve, reject) => {
      stream.on('end', () => resolve(connections));
      stream.on('error', reject);
    });
    return end;
  },
};
