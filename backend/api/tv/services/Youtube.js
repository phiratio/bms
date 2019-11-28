'use strict';
const fetch = require('node-fetch');
/**
 * Youtube.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

const YOUTUBE_API_KEY_NAMESPACE = 'config:tv:youtube:apiKey';

module.exports = {
  async getKey() {
    const cachedKey = await strapi.connections.redis.get(YOUTUBE_API_KEY_NAMESPACE);
    if (cachedKey) {
      return cachedKey;
    } else {
      const configStore = await strapi.store({ environment: '', type: 'plugin', name: 'tv', }).get({ key: 'youtube' });
      const key = configStore.apiKey;
      strapi.connections.redis.set(YOUTUBE_API_KEY_NAMESPACE, key);
      return key;
    }
  },

  async request(params = {}, method = 'GET') {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/search/?';
    const key = await strapi.services.youtube.getKey();
    const searchParams = new URLSearchParams({...params, ...{ key: key }});
    return fetch(baseUrl + searchParams, {
      method,
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .catch(e => {
        return new Error(e);
      })
  },

  search(query, maxResults = 5, pageToken) {
    return strapi.services.youtube.request({
      q: query,
      type: 'video',
      part: 'snippet',
      maxResults,
      ...( pageToken && { pageToken: pageToken } ),
    })
  },

  getRelatedVideo(relatedVideoId, maxResults = 1, pageToken) {
    return strapi.services.youtube.request({
      relatedToVideoId: relatedVideoId,
      type: 'video',
      part: 'snippet',
      maxResults,
      ...( pageToken && { pageToken: pageToken } ),
    })
  }

};
