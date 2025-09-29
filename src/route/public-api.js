import express from "express";
import userController from "../controller/user-controller.js";
import { cin7Router } from "./cin7Router.js";
const publicRouter = express.Router()

publicRouter.post('/api/register',userController.register);
publicRouter.post('/api/login',userController.login);

publicRouter.use('/api/cin7', cin7Router);


export {
    publicRouter
}