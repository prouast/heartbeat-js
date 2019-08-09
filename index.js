//import {Heartbeat} from './heartbeat.js';

//let demo = new Heartbeat("webcam");

// To start
//demo.init();

// To stop
// demo.stop();

cv['onRuntimeInitialized'] = () => {
  let signalArray = [10, 1.5, 1.5, 2.5, 2.5, 2.5, 3.5, 3.5, 3.5, 4.5, 4.5, 4.5, 5, 5, 5];
  let signal = cv.matFromArray(signalArray.length/3, 1, cv.CV_32FC3, signalArray);
}

function denoise() {
  // TODO
}
