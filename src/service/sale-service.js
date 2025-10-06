import apiClient from "../application/api-client.js";
import fetchAllData from "../utils/data-fetcher.js";
import { ResponseError } from "../error/response-error.js";
import { logger } from "../application/logging.js";


const getOutTransaction = async (req,sku) => {
  try {
    const {location = ''} = req.params;
    const result = await getSaleList(req);
    let productLines = [];
    let dueOutboundQty = 0;
    const groupedByMonth = {};
    let dueOutboundProductLines = [];
    let dueGroupedByMonth = {};
    
    const filteredResult = result.filter(item => item.Status !== 'VOIDED' && item.CombinedReceivingStatus !== 'SHIPPED');
    
    const salesOrder= await Promise.all(filteredResult.map(item => getAdvanceSale(item.SaleID)));
    
    for (let i = 0; i < filteredResult.length; i++) {
      logger.info('this is item sales')
      const item = filteredResult[i];
      const saleOrder = salesOrder[i];
      
      if (saleOrder.Location !== location) {
        logger.info("Order.Location !== location");
        continue;
      }
      
      logger.info('this is item.ShipBy', item.ShipBy)
  
      const filteredLines = saleOrder.Lines.filter(line => line.SKU === sku);
      productLines = productLines.concat(filteredLines);
      
      const monthKey = item.ShipBy && new Date(item.ShipBy) >= new Date(new Date().setMonth(new Date().getMonth()))
        ? new Date(item.ShipBy).toISOString().slice(0, 7) : 'unknown';
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = { dueQty: 0, outbound: 0 };
      }
      if (item.ShipBy && new Date(item.ShipBy) < new Date()) {
      dueOutboundQty += filteredLines.reduce((acc, line) => acc + line.Quantity, 0);
      dueOutboundProductLines = (dueOutboundProductLines || []).concat(productLines);
      dueGroupedByMonth[monthKey] = {outbound: filteredLines.reduce((acc, line) => acc + line.Quantity, 0)};
      } else {
        groupedByMonth[monthKey].outbound += filteredLines.reduce((acc, line) => acc + line.Quantity, 0);
        groupedByMonth[monthKey].outboundProductLines = productLines;
        dueGroupedByMonth[monthKey] = {outbound: filteredLines.reduce((acc, line) => acc + line.Quantity, 0)};
      }
    }
    
    const sortedMonths = Object.keys(groupedByMonth).sort();
    const resultByMonth = sortedMonths.map(month => ({
        month,
        outboundQty: groupedByMonth[month].outbound,
        outboundProductLines: groupedByMonth[month].outboundProductLines
    }));
    
    const sortedDueMonths = Object.keys(dueGroupedByMonth).sort();
    const dueResultByMonth = sortedDueMonths.map(month => ({
      month,
      outboundQty: dueGroupedByMonth[month].outbound,
    }));

    return {
      resultByMonth,
      due: {
        dueOutboundQty,
        dueOutboundProductLines
      },
      dueResultByMonth
    };
  }
  catch (e) {
    logger.error("error getOutTransaction:",e)
    throw new ResponseError(500,e)
    return {
      error: true,
      message: e.message || 'An error occurred while processing the transaction.'
    };
  }
}


const getAdvanceSale = async (id) => {
  try {
    const response = await apiClient.get(`sale/advance?SaleID=${id}`);
    return response.data;
  } catch (err) {
    throw new ResponseError(500,err)
  }
}

const getSaleList = async (req,sku) => {
  try {
    const {page = 1, limit = 100} = req.query;
    const result = await fetchAllData('/saleList', page, limit,'SaleList');
    return result;
  }
  catch (e) {
    throw new ResponseError(500,e)
  }
}


const getSaleOrder = async (id) => {
  try {
    const response = await apiClient.get(`sale/order?SaleID=${id}`);

    return response.data;
  } catch (err) {
    throw new ResponseError(500,err)
  }
}

export default {
  getOutTransaction,
  getSaleList,
  getSaleOrder
}