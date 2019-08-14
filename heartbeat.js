
const RESCAN_INTERVAL = 1000;
const RPPG_INTERVAL = 1000;
const DEFAULT_FPS = 10;
const WINDOW_SIZE = 5;
const LOW_BPM = 42;
const HIGH_BPM = 240;
const REL_MIN_FACE_SIZE = 0.4;
const SEC_PER_MIN = 60;
const MSEC_PER_SEC = 1000;
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
  // Create file from url
  async createFileFromUrl(path, url) {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.send();
    return new Promise(resolve => {
      request.onload = () => {
        if (request.readyState === 4) {
          if (request.status === 200) {
            let data = new Uint8Array(request.response);
            cv.FS_createDataFile('/', path, data, true, false, false);
            console.log("loady load");
            resolve();
          } else {
            console.log('Failed to load ' + url + ' status: ' + request.status);
          }
        }
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
      this.lastFrameRGB = new cv.Mat(this.webcamVideoElement.height, this.webcamVideoElement.width, cv.CV_8UC4);
      this.frameGray = new cv.Mat(this.webcamVideoElement.height, this.webcamVideoElement.width, cv.CV_8UC1);
      this.overlayRGB = new cv.Mat(this.webcamVideoElement.height, this.webcamVideoElement.width, cv.CV_8UC4);
      this.cap = new cv.VideoCapture(this.webcamVideoElement);
      // Set variables
      this.signal = []; // 120 x 3 raw rgb values
      this.timestamps = []; // 120 x 1 timestamps
      this.rescan = []; // 120 x 1 rescan bool
      this.face = new cv.Rect();  // Position of the face
      // TODO: keep track of tracking corners
      // Load face detector
      this.classifier = new cv.CascadeClassifier();
      let faceCascadeFile = 'haarcascade_frontalface_default.xml';
      await this.createFileFromUrl(faceCascadeFile, faceCascadeFile);
      if (!this.classifier.load(faceCascadeFile)) {
        console.log("Face Cascade not loaded");
      }
      this.scanTimer = setInterval(this.processFrame.bind(this),
        MSEC_PER_SEC/DEFAULT_FPS);
      this.rppgTimer = setInterval(this.rppg.bind(this), RPPG_INTERVAL);
    } catch (e) {
      console.log(e);
    }
  }
  // Add one frame to signal
  processFrame() {
    try {
      //if (!this.frameRGB.empty());
      //  this.lastFrameRGB.setTo(this.frameRGB); // Save last frame
      this.cap.read(this.frameRGB); // Save current frame
      let time = Date.now()
      let rescanFlag = false;
      cv.cvtColor(this.frameRGB, this.frameGray, cv.COLOR_RGBA2GRAY);
      // Need to find the face
      if (!this.faceValid) {
        //console.log("Face scan");
        this.lastScanTime = time;
        this.detectFace(this.frameGray);
      }
      // Scheduled face rescan
      else if (time - this.lastScanTime >= RESCAN_INTERVAL) {
        //console.log("Face rescan");
        this.lastScanTime = time
        this.detectFace(this.frameGray);
        rescanFlag = true;
      }
      // Track face
      else {
        //this.trackFace();
      }
      // Update the signal
      if (this.faceValid) {
        //console.log("Update signal");
        // Shift signal buffer
        while (this.signal.length > DEFAULT_FPS * WINDOW_SIZE) {
          this.signal.shift();
          this.timestamps.shift();
          this.rescan.shift();
        }
        // Get mask
        let mask = new cv.Mat();
        mask = this.makeMask(this.frameGray, this.face);
        // New values
        let means = cv.mean(this.frameRGB, mask);
        mask.delete();
        // Add new values to raw signal buffer
        this.signal.push(means.slice(0, 3));
        this.timestamps.push(time);
        this.rescan.push(rescanFlag);
      }
      // Draw
      cv.rectangle(this.frameRGB, new cv.Point(this.face.x, this.face.y),
        new cv.Point(this.face.x+this.face.width, this.face.y+this.face.height),
        [0, 255, 0, 255]);
      cv.add(this.frameRGB, this.overlayRGB, this.frameRGB);
      cv.imshow('canvas', this.frameRGB);
      //mask.delete();
    } catch (e) {
      console.log("Error capturing frame:");
      console.log(e);
    }
  }
  detectFace(gray) {
    let faces = new cv.RectVector();
    this.classifier.detectMultiScale(gray, faces, 1.1, 3, 0);
    if (faces.size() > 0) {
      this.face = faces.get(0);
      // TODO: Detect tracking corners
      this.faceValid = true;
    } else {
      console.log("No faces");
      this.invalidateFace();
    }
    faces.delete();
  }
  makeMask(frameGray, face) {
    let result = cv.Mat.zeros(frameGray.rows, frameGray.cols, cv.CV_8UC1);
    let white = new cv.Scalar(255, 255, 255, 255);
    let pt1 = new cv.Point(Math.round(face.x + 0.3 * face.width),
      Math.round(face.y + 0.1 * face.height));
    let pt2 = new cv.Point(Math.round(face.x + 0.7 * face.width),
      Math.round(face.y + 0.25 * face.height));
    cv.rectangle(result, pt1, pt2, white, -1);
    return result;
  }
  invalidateFace() {
    self.signal = [];
    self.timestamps = [];
    self.rescan = [];
    self.face = new cv.Rect();
    this.faceValid = false;
  }
  trackFace() {
    // TODO
  }
  // Start every second?
  rppg() {
    console.log("rppg");
    // Update fps
    let fps = this.getFps(this.timestamps);
    // If valid signal is large enough: estimate
    if (this.signal.length >= fps * WINDOW_SIZE) {
      // Work with cv.Mat from here
      let signal = cv.matFromArray(this.signal.length, 1, cv.CV_32FC3,
        [].concat.apply([], this.signal));
      // Filtering
      //this.denoise(signal);
      this.standardize(signal);
      this.detrend(signal, 1);
      this.movingAverage(signal, 3);
      // HR estimation
      signal = this.selectGreen(signal);
      // Draw time domain signal
      this.overlayRGB.setTo([0, 0, 0, 0]);
      this.draw(signal, 'top');
      this.timeToFrequency(signal, true);
      this.draw(signal, 'bottom');
      // Calculate band spectrum limits
      let low = Math.floor(signal.rows * LOW_BPM / SEC_PER_MIN / fps);
      let high = Math.ceil(signal.rows * HIGH_BPM / SEC_PER_MIN / fps);
      if (!signal.empty()) {
        // Mask for infeasible frequencies
        let bandMask = cv.matFromArray(signal.rows, 1, cv.CV_8U,
          new Array(signal.rows).fill(0).fill(1, low, high+1));
        // Identify feasible frequency with maximum magnitude
        let result = cv.minMaxLoc(signal, bandMask);
        bandMask.delete();
        // Infer BPM
        let bpm = result.maxLoc.y * fps / signal.rows * SEC_PER_MIN;
        console.log(bpm);
        // TODO update UI with this result
      }
      signal.delete();
    }
  }
  getFps(timestamps, timeBase=1000) {
    if (Array.isArray(timestamps) && timestamps.length) {
      if (timestamps.length == 1) {
        return DEFAULT_FPS;
      } else {
        let diff = timestamps[timestamps.length-1] - timestamps[0];
        return diff/1000;
      }
    } else {
      return DEFAULT_FPS;
    }
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
    let t2 = cv.matFromArray(signal.rows-2, 1, cv.CV_32FC1,
      new Array(signal.rows-2).fill(-2));
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
  // TODO solve this more elegantly
  selectGreen(signal) {
    let rgb = new cv.MatVector();
    cv.split(signal, rgb);
    // TODO possible memory leak, delete rgb?
    let result = rgb.get(1);
    rgb.delete();
    return result;
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
  draw(signal, pos) {
    // display size
    let displayHeight = this.face.height/2.0;
    let displayWidth = this.face.width*0.8;
    // Signal
    let result = cv.minMaxLoc(signal);
    let heightMult = displayHeight/(result.maxVal-result.minVal);
    let widthMult = displayWidth/(signal.rows-1);
    let drawAreaTlX = this.face.x + this.face.width + 0;
    let drawAreaTlY =  this.face.y
    if (pos == "bottom") {
      drawAreaTlY =  this.face.y + this.face.height/2.0;
    }
    let start = new cv.Point(drawAreaTlX,
      drawAreaTlY+(result.maxVal-signal.data32F[0])*heightMult);
    for (var i = 1; i < signal.rows; i++) {
      let end = new cv.Point(drawAreaTlX+i*widthMult,
        drawAreaTlY+(result.maxVal-signal.data32F[i])*heightMult);
      cv.line(this.overlayRGB, start, end, [255, 0, 0, 255], 2, cv.LINE_4, 0);
      start = end;
    }
  }
  // TODO
  stop() {
    console.log("stop" + this.timer);
    clearInterval(this.timer);

    this.classifier.delete();
    this.face.delete();
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
