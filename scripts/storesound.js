let db;

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
};

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

    function playSoundByName(soundName) {
        let transaction = db.transaction(["audioFiles"], "readonly");
        let objectStore = transaction.objectStore("audioFiles");
        let index = objectStore.index("name");
        let request = index.get(soundName);

        request.onsuccess = function(event) {
            let result = event.target.result;
            if (result && result.data) {
                let audio = new Audio(result.data);
                audio.play();
            } else {
                console.error("Sound not found:", soundName);
            }
        };

        request.onerror = function(event) {
            console.error("Error retrieving sound:", event.target.errorCode);
        };
    }

function initializeGameEventListeners() {
    console.log("Initializing game event listeners...");

    overwolf.games.events.setRequiredFeatures(["kill"], function(info) {
        if (info.status === "error") {
            console.error("Could not set required features:", info.reason);
        } else {
            console.log("Required features set successfully:", info);
        }
    });

    overwolf.games.events.onNewEvents.addListener(function(event) {
        event.events.forEach(function(e) {
            if (e.name === "kill") {
                console.log("Kill event detected:", e);

                // Example: Play a specific sound based on the weapon used
                let soundFileName = "Nyaa - Sound Effect (HD).mp3";  // Default sound

                // Play the specific sound by its name
                playSoundByName(soundFileName);
            }
        });
    });
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

function playKillSound(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["sounds"], "readonly");
        const store = transaction.objectStore("sounds");

        const request = store.get("killSound");

        request.onsuccess = function(event) {
            const mp3File = event.target.result.file;

            if (mp3File) {
                const audio = new Audio(URL.createObjectURL(mp3File));
                audio.play();
                resolve();
            } else {
                reject("No MP3 file found in IndexedDB.");
            }
        };

        request.onerror = function(event) {
            reject("Error retrieving MP3 file:", event.target.errorCode);
        };
    });
}
