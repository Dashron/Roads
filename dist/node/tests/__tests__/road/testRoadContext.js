"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../index");
describe('Road Context', () => {
    /**
     * Ensure that the request context is the context provided in the Road constructor
     */
    test('Road Context Contains Request Method', () => {
        expect.assertions(1);
        const response_string = 'blahblahwhatwhatwhat';
        const road = new index_1.Road();
        road.use(function (method, url, body, headers) {
            return __awaiter(this, void 0, void 0, function* () {
                switch (method) {
                    case 'GET':
                        return this.request('POST', '/');
                    case 'POST':
                        return response_string;
                    default:
                        throw new Error('not supposed to happen');
                }
            });
        });
        return expect(road.request('GET', '/')).resolves.toEqual({
            status: 200,
            body: response_string,
            headers: {}
        });
    });
    /**
     * Ensure that the request context is the context provided in the Road constructor
     */
    test('Road Context Persists', () => {
        expect.assertions(1);
        const response_string = 'blahblahwhatwhatwhat';
        const road = new index_1.Road();
        road.use(function (method, url, body, headers, next) {
            this.confirmString = function () {
                return response_string;
            };
            return next();
        });
        road.use(function (method, url, body, headers, next) {
            return this.confirmString();
        });
        return expect(road.request('GET', '/')).resolves.toEqual({
            status: 200,
            body: response_string,
            headers: {}
        });
    });
    /**
     * Ensure that the request context is the context provided in the Road constructor
     */
    test('Road Async Context Persists', () => {
        expect.assertions(1);
        const response_string = 'blahblahwhatwhatwhat';
        const road = new index_1.Road();
        road.use(function (method, url, body, headers, next) {
            return __awaiter(this, void 0, void 0, function* () {
                this.confirmString = function () {
                    return response_string;
                };
                return yield next();
            });
        });
        road.use(function (method, url, body, headers, next) {
            return this.confirmString();
        });
        return expect(road.request('GET', '/')).resolves.toEqual({
            status: 200,
            body: response_string,
            headers: {}
        });
    });
    /**
     * Ensure that contexts are only added once to a resource.
     */
    test('Road Async Uniqueness', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        road.use(function (method, url, body, headers, next) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield next();
            });
        });
        expect(road['_request_chain'].length).toEqual(1);
    });
});
