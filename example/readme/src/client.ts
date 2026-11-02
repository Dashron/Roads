// client.ts
// In the browser, RoadsPJAX runs the road when someone clicks a link
import { RoadsPJAX } from 'roads';
import road from './road.js';

const pjax = new RoadsPJAX(road, document.body, window);
pjax.register();
