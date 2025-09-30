import { logger } from "../application/logging.js";
import { ResponseError } from "../error/response-error.js";
import cin7Service from "../service/cin7-service.js";
import purchaseService from "../service/purchase-service.js";
import saleService from "../service/sale-service.js";

const getProductAvailability = async (req, res, next) => {
    try {
        const result = await cin7Service.getProductAvailability(req)
        
        res.status(200).json({
            data:result
        })
    }
    catch (e) {
        next(e)
    }
    
}

const getProductBySKU = async (req, res, next) => {
    try {
        const result = await cin7Service.getProductBySKU(req)
        res.status(200).json({
            data:result
        })
    }
    catch (e) {
        next(e)
    }
}

const getSOH = async (req, res, next) => {
  try {
    const {sku ='' } = req.params;
    const product = await cin7Service.getProductBySKU(req)
    const movements = product?.Products?.[0]?.Movements || []

    // Group movements by YYYY-MM
    const grouped = {}
    movements.forEach(m => {
      const date = new Date(m.Date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!grouped[monthKey]) grouped[monthKey] = []
      grouped[monthKey].push(m)
    })
    
    const months = Object.keys(grouped).sort()

    const firstMonth = months[months.length - 1]
    let openingSOH = movements.reduce((acc, m) => {
      const date = new Date(m.Date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthKey < firstMonth) acc += m.Quantity
      return acc
    }, 0)

    const result = []

    result.push({
      ref: "SOH",
      month: "SOH",
      in: 0,
      out: 0,
      ots: openingSOH
    })
    
    const dueIn = await purchaseService.getDueInQty(req,sku)
    
    const dueInQty = dueIn.dueQty
    const dueInProductLines = dueIn.groupedByDate
    console.log(dueInProductLines)

    result.push({
      ref: "DUE",
      month: "DUE",
      in: dueInQty,
      out: 0,
      ots: 0,
      dueInProductLines: dueInProductLines
    })

    let runningOTS = openingSOH
    months.forEach(month => {
      const monthMovements = grouped[month]
      let inQty = 0
      let outQty = 0
      monthMovements.forEach(m => {
        if (m.Quantity > 0) inQty += m.Quantity
        else outQty += Math.abs(m.Quantity)
      })

      runningOTS = result[result.length - 1].ots + inQty - outQty

      result.push({
        ref: "MONTH",
        month,
        in: inQty,
        out: outQty,
        ots: runningOTS
      })
    })

    res.status(200).json({
      data: {
        product: {
          ID: product.Products[0].ID,
          SKU: product.Products[0].SKU,
          Name: product.Products[0].Name
        },
        rows: result
      }
    })
  } catch (e) {
    next(e)
  }
}

const getOTS = async (req, res, next) => {
  try {
  
    const {sku ='',location ='' } = req.params;
    logger.info("getOTS")
    console.log("getOTS")
      const [inboundTransaction, outboundTransaction, currentSOH] = await Promise.all([
        purchaseService.getInTransaction(req),
        saleService.getOutTransaction(req, sku),
        cin7Service.getProductAvailabilityBySKU(sku, location),
      ]);
      const openingSOH = currentSOH?.ProductAvailabilityList?.[0]?.OnHand ?? 0;
      
      const merged = {};
      const mergedDue = {};
      [...inboundTransaction.resultByMonth, ...outboundTransaction.resultByMonth].forEach(item => {
        if (!item.month) return
        merged[item.month] ??= { month: item.month, inboundQty: 0, outboundQty: 0 };
        merged[item.month].inboundQty += item.inboundQty || 0;
        merged[item.month].outboundQty += item.outboundQty || 0;
      });
      [...inboundTransaction.dueResultByMonth, ...outboundTransaction.dueResultByMonth].forEach(item => {
        if (!item.month) return
        mergedDue[item.month] ??= { month: item.month, inboundQty: 0, outboundQty: 0 };
        mergedDue[item.month].inboundQty += item.inboundQty || 0;
        mergedDue[item.month].outboundQty += item.outboundQty || 0;
      });

      const result = Object.keys(merged)
      .sort()
      .map(month => merged[month]);
      
      const dueResult = Object.keys(mergedDue)
      .sort()
      .map(month => mergedDue[month]);
      
      result.forEach((item, index) => {
      if (index === 0) {
        item.ots = openingSOH + item.inboundQty - item.outboundQty;
      } else {
        const prev = result[index - 1];
        item.ots = prev.ots + item.inboundQty - item.outboundQty;
      }
    });
    

    const due = {
      dueInboundQty: inboundTransaction.due.dueInboundQty,
      dueOutboundQty: outboundTransaction.due.dueOutboundQty,
      dueOts: (inboundTransaction.due.dueInboundQty || 0) - (outboundTransaction.due.dueOutboundQty || 0),
    };
    
    const soh = {
      soh: currentSOH?.ProductAvailabilityList?.[0]?.OnHand || 0,
      in: currentSOH?.ProductAvailabilityList?.[0]?.Available || 0,
      out: currentSOH?.ProductAvailabilityList?.[0]?.Allocated || 0,
      ots: currentSOH?.ProductAvailabilityList?.[0]?.Available - currentSOH?.ProductAvailabilityList?.[0]?.Allocated  || 0,
    }
    
    const product = {
      SKU: sku,
      Location: location,
    }

    res.status(200).json({
      data: { result :{
      soh:result,
      due:dueResult
      },
      due, 
      soh, 
      product },
    });
  }
    catch (e) {
     throw new ResponseError(500,e)
    next(e)
  }
}


const getPurchaseList = async (req, res, next) =>{
  try {
    const {sku ='' } = req.params;
    const result = await purchaseService.getDueInQty(req,sku)
    res.status(200).json({
      data: result
    })
  }
  catch (e) {
    
    next(e)
  }

}

const getLocations = async (req, res, next) => {
  try {
    const result = await cin7Service.getLocations()
    res.status(200).json({
      data: result
    })
  }
  catch (e) {
    next(e)
  }
}

export default {
    getProductAvailability,
    getSOH,
    getPurchaseList,
    getOTS,
    getLocations
}