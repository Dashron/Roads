/**
 * applyPublicRoutes.ts
 * Copyright(c) 2018 Aaron Hedges <aaron@dashron.com>
 * MIT Licensed
 *
 * This file is an example of how to assign some public routes to a roads server
 */
import { BasicRouterMiddleware } from 'roads';
import { StoreValsContext } from 'roads/types/middleware/storeVals';
/**
  * Before calling this function you should create your roads object and bind a SimpleRouter to that road.
  * You then pass the road to this function to assign a collection of example routes that will be rendered
  * on both the client and the server
  *
  * @param {SimpleRouter} router - The router that the routes will be added to
  */
export default function applyPublicRotues(router: BasicRouterMiddleware.BasicRouter<StoreValsContext>): void;
