// client.ts
// In the browser, RoadsPJAX runs the road when someone clicks a link
import { RoadsPJAX } from 'roads';
import road from './road.js';

const container = document.getElementById('container');

if (!container) {
    throw new Error('The page has no element with id="container"');
}

const pjax = new RoadsPJAX(road, container, window);
pjax.register();
