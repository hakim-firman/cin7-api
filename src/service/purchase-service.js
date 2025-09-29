import apiClient from "../application/api-client.js";
import fetchAllData from "../utils/data-fetcher.js";
import { ResponseError } from "../error/response-error.js";
import { logger } from "../application/logging.js";


const getPurchaseList = async (req) => {
    const {page = 1, limit = 100} = req.query;

     try {
         const res = await fetchAllData('/purchaseList', page, limit,'PurchaseList');
         return res;
     } catch (err) {
         throw new ResponseError(500,err)
     }
    
}


const getPurchaseOrder = async (id) => {
    try {
        const response = await apiClient.get(`/purchase/order?TaskID=${id}`);
        return response.data;
    } catch (err) {
        throw new ResponseError(500,err)
    }
}

const getAdvancePurches = async (id)=> {
  try {
    const response = await apiClient.get(`/advanced-purchase?ID=${id}`);
    
    return response.data;
  } catch (error) {
    return { status: 500, message: "Internal Server Error" };
  }
}



const getDueInQty = async (req,sku) => {
  try {
    const result = await getPurchaseList(req)
    
    result = result.filter(item => item.Status !== 'VOIDED');
    
    let productLines = [];
    let dueQty = 0;
    for (const item of result) {
      const product = await getAdvancePurches(item.ID)
      const lines = product.Lines;
    const filteredLines = lines.filter(line => line.SKU === sku);
    productLines = productLines.concat(filteredLines);
    
    dueQty += filteredLines.reduce((acc, line) => acc + line.Quantity, 0);
    }

    return dueQty;
  }
  catch (e) {
    throw new ResponseError(500,e)
  }
}
const getInTransaction = async (req) => {
  try {
    const {sku ='',location = ''} = req.params;
    const result = await getPurchaseList(req);
    const filteredResult = result.filter(item => item.Status !== 'VOIDED' && (item.CombinedReceivingStatus == 'NOT RECEIVED' || item.CombinedReceivingStatus == 'PARTIALLY RECEIVED'));
    let productLines = [];
    let dueInboundQty = 0;
    const groupedByMonth = {};
    let dueInboundProductLines = [];

    const products = await Promise.all(filteredResult.map(item => getAdvancePurches(item.ID)));
    for (let i = 0; i < filteredResult.length; i++) {
      const item = filteredResult[i];
      const product = products[i];
      const Order = product.Order;

      if (product.Location !== location) {
        logger.info("Order.Location !== location");
        continue;
      }

      const filteredLines = Order.Lines.filter(line => line.SKU === sku);
      if (filteredLines.length === 0) continue;

      const monthKey = item.RequiredBy
        ? new Date(item.RequiredBy).toISOString().slice(0, 7)
        : 'unknown';

      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = { inbound: 0, inboundProductLines: [] };
      }

      const qtySum = filteredLines.reduce((acc, line) => acc + line.Quantity, 0);

      if (item.RequiredBy && new Date(item.RequiredBy) < new Date()) {
        // overdue (DUE)
        dueInboundQty += qtySum;
        dueInboundProductLines = dueInboundProductLines.concat(filteredLines);
      } else {
        // future inbound
        groupedByMonth[monthKey].inbound += qtySum;
        groupedByMonth[monthKey].inboundProductLines =
          groupedByMonth[monthKey].inboundProductLines.concat(filteredLines);
      }
    }

    const sortedMonths = Object.keys(groupedByMonth).sort();
    const resultByMonth = sortedMonths.map(month => ({
      month,
      inboundQty: groupedByMonth[month].inbound,
      inboundProductLines: groupedByMonth[month].inboundProductLines,
    }));

    return {
      resultByMonth,
      due: {
        dueInboundQty,
        dueInboundProductLines,
      },
    };
  }
  catch (e) {
    logger.error("error getInTransaction:",e)
    throw new ResponseError(500,e)
  }
}


export default {
    getPurchaseList,
    getDueInQty,
    getPurchaseOrder,
    getInTransaction,
    getAdvancePurches,
    
}