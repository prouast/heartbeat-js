//import {Heartbeat} from './heartbeat.js';

//let demo = new Heartbeat("webcam");

// To start
//demo.init();

// To stop
// demo.stop();

cv['onRuntimeInitialized'] = () => {
  let signalVec = [10, 1.5, 1.5, 2.5, 2.5, 2.5, 3.5, 3.5, 3.5, 4.5, 4.5, 4.5, 5, 5, 5];
  let signal = cv.matFromArray(signalVec.length/3, 1, cv.CV_32FC3, signalVec);
  //movingAverage(signal, 3);
  //detrend(signal, 1);
  //standardize(signal);
  console.log(signal);
}
