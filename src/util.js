export function rateLimitInterceptor(axios, logger, defaultDelay = 1000) {
  axios.interceptors.response.use(
    response => response,
    async function interceptRateLimit(error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : defaultDelay;
        error.config._retryCount = (error.config._retryCount || 0) + 1;
        logger.warn(`${error.config._retryCount} Received status 429 (Too Many Requests). Retrying after ${waitTime / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        return axios.request(error.config); // Retry request
      }

      throw error;
    });
}

export function throttleInterceptor(axios, delay) {
  let lastRequestTime = 0;

  axios.interceptors.request.use(async function (config) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
    return config;
  });
}


