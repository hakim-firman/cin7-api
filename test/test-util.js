import {prismaClient} from "../src/application/database.js";
import bcrypt from "bcrypt";
const removeTestUser = async () => {
    await prismaClient.user.deleteMany({
        where:{
            username:"Test"
        }
    })
}


const createTestUser = async () =>{
     await prismaClient.user.create({
         data: {
             username:"Test",
             password:await bcrypt.hash('password',10),
             name: "Test User",
             token: "Test"
         }
     })
}

const getTestUser = async () => {
    return prismaClient.user.findUnique({
        where:{
            username:"Test"
        },
    })
}

export {
    removeTestUser,
    createTestUser,
    getTestUser
}