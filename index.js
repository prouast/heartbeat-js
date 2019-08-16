import {Heartbeat} from './heartbeat.js';

cv['onRuntimeInitialized'] = () => {
  let demo = new Heartbeat("webcam", 30, 6, 250);
  // To start
  demo.init();
}
