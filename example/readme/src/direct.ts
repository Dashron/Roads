// direct.ts
// Call the road directly, with no server running
import road from './road.js';

const response = await road.request('GET', '/users/dashron');
console.log(response.status, response.body);
