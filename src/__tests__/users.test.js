import * as validator from 'express-validator';
import * as helpers from '../utils/helpers.mjs'
import { getUserByIdHandler, createUserHandler } from "../handlers/users.mjs"
import { mockUsers } from "../utils/constants.mjs";
import { User } from '../mongoose/schemas/user.mjs';

jest.mock('express-validator', () => ({
    validationResult: jest.fn(() => ({
        isEmpty: jest.fn(() => false),
        array: jest.fn(() => [{msg: "Invalid Field"}])
    
    })),
    matchedData: jest.fn(() => ({
        username: 'test',
        password: "password",
        display_name: "test_name"

    }))
}))

jest.mock('../utils/helpers.mjs', () => ({
    hashPassword: jest.fn((password) => `hashed_${password}`)
}))

jest.mock('../mongoose/schemas/user.mjs')

const mockRequest = {
    findUserIndex : 1
};

const mockResponse = {
    sendStatus: jest.fn(),
    send: jest.fn(),
    status: jest.fn(() => mockResponse)
};

describe('get users', () => {

    // beforeEach(() => {
    //     jest.clearAllMocks();
    // })

    it('should get user by id', () => {
        getUserByIdHandler(mockRequest, mockResponse);
        // expect(mockResponse.send).toHaveBeenCalled();
        // expect(mockResponse.send).toHaveBeenCalledTimes(1);
        
        expect(mockResponse.send).toHaveBeenCalledWith(mockUsers[1]);
    
    })

    it('should call sendStatus 404 when user not found', () => {
        const copyMockRequest = { ...mockRequest, findUserIndex:100};
        
        getUserByIdHandler(copyMockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);
        expect(mockResponse.send).not.toHaveBeenCalled();
    })
});

describe("create users", () => {
    const mockRequest = {};


    it('should return status of 400 when there are errors', async () => {
        await createUserHandler(mockRequest, mockResponse);
        expect(validator.validationResult).toHaveBeenCalled();
        expect(validator.validationResult).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith( [{msg: "Invalid Field"}])
    });

    it('should return status of 201 and the user created', async () => {
        
        jest.spyOn(validator, 'validationResult').mockImplementationOnce(() => ({
            isEmpty: jest.fn(() => true)
        }))

        const saveMethod = jest.spyOn(User.prototype, "save").mockResolvedValueOnce({
                id:1,
                username: 'test',
                password: "hashed_password",
                display_name: "test_name"
        
            
        });
        
        await createUserHandler(mockRequest, mockResponse);
        expect(validator.matchedData).toHaveBeenCalled();
        expect(helpers.hashPassword).toHaveBeenCalledWith('password');
        expect(helpers.hashPassword).toHaveReturnedWith('hashed_password')
        expect(User).toHaveBeenCalledWith({
            username: 'test',
            password: "hashed_password",
            display_name: "test_name"
    
        });
        // console.log(User.mock.instances[0]);
        expect(User.mock.instances[0].save).toHaveBeenCalled();
        expect(saveMethod).toHaveBeenCalled();

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.send).toHaveBeenCalledWith({
            id:1,
            username: 'test',
            password: "hashed_password",
            display_name: "test_name"
        });

    })

    it('should return status of 400 when database fails to save user', async () => {
        jest.spyOn(validator, 'validationResult').mockImplementationOnce(() => ({
            isEmpty: jest.fn(() => true)
        }))

        const saveMethod = jest.spyOn(User.prototype, "save").mockImplementationOnce(() => Promise.reject("Failed to save user"))
        await createUserHandler(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
    })
})