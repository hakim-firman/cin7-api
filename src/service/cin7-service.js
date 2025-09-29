import apiClient from "../application/api-client.js";
import { ResponseError } from "../error/response-error.js";
import fetchAllData from "../utils/data-fetcher.js";

const getProductAvailability = async (req) => {
      const {SKU ='' , location='', page=1 , limit=100 } = req.query;
      const response =  await apiClient.get(`/ref/productavailability?Page=${page}&Limit=${limit}&SKU=${SKU}&Location=${location}`);
      return response.data;
}
const getProductAvailabilityBySKU = async (sku,location) => {
      
      const response =  await apiClient.get(`/ref/productavailability?Page=1&Limit=100&SKU=${sku}&Location=${location}`);
      return response.data;
}

const getProductBySKU = async (req) => {
      const {sku ='' , page=1 , limit=100 } = req.params;
      const currentDate = new Date();
      const modifiedSinceDate = new Date(currentDate.setMonth(currentDate.getMonth() - 12));
      const modifiedSince = modifiedSinceDate.toISOString();
      const response = await apiClient.get(`/product?Page=${page}&Limit=${limit}&Sku=${sku}&IncludeMovements=true&ModifiedSince=${modifiedSince}`);
      return response.data;
}

const getSOH = async (req) => {
      const {SKU ='' , location='', page=1 , limit=100 } = req.query;
      const response =  await apiClient.get(`/ref/productavailability?Page=${page}&Limit=${limit}&SKU=${SKU}&Location=${location}`);
      return response.data;
}

const getLocations = async () => {
      try {
      const response =  await fetchAllData(`/ref/location`,1,100,'LocationList');
      return response;
      }
      catch (e) {
        throw new ResponseError(500,e)
      }
}

export default {
    getProductAvailability,
    getSOH,
    getProductBySKU,
    getProductAvailabilityBySKU,
    getLocations
}