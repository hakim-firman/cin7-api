import express from "express";
import cin7Controller from "../controller/cin7-controller.js";


const cin7Router = express.Router();

cin7Router.use((req, res, next) => {
    next();
});

cin7Router.get('/ProductAvailabilities', cin7Controller.getProductAvailability);
cin7Router.get('/ots/:sku/:location', cin7Controller.getOTS);
cin7Router.get('/locations', cin7Controller.getLocations);

cin7Router.get('/purchaseList', cin7Controller.getPurchaseList);

export { cin7Router };