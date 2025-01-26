import {Heartbeat} from './heartbeat.js';

const HAARCASCADE_URI = "haarcascade_frontalface_alt.xml"

let demo = new Heartbeat("webcam", "canvas", HAARCASCADE_URI, 30, 6, 250);

let run = async function() {
  window.cv = await window.cv;
  demo.init();
}

window.onload = run;
