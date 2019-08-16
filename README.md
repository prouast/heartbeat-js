# heartbeat-js: Video-based pulse rate monitoring in JavaScript

This is a simple JavaScript implementation of rPPG, a way to measure the pulse rate without skin contact.
It uses a live feed of the face to analyse subtle changes in skin color.

Here's how it works:

  - The face is detected and continuously tracked
  - Signal series is obtained by determining the facial color in every frame
  - Heart rate is estimated using frequency analysis and filtering of the series

If you are interested in the specifics, feel free to have a read of our publications on the topic:
  - [Remote Photoplethysmography: Evaluation of Contactless Heart Rate Measurement in an Information Systems Setting][aitic]
  - [Using Contactless Heart Rate Measurements for Real-Time Assessment of Affective States][gmunden]
  - [Remote heart rate measurement using low-cost RGB face video: A technical literature review][fcs]

## Demo

Test the live demo directly in your browser: [Demo](https://prouast.github.io/heartbeat-js/)

Currently, tracking is disabled.
Works best if there is no subject motion.

See also my [C++ implementation](https://github.com/prouast/heartbeat) and [YouTube Demo](https://www.youtube.com/watch?v=D_KYv7pXAvQ&t=1s).

License
----

GPL-3.0