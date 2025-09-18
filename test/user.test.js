import supertest from "supertest";
import {web} from "../src/application/web.js";
import {logger} from "../src/application/logging.js";
import {createTestUser, getTestUser, removeTestUser} from "./test-util.js";
import bcrypt from "bcrypt";

describe('POST /api/users', function () {

    afterEach(async () => {
        await removeTestUser()
    })
    it('should can register new user', async () => {
        let result = await supertest(web).post('/api/users')
            .send({
                username: 'Test',
                password: 'password',
                name: 'Test User'
            })
        logger.info(result.body)
        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe('Test');
        expect(result.body.data.name).toBe('Test User');
        expect(result.body.data.password).toBeUndefined();
        result = await supertest(web).post('/api/users')
            .send({
                username: 'Test',
                password: 'password',
                name: 'Test User'
            })
        logger.info(result.body)
        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined()
    });
    it('should reject if username already register', async () => {
        const result = await supertest(web).post('/api/users')
            .send({
                username: 'Test',
                password: 'password',
                name: 'Test User'
            })
        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe('Test');
        expect(result.body.data.name).toBe('Test User');
        expect(result.body.data.password).toBeUndefined();
    });
    it('should reject if request is invalid', async () => {
        const result = await supertest(web).post('/api/users')
            .send({
                username: '',
                password: '',
                name: ''
            })
        logger.info(result.body)
        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();

    });
})

describe('POST /api/users/login', function () {
    beforeEach(async () => {
        await createTestUser();
    });
    afterEach(async () => {
        await removeTestUser()
    });
    it('should can login', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "Test",
                password: "password",
            });
        logger.info("------ THIS IS RESULT ------")
        logger.info(result.body)

        expect(result.status).toBe(200);
        expect(result.body.data.token).toBeDefined();
        expect(result.body.data.token).not.toBe('test');
    })
    it('should reject login if request is invalid', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "",
                password: "",
            });
        expect(result.status).toBe(400);
        expect(result.body.errors).toBeDefined();
    })
    it('should reject login if password is wrong', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "Test",
                password: "Wrong",
            });

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    })

    it('should reject login if username is wrong', async () => {
        const result = await supertest(web)
            .post('/api/users/login')
            .send({
                username: "Wrong",
                password: "Password",
            });

        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    })
})

describe('GET /api/users/current', function () {
    beforeEach(async () => {
        await createTestUser();
    });
    afterEach(async () => {
        await removeTestUser()
    });

    it('shoult can get current user', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', 'test')
        expect(result.status).toBe(200);
        expect(result.body.data.username).toBe("Test");
        expect(result.body.data.name).toBe('Test User')
    })
    it('shoult reject if token is invalid', async () => {
        const result = await supertest(web)
            .get('/api/users/current')
            .set('Authorization', 'wrong')
        expect(result.status).toBe(401);
        expect(result.body.errors).toBeDefined();
    })

})

describe('PATCH /api/users/update', function () {
    beforeEach(async () => {
        await createTestUser();
    });
    afterEach(async () => {
        await removeTestUser()
    });

    it('should can update User',async ()=>{
        const result = await supertest(web)
            .patch('/api/users/update')
            .set('Authorization', 'test')
            .send({
                name:"Hakim",
                password:"Pass"
            })
        expect(result.status).toBe(200)
        expect(result.body.data.username).toBe("Test")
        expect(result.body.data.name).toBe("Hakim")

        const user = await  getTestUser()
        expect(await bcrypt.compare("Pass",user.password)).toBe(true)
    })
    it('should can update User Name',async ()=>{
        const result = await supertest(web)
            .patch('/api/users/update')
            .set('Authorization', 'test')
            .send({
                name:"Hakim",
            });
        expect(result.status).toBe(200)
        expect(result.body.data.username).toBe("Test")
        expect(result.body.data.name).toBe("Hakim")

    })
    it('should can update User Password',async ()=>{
        const result = await supertest(web)
            .patch('/api/users/update')
            .set('Authorization', 'test')
            .send({
                password:"Pass"
            })
        expect(result.status).toBe(200)
        expect(result.body.data.username).toBe("Test")

        const user = await  getTestUser()
        expect(await bcrypt.compare("Pass",user.password)).toBe(true)
    })
    it('Should Reject if request is not valid ',async ()=>{
        const result = await supertest(web)
            .patch('/api/users/update')
            .set('Authorization', 'wrong')
            .send({
                password:"Pass"
            })
        expect(result.status).toBe(401)
    })
})

describe('DELETE /api/users/logout',function () {
    beforeEach(async () => {
        await createTestUser();
    });
    afterEach(async () => {
        await removeTestUser()
    });

    it('Should can logout', async () => {
         await supertest(web)
            .delete('/api/users/logout')
            .set('Authorization', 'test')

        const user = await getTestUser()

        expect(user.token).toBeNull()
    })
    it('Should can logout',async ()=>{
        const result = await  supertest(web)
            .delete('/api/users/logout')
            .set('Authorization','wrong')


        expect(result.status).toBe(401)
    })

})