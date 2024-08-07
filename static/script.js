async function getVideoCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        return videoDevices;

    } catch (error) {
        console.error('Error accessing media devices.', error);
        return [];
    }
}
 
 
 // camera stream video element
 let cameraStreamElem = document.querySelector('#camera-stream');
 // flip button element
 let flipBtn = document.querySelector('#flip-btn');
const recordBtn = document.querySelector('#record-btn');
 // default user media options
 let shouldFaceUser = true;

 // check whether we can use facingMode
 let supports = navigator.mediaDevices.getSupportedConstraints();

 //

 let mediaRecorder = null;

 if( supports['facingMode'] === true ) {
     flipBtn.disabled = false;
 }

 let stream = null;
 let recordingStatus = 'idle';

 const selectElement = document.getElementById('camera-select');

getVideoCameras().then(videoDevices => {
    videoDevices.forEach(device => {
        const option = document.createElement('option');

        option.value = device.deviceId;
        option.text = device.label || `Camera ${selectElement.length + 1}`;
        selectElement.appendChild(option);
    });
});


 function recordVideo() {
    let constraints = { audio: false, video: true }
    constraints.video = {
            width: {
            min: 192,
            ideal: 192,
            max: 192,
        },
        height: {
            min: 192,
            ideal: 192,
            max: 192
        },
        facingMode: shouldFaceUser ? 'user' : 'environment'
    };


    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(mediaStream) {
            stream  = mediaStream;
            cameraStreamElem.srcObject = stream;
            cameraStreamElem.play();
        })
        .catch(function(err) {
            console.log(err)
        });

    // mediaRecorder = new MediaRecorder(stream);
    // const chunks = [];

    // mediaRecorder.start();
    // recordingStatus = 'started';
    
    // mediaRecorder.ondataavailable = function(event) {
    //     chunks.push(event.data);
    // };

    // mediaRecorder.onstop = function() {
    //     recordingStatus = 'stop';
    //     const blob = new Blob(chunks, { type: 'video/webm' });
    //     const videoUrl = URL.createObjectURL(blob);
    //     console.log('Recorded video URL:', videoUrl);
    // };
 }

 recordVideo();

recordBtn.addEventListener("click", (e) => { 
    e.stopPropagation();
    e.preventDefault
    recordVideo(); 
});
flipBtn.addEventListener("click", () => { 
    shouldFaceUser = !shouldFaceUser;
    recordVideo();
 });