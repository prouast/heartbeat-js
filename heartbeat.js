
const LOW_BPM = 42;
const HIGH_BPM = 240;
const REL_MIN_FACE_SIZE = 0.4;
const SEC_PER_MIN = 60;
const MAX_CORNERS = 10;
const MIN_CORNERS = 5;
const QUALITY_LEVEL = 0.01;
const MIN_DISTANCE = 25;

export class Heartbeat {
  constructor(webcamId) {
    this.webcamId = webcamId;
    this.streaming = false;
    this.faceValid = false;
  }
  // Start the video stream
  async startStreaming() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: {exact: this.webcamVideoElement.width},
          height: {exact: this.webcamVideoElement.height}
        },
        audio: false
      });
    } catch (e) {
      console.log(e);
    }
    if (!this.stream) {
      throw new Error('Could not obtain video from webcam.');
    }
    // Set srcObject to the obtained stream
    this.webcamVideoElement.srcObject = this.stream;
    // Start the webcam video stream
    this.webcamVideoElement.play();
    this.streaming = true;
    return new Promise(resolve => {
      // Add event listener to make sure the webcam has been fully initialized.
      this.webcamVideoElement.oncanplay = () => {
        resolve();
      };
    });
  }
  // Initialise the demo
  async init(resolution) {
    this.webcamVideoElement = document.getElementById(this.webcamId);
    try {
      await this.startStreaming();
      this.webcamVideoElement.width = this.webcamVideoElement.videoWidth;
      this.webcamVideoElement.height = this.webcamVideoElement.videoHeight;
      this.frameRGB = new cv.Mat(this.webcamVideoElement.height, this.webcamVideoElement.width, cv.CV_8UC4);
      this.frameGray = new cv.Mat(this.webcamVideoElement.height, this.webcamVideoElement.width, cv.CV_8UC1);
      this.cap = new cv.VideoCapture(this.webcamVideoElement);
      this.timer = setInterval(this.processFrame.bind(this), 100); // TODO wait for stuff below to load
    } catch (e) {
      console.log(e);
    }

    // Set variables

    // Load face detector

  }
  processFrame() {
    console.log("frame..");
    try {
      this.cap.read(this.frameRGB);
      cv.cvtColor(this.frameRGB, this.frameGray, cv.COLOR_RGBA2GRAY);
      // Log time

      // Need to find the face
      if (this.faceValid) {

      }

      // Scheduled face rescan
      else if (true) {

      }

      // Track face
      else {

      }

      // Run rPPG
      if (faceValid) {
        // Update fps
        // Remove old values from raw signal buffer
        // New values
        // Add new values to raw signal buffer
        // Save rescan flag
        // Update fps
        // Update band spectrum limits
        // If valid signal is large enough: estimate
        if (true) {
          // Filtering
          // HR estimation
        }
      }
      // Draw

      cv.imshow('canvas', this.frameGray);
    } catch (e) {
      console.log("Error capturing frame:");
      console.log(e);
    }
  }
  stop() {
    console.log("stop" + this.timer);
    clearInterval(this.timer);
    //delete this.timer;
    //this.frame.delete();
    //delete this.frame;
    //this.dst.delete();
    //delete this.dst;
    if (this.webcam) {
      this.webcamVideoElement.pause();
      this.webcamVideoElement.srcObject = null;
    }
    if (this.stream) {
      this.stream.getVideoTracks()[0].stop();
    }
    this.streaming = false;
  }
}
