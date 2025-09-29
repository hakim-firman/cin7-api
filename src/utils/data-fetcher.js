import apiClient from '../application/api-client.js';


const fetchAllData = async (url, page = 1, limit = 100, key = null) => {
  let allData = [];
  let currentPage = page;
  let hasMoreData = true;

  try {
      while (hasMoreData) {
          let queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
          queryParams.set('page', currentPage);
          queryParams.set('limit', limit);
          const baseUrl = url.split('?')[0];
          const fullUrl = `${baseUrl}?${queryParams.toString()}`;

          try {
              const res = await apiClient.get(fullUrl);

              if (!res?.data) {
                  throw new Error(`No response data from ${fullUrl}`);
              }

              if (!res.data[key]) {
                  throw new Error(`Response does not contain key "${key}"`);
              }
              allData = allData.concat(res.data[key]);

              const totalData = res.data.Total ?? 0;
              const totalPages = Math.ceil(totalData / limit);

              if (currentPage >= totalPages) {
                  hasMoreData = false;
              } else {
                  currentPage++;
              }
          } catch (err) {
              console.error(`Error fetching page ${currentPage}:`, err.message);
              hasMoreData = false;
              throw err;
          }
      }

      return allData;
  } catch (err) {
      console.error("Fatal error in fetchAllData:", err.message);
      throw new Error(`fetchAllData failed: ${err.message}`);
  }
};
export default fetchAllData;