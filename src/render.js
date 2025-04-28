//const { ipcRenderer } = require('electron');

// Remove the desktopCapturer import
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = async () => {
    try {
        if (!window.electronAPI || !window.electronAPI.getSources) {
            throw new Error('Electron API not ready');
        }
        await getVideoSources();
    } catch (error) {
        console.error('Error accessing sources:', error);
        alert('Please wait for the app to fully load before selecting sources');
    }
};

async function getVideoSources(){
    const inputSources = await window.electronAPI.getSources({
        type:['window', 'screen']
    });

    const videoOptionMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return{
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionMenu.popup();
}

let mediaRecorder; //Mdeia recorder instance to capture footage
const recordedChuncks = [];

// Change the videoSource window to record
async function selectSource(source){
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video:{
            mandatory:{
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    //Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    //previw the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    //create the media recorder
    const option = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, option);

    //Register Event handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}


//const { writeFile } = require('fs');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
}

// Captures all recorded chuncks
function handleDataAvailable(e){
    console.log('video data available');
    recordedChuncks.push(e.data);
}

//Saves the video file on stop
async function handleStop(e){
    const blob = new Blob(recordedChuncks, {
        type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    // Use the preload API instead of direct ipcRenderer
    const filePath = await window.electronAPI.saveFile(buffer);
    
    if(filePath){
        console.log('Video saved successfully at: ', filePath);
    }
}