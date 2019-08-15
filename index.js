import {Heartbeat} from './heartbeat.js';

cv['onRuntimeInitialized'] = () => {
  let demo = new Heartbeat("webcam");
  // To start
  demo.init();

  //let signalArray = [1, 1.5, 1.5, 2.5, 2.5, 2.5, 13.5, 13.5, 13.5, 14.5, 14.5, 14.5, 15, 15, 15];
  //let signal = cv.matFromArray(signalArray.length/3, 1, cv.CV_32FC3, signalArray);
}
