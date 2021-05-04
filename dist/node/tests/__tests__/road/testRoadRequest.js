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
const index_2 = require("../../../index");
describe('road request', () => {
    /**
     * Ensure that the basic request system lines up
     */
    test('Request', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        return expect(road.request('GET', '/', 'yeah', {
            one: 'two'
        })).resolves.toEqual({
            status: 404,
            headers: {},
            body: 'Page not found'
        });
    });
    /**
     * Ensure that route errors naturally bubble up through the promise catch
     */
    test('Method With Error', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        road.use(function () {
            throw new Error('huh');
        });
        return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
    });
    /**
     * Ensure that route errors naturally bubble up through the promise catch
     */
    test('Async Method With Error', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        road.use(function () {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('huh');
            });
        });
        return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
    });
    /**
     * Ensure that a request handler that executes, then calls the actual route returns as expected
     */
    test('Request With Multiple Handlers Called', () => {
        expect.assertions(2);
        const road = new index_1.Road();
        let step1 = false;
        let step2 = false;
        road.use(function (method, url, body, headers, next) {
            step1 = true;
            return next();
        });
        road.use(function (method, url, body, headers, next) {
            step2 = true;
            return next();
        });
        return road.request('GET', '/').then(function (response) {
            expect(step1).toEqual(true);
            expect(step2).toEqual(true);
        });
    });
    /**
     * Ensure that a request handler that executes, then calls the actual route returns as expected
     */
    test('Request Error With Handler', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        road.use(function (method, url, body, headers, next) {
            return next();
        });
        road.use(function () {
            throw new Error('huh');
        });
        return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
    });
    /**
     * Ensure that a request handler that executes, then calls the actual route returns as expected
     */
    test('Async Request Error With Handler', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        road.use(function (method, url, body, headers, next) {
            return next();
        });
        road.use(function () {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('huh');
            });
        });
        return expect(road.request('GET', '/')).rejects.toEqual(new Error('huh'));
    });
    /**
     * Ensure that you can handle errors properly from the request handler
     */
    test('Request Error With Handler That Catches Errors', () => {
        expect.assertions(1);
        const road = new index_1.Road();
        const middleware = function (method, url, body, headers, next) {
            return next()
                .catch(function (error) {
                return new index_2.Response(JSON.stringify({ error: error.message }), 200);
            });
        };
        road.use(middleware);
        road.use(function () {
            throw new Error('huh');
        });
        return expect(road.request('GET', '/')).resolves.toEqual({
            status: 200,
            headers: {},
            body: '{"error":"huh"}'
        });
    });
});
