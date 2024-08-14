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


