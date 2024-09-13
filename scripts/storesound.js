let db;
let audioContext;
let analyser;
let source;
let bufferLength;
let dataArray;
let animationFrameId;
const canvas = document.getElementById('waveformCanvas');
const ctx = canvas.getContext('2d');
let isPlaying = false;
window.onload = function() {
    let request = indexedDB.open("AudioDB", 1);

    request.onerror = function(event) {
        console.error("Database error:", event.target.errorCode);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadAudioList();
        console.log("database connected");
        initializeGameEventListeners();
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        let objectStore = db.createObjectStore("audioFiles", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("name", "name", { unique: false });
    };
    document.querySelector('.uploadAudio').addEventListener('click', function() {
        uploadAudio()
    })
};


function uploadAudio() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.wav, .mp3'; // Restrict to WAV and MP3 files

    // Listen for the file selection
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Upload the file or handle it as needed
            console.log("Selected file:", file.name);
            saveAudio(file)
            
        }
    };

    // Trigger the file selection dialog
    fileInput.click();
}




function saveAudio(file) {
    if (file) {
        let audio = new Audio();
        const audioPickerContainer = document.querySelector('.audioPickerContainer');
        let filenameText = file.name;
        const fileNameDisplay = document.getElementById('filename');
        const playaudiobutton = audioPickerContainer.querySelector('.playaudio');

        if (audioPickerContainer.style.display === 'none') {
            audioPickerContainer.style.display = 'unset';
            console.log("made visible");
        } else {
            audioPickerContainer.style.display = 'none';
            console.log("hi");
        }

        const maxLength = 50;
        if (file.name.length > maxLength) {
            filenameText = file.name.slice(0, maxLength) + '...';
        }
        fileNameDisplay.innerHTML = filenameText;

        let reader = new FileReader();
        reader.onload = function(event) {
            const fileData = event.target.result;
            audio.src = fileData;
            console.log("Audio file loaded");

            audio.addEventListener('canplay', function() {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                analyser.fftSize = 512; // Higher value for more detail

                bufferLength = analyser.fftSize;
                dataArray = new Uint8Array(bufferLength);

                function draw() {
                    animationFrameId = requestAnimationFrame(draw);

                    analyser.getByteTimeDomainData(dataArray);

                    ctx.fillStyle = 'rgb(27, 25, 26)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#fe4753'; // Set the waveform color here
                    ctx.beginPath();

                    let sliceWidth = canvas.width * 1.0 / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        let v = dataArray[i] / 128.0; // Normalizing value
                        let y = v * canvas.height / 2; // Centered y value

                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }

                        x += sliceWidth;
                    }

                    ctx.lineTo(canvas.width, canvas.height / 2);
                    ctx.stroke();
                }

                // Start drawing loop
                draw();

                // Pause and resume handling
                audio.addEventListener('pause', () => {
                    isPlaying = false;
                    cancelAnimationFrame(animationFrameId);
                });

                audio.addEventListener('play', () => {
                    if (!isPlaying) {
                        isPlaying = true;
                        draw(); // Restart the drawing loop
                    }
                });
            });
        };
        reader.readAsDataURL(file);

        playaudiobutton.addEventListener('click', function(event) {
            if (playaudiobutton.src.includes("playaudio.png")) {
                playaudiobutton.src = "./img/pauseaudio.png";
                audio.volume = 1.0;
                audio.play().then(() => {
                    console.log("Audio playing");
                }).catch(error => {
                    console.error("Error playing audio:", error);
                });
            } else if (playaudiobutton.src.includes("pauseaudio.png")) {
                playaudiobutton.src = "./img/playaudio.png";
                audio.pause();
                console.log("Audio paused");
            }
        });
    }
}







function storeAudio() {
    let fileInput = document.getElementById('audioFile');
    let file = fileInput.files[0];

    if (file) {
        let reader = new FileReader();
        reader.onload = function(event) {
            let fileData = event.target.result;
            let transaction = db.transaction(["audioFiles"], "readwrite");
            let objectStore = transaction.objectStore("audioFiles");
            let request = objectStore.add({ name: file.name, data: fileData });

            request.onsuccess = function(event) {
                alert('Audio stored successfully.');
                loadAudioList();
            };

            request.onerror = function(event) {
                console.error("Error storing audio:", event.target.errorCode);
            };
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select an audio file.');
    }
}

    function playSoundByName(soundName, volume = 1.0) {
        let transaction = db.transaction(["audioFiles"], "readonly");
        let objectStore = transaction.objectStore("audioFiles");
        let index = objectStore.index("name");
        let request = index.get(soundName);

        request.onsuccess = function(event) {
            let result = event.target.result;
            if (result && result.data) {
                let audio = new Audio(result.data);
                audio.volume = volume;
                audio.play();
            } else {
                console.error("Sound not found:", soundName);
            }
        };

        request.onerror = function(event) {
            console.error("Error retrieving sound:", event.target.errorCode);
        };
    }

function loadAudioList() {
    let audioList = document.getElementById('audioList');
    audioList.innerHTML = "";
    let transaction = db.transaction(["audioFiles"], "readonly");
    let objectStore = transaction.objectStore("audioFiles");

    objectStore.openCursor().onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            let option = document.createElement("option");
            option.value = cursor.key;
            option.text = cursor.value.name;
            audioList.appendChild(option);
            cursor.continue();
        }
    };
}

function playStoredAudio() {
    let audioList = document.getElementById('audioList');
    let audioId = Number(audioList.value);
    let transaction = db.transaction(["audioFiles"], "readonly");
    let objectStore = transaction.objectStore("audioFiles");

    let request = objectStore.get(audioId);
    request.onsuccess = function(event) {
        let audio = document.getElementById('audioPlayer');
        audio.src = event.target.result.data;
        audio.play();
    };
}


