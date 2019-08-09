
const RESCAN_INTERVAL = 1000;
const FPS = 10;
const WINDOW_SIZE = 5;
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
    self.signal = []; // 120 x 3 raw rgb values // TODO how will I organise matrices?
    self.timestamps = []; // 120 x 1 timestamps
    self.rescan = []; // 120 x 1 rescan bool
    // Load face detector
    self.classifier = new cv.CascadeClassifier();
    classifier.load("haarcascade_frontalface_alt.xml");
  }
  // Add one frame to signal
  processFrame() {
    console.log("frame..");
    try {
      this.cap.read(this.frameRGB);
      let time = Date.now()
      let rescanFlag = false;
      cv.cvtColor(this.frameRGB, this.frameGray, cv.COLOR_RGBA2GRAY);
      // Need to find the face
      if (!this.faceValid) {
        this.lastScanTime = time;
        this.detectFace();
      }
      // Scheduled face rescan
      else if (time - this.lastScanTime >= RESCAN_INTERVAL) {
        this.lastScanTime = time
        this.detectFace();
        rescanFlag = true;
      }
      // Track face
      else {
        this.trackFace();
      }
      // Update the signal
      if (this.faceValid) {
        // Shift signal buffer
        while (this.signal.length > FPS * WINDOW_SIZE) {
          shift(this.signal);
          shift(this.timestamps);
          shift(this.rescan);
        }
        // New values
        const means = mean(this.frameRGB, mask);
        // Add new values to raw signal buffer
        // TODO make sure means is 3-dim javascript array
        this.signal.push(means);
        this.timestamps.push(time);
        this.rescan.push(rescanFlag);
      }
      // Draw
      cv.imshow('canvas', this.frameRGB);
    } catch (e) {
      console.log("Error capturing frame:");
      console.log(e);
    }
  }
  // Start every second?
  rppg() {
    // Update fps
    let fps = getFps(t, timeBase);
    // If valid signal is large enough: estimate
    if ((this.signal.length >= fps * minSignalSize) {
      // Work with cv.Mat from here
      let signal = this.arrayToMat(this.signal);
      // Filtering
      //this.denoise(signal);
      this.standardize(signal);
      this.detrend(signal, 1);
      this.movingAverage(signal, 3);
      // HR estimation
      signal = this.selectGreen(signal);
      this.timeToFrequency(signal, true);
      // Calculate band spectrum limits
      let low = Math.floor(signal.rows * LOW_BPM / SEC_PER_MIN / fps);
      let high = Math.ceil(signal.rows * HIGH_BPM / SEC_PER_MIN / fps);
      if (!signal.empty()) {
        // Mask for infeasible frequencies
        let bandMask = cv.matFromArray(5, 1, cv.CV_8U, new Array(5).fill(0).fill(1, low, high+1));
        // Identify feasible frequency with maximum magnitude
        let result = cv.minMaxLoc(signal, bandMask);
        bandMask.delete();
        // Infer BPM
        let bpm = result.maxLoc.y * fps / signal.rows * SEC_PER_MIN;
        // TODO update UI with this result
      }
      // ...
      signal.delete();
    }
  }
  detectFace() {
    // TODO
  }
  trackFace() {
    // TODO
  }
  arrayToMat(signal) {
    let flatSignal = [].concat.apply([], signal);
    let length = signal.length/3;
    return cv.matFromArray(length, 1, cv.CV_32FC3, flatSignal);
  }
  denoise(signal) {
    // TODO
  }
  standardize(signal) {
    let mean = new cv.Mat();
    let stdDev = new cv.Mat();
    let t1 = new cv.Mat();
    cv.meanStdDev(signal, mean, stdDev, t1);
    let means_c3 = cv.matFromArray(1, 1, cv.CV_32FC3, [mean.data64F[0], mean.data64F[1], mean.data64F[2]]);
    let stdDev_c3 = cv.matFromArray(1, 1, cv.CV_32FC3, [stdDev.data64F[0], stdDev.data64F[1], stdDev.data64F[2]]);
    let means = new cv.Mat(signal.rows, 1, cv.CV_32FC3);
    let stdDevs = new cv.Mat(signal.rows, 1, cv.CV_32FC3);
    cv.repeat(means_c3, signal.rows, 1, means);
    cv.repeat(stdDev_c3, signal.rows, 1, stdDevs);
    cv.subtract(signal, means, signal, t1, -1);
    cv.divide(signal, stdDevs, signal, 1, -1);
    mean.delete(); stdDev.delete(); t1.delete();
    means_c3.delete(); stdDev_c3.delete();
    means.delete(); stdDevs.delete();
  }
  detrend(signal, lambda) {
    let h = cv.Mat.zeros(signal.rows-2, signal.rows, cv.CV_32FC1);
    let i = cv.Mat.eye(signal.rows, signal.rows, cv.CV_32FC1);
    let t1 = cv.Mat.ones(signal.rows-2, 1, cv.CV_32FC1)
    let t2 = cv.matFromArray(signal.rows-2, 1, cv.CV_32FC1, new Array(signal.rows-2).fill(-2));
    let t3 = new cv.Mat();
    t1.copyTo(h.diag(0)); t2.copyTo(h.diag(1)); t1.copyTo(h.diag(2));
    cv.gemm(h, h, lambda*lambda, t3, 0, h, cv.GEMM_1_T);
    cv.add(i, h, h, t3, -1);
    cv.invert(h, h, cv.DECOMP_LU);
    cv.subtract(i, h, h, t3, -1);
    let s = new cv.MatVector();
    cv.split(signal, s);
    cv.gemm(h, s.get(0), 1, t3, 0, s.get(0), 0);
    cv.gemm(h, s.get(1), 1, t3, 0, s.get(1), 0);
    cv.gemm(h, s.get(2), 1, t3, 0, s.get(2), 0);
    cv.merge(s, signal);
    h.delete(); i.delete();
    t1.delete(); t2.delete(); t3.delete();
    s.delete();
  }
  movingAverage(signal, kernelSize) {
    cv.blur(signal, signal, {height: kernelSize, width: 1});
  }
  selectGreen(signal) {
    let rgb = new cv.MatVector();
    cv.split(signal, rgb);
    return rgb.get(1);
  }
  timeToFrequency(signal, magnitude) {
    // Prepare planes
    let planes = new cv.MatVector();
    planes.push_back(signal);
    planes.push_back(new cv.Mat.zeros(signal.rows, 1, cv.CV_32F))
    let powerSpectrum = new cv.Mat();
    cv.merge(planes, signal);
    // Fourier transform
    cv.dft(signal, signal, cv.DFT_COMPLEX_OUTPUT);
    if (magnitude) {
      cv.split(signal, planes);
      cv.magnitude(planes.get(0), planes.get(1), signal);
    }
  }
  // TODO
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
