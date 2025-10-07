import apiClient from "../application/api-client.js";
import { ResponseError } from "../error/response-error.js";
import fetchAllData from "../utils/data-fetcher.js";

const getProductAvailability = async (req) => {
      const { SKU = '', location = '', page = 1, limit = 100 } = req.query;
      const responseAll = await fetchAllData(`/ref/productavailability?SKU=${SKU}&Location=${location}`, page, limit, 'ProductAvailabilityList');
      
      const result = responseAll.reduce((acc, item) => {
        if (!acc[`${item.SKU}-${item.Location}`]) {
          acc[`${item.SKU}-${item.Location}`] = {
            ID: item.ID,
            SKU: item.SKU,
            Name: item.Name,
            Barcode: item.Barcode,
            Location: item.Location,
            Bin: item.Bin,
            Batch: item.Batch,
            ExpiryDate: item.ExpiryDate,
            OnHand: 0,
            Allocated: 0,
            Available: 0,
            OnOrder: 0,
            StockOnHand: 0,
            InTransit: 0,
            NextDeliveryDate: item.NextDeliveryDate
          };
        }
        
        acc[`${item.SKU}-${item.Location}`].OnHand += item.OnHand;
        acc[`${item.SKU}-${item.Location}`].Allocated += item.Allocated;
        acc[`${item.SKU}-${item.Location}`].Available += item.Available;
        acc[`${item.SKU}-${item.Location}`].OnOrder += item.OnOrder;
        acc[`${item.SKU}-${item.Location}`].StockOnHand += item.StockOnHand;
        acc[`${item.SKU}-${item.Location}`].InTransit += item.InTransit;
        
        return acc;
      }, {});

      return Object.values(result);
      
}

const getProductAvailabilityBySKU = async (sku,location) => {
      
      const responseAll =  await fetchAllData(`/ref/productavailability?SKU=${sku}&Location=${location}`,1,100,'ProductAvailabilityList');
        
      const result = responseAll.reduce((acc, item) => {
        if (!acc[`${item.SKU}-${item.Location}`]) {
          acc[`${item.SKU}-${item.Location}`] = {
            ID: item.ID,
            SKU: item.SKU,
            Name: item.Name,
            Barcode: item.Barcode,
            Location: item.Location,
            Bin: item.Bin,
            Batch: item.Batch,
            ExpiryDate: item.ExpiryDate,
            OnHand: 0,
            Allocated: 0,
            Available: 0,
            OnOrder: 0,
            StockOnHand: 0,
            InTransit: 0,
            NextDeliveryDate: item.NextDeliveryDate
          };
        }
        
        acc[`${item.SKU}-${item.Location}`].OnHand += item.OnHand;
        acc[`${item.SKU}-${item.Location}`].Allocated += item.Allocated;
        acc[`${item.SKU}-${item.Location}`].Available += item.Available;
        acc[`${item.SKU}-${item.Location}`].OnOrder += item.OnOrder;
        acc[`${item.SKU}-${item.Location}`].StockOnHand += item.StockOnHand;
        acc[`${item.SKU}-${item.Location}`].InTransit += item.InTransit;
        
        return acc;
      }, {});

      return Object.values(result);
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