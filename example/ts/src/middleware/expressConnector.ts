import type { Road } from 'roads';
import type express from 'express';

export function expressConnector(road: Road) {
	// express middleware to translate express requests into roads requests, and roads responses into Express responses
	return async function router(req: express.Request, res: express.Response, next: express.NextFunction) {
		try {
			// Execute the route
			const response = await road.request(req.method, req.url, req.body?.toString() || '', req.headers);

			// Translate the Roads HTTP Status to Express
			res.status(response.status);

			// Translate the Roads Headers to Express
			Object.entries(response.headers).forEach(([header, value]) => {
				res.header(header, value);
			});

			// Translate the Roads Body to Express
			if (response.body) {
				res.send(response.body);
			}
			next();
		} catch (err) {
			// we call next here so we can rely on additional express middleware such as sentry, as opposed to our own.
			// if we want to design this page better it would be in express
			next(err);
		}
	};
}
