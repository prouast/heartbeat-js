# heartbeat-js: Video-based pulse rate monitoring in JavaScript

**News: Try out [VitalLens](https://apps.apple.com/us/app/vitallens/id6472757649), my new free iOS app implementing a modern rPPG model based on AI. We also have an [API](https://www.rouast.com/api/) with a [Python Client](https://github.com/Rouast-Labs/vitallens-python) which uses the same AI model. Find out more at [https://www.rouast.com/vitallens](https://www.rouast.com/vitallens/) and [https://www.rouast.com/api](https://www.rouast.com/api/).**

This is a simple JavaScript implementation of rPPG, a way to measure the pulse rate without skin contact.
It uses a live feed of the face to analyse subtle changes in skin color.

Here's how it works:

  - The face is detected and continuously tracked
  - Signal series is obtained by determining the facial color in every frame
  - Heart rate is estimated using frequency analysis and filtering of the series

If you are interested in the specifics, feel free to have a read of my publications on the topic:
  - [Remote Photoplethysmography: Evaluation of Contactless Heart Rate Measurement in an Information Systems Setting](http://air.newcastle.edu.au/AITIC_files/Paper_40.pdf)
  - [Using Contactless Heart Rate Measurements for Real-Time Assessment of Affective States](http://link.springer.com/chapter/10.1007/978-3-319-41402-7_20)
  - [Remote heart rate measurement using low-cost RGB face video: A technical literature review](https://www.researchgate.net/profile/Raymond_Chiong/publication/306285292_Remote_heart_rate_measurement_using_low-cost_RGB_face_video_A_technical_literature_review/links/58098ac808ae1c98c252637d.pdf)

## Demo

Test the live demo directly in your browser: [Demo](https://prouast.github.io/heartbeat-js/)

Currently, tracking is disabled.
Works best if there is no subject motion.

See also my [C++ implementation](https://github.com/prouast/heartbeat) and [YouTube Demo](https://www.youtube.com/watch?v=D_KYv7pXAvQ&t=1s).

License
----

GPL-3.0
