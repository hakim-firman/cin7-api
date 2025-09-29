import express from "express";
import { cin7Router } from "./cin7Router.js";
const publicRouter = express.Router()

publicRouter.use('/api/cin7', cin7Router);


export {
    publicRouter
}