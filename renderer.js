const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let user_name = "";

let dataBuffer = ''; // Initialize dataBuffer
let image = "https://vinfo-api.com/media/Characters/41FB69C1-4189-7B37-F117-BCAF1E96F1BF.png";

let inventory = path.join(__dirname, 'data', 'itemsowned.json');


document.addEventListener('DOMContentLoaded', () => {
    fetch(inventory) // Assuming it's located in 'data' directory served by our server
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            user_name = data.UserInfo.game_name;

            console.log(data.UserInfo.game_name);
            const player_name = document.querySelector('.username');
            player_name.innerHTML=(user_name);
            
            // Use the JSON data as needed
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    
    let agentLoadoutFileName = ''; // Initialize agent loadout file name
    // Function to update agent loadout based on selected agent
    function updateAgentLoadout(agentName, image) {
        agentLoadoutFileName = path.join(__dirname, 'data\\'+user_name, `${agentName}_loadout.json`);
        console.log(agentLoadoutFileName); // Log to verify the constructed path
        console.log(image);

        // Fetch agent loadout or default loadout
        fetchLoadout(agentLoadoutFileName)
            .then(agentLoadout => {

                renderWeaponsData(agentLoadout); // Render updated data in the UI
            })
            .catch(() => {
                const defaultLoadoutFileName = path.join(__dirname, 'data', 'default_loadout.json');
                fetchLoadout(defaultLoadoutFileName)
                    .then(defaultLoadout => {
                        renderWeaponsData(defaultLoadout, image); // Render updated data in the UI
                    })
                    .catch(error => {
                        console.error('Error fetching and displaying weapons data:', error);
                    });
            });
    }

    // Function to fetch loadout data
    function fetchLoadout(loadoutFileName) {
        return fetch(loadoutFileName)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Loadout file not found');
                }
            });
    }


    // Fetch agents data from the API
    fetch('https://vinfo-api.com/json/characters')
        .then(response => response.json())
        .then(data => {
            // Filter out the agent with the specific ID
            data = data.filter(agent => agent.id !== 'DED3520F-4264-BFED-162D-B080E2ABCCF9');

            // Sort agents data alphabetically by display name
            data.sort((a, b) => a.displayName.localeCompare(b.displayName));

            const agentsGrid = document.getElementById('agentsGrid');

            // Generate HTML for agents grid
            let agentHtml = '';
            data.forEach(agent => {
                // Create HTML for agent image with white border and grey background
                agentHtml += `
                    <div class="make-button">
                        <div class="p-0">
                            <img src="${agent.displayIcon_small}" alt="${agent.displayName}" class="img-fluid agent-image">
                        </div>
                    </div>
                `;
            });


            // Append generated HTML to agentsGrid
            agentsGrid.innerHTML = agentHtml;

            // Add click event listeners to agent images
            const agentImages = document.querySelectorAll('.agent-image');
            agentImages.forEach((image, index) => {
                image.addEventListener('click', () => {
                    // console.log(image.src)
                    const prevSelected = document.querySelector('.agent-image.green-border');
                    if (prevSelected) {
                        prevSelected.classList.remove('green-border');
                    }

                    // Add green border to currently clicked agent image
                    image.classList.add('green-border');

                    const agent_name = document.querySelector('.agentname');
                    agent_name.innerHTML=(data[index].displayName);

                    const agent_image = document.querySelector('.agentImage');
                    agent_image.src=(data[index].displayIcon_small);
                    updateAgentLoadout(data[index].displayName); // Update agent loadout on click
                });
            });

            // Set initial loadout based on the first agent
            if (data.length > 0) {
                const agent_name = document.querySelector('.agentname');
                agent_name.innerHTML=(data[0].displayName);
                const agent_image = document.querySelector('.agentImage');
                agent_image.src=(data[0].displayIcon_small);
                updateAgentLoadout(data[0].displayName, data[0].displayIcon_small);
                const firstAgentImage = document.querySelector('.agent-image');
                if (firstAgentImage) {
                    firstAgentImage.classList.add('green-border');
                }

                updateAgentLoadout(data[0].displayName, data[0].displayIcon_small);
            }
        })
        .catch(error => {
            console.error('Error fetching agents data:', error);
        });

    // Event listener for "Load Current Loadout" button
    const loadLoadoutButton = document.getElementById('loadLoadoutButton');
    if (loadLoadoutButton) {
        loadLoadoutButton.addEventListener('click', () => {
            console.log(dataBuffer)
            console.log("Loadout button clicked");
            runCurrentLoadoutScript(); // Call function to update loadout
        });
    }

    // Event listener for "Save Loadout" button
    const saveLoadoutButton = document.getElementById('saveLoadoutButton');
    if (saveLoadoutButton) {
        saveLoadoutButton.addEventListener('click', () => {
            console.log("Save Loadout button clicked");
            saveLoadoutToFile(agentLoadoutFileName); // Call function to save loadout to file
        });
    }

    //open skin picker box
    document.querySelector('.invItem').addEventListener('click', function() {
        const skinPickerContainer = document.querySelector('.skinPickerContainer');
        if (skinPickerContainer.style.display === 'none') {
          skinPickerContainer.style.display = 'block';
        } else {
          skinPickerContainer.style.display = 'none';
        }
      });

document.querySelector('.main').addEventListener('click', function() {
    const skinPickerContainer = document.querySelector('.skinPickerContainer');
    if (skinPickerContainer.style.display === 'unset') {
      skinPickerContainer.style.display = 'none';
    } else {
      skinPickerContainer.style.display = 'unset';
    }
  });
});

// Function to fetch updated loadout data from Python script
function runCurrentLoadoutScript() {


    // Assuming your Python script file name is current_loadout.py and located in a higher directory
    const scriptPath = path.join(__dirname, 'current_loadout.py');
    console.log(scriptPath)
    // Run the Python script
    const python = spawn('python', [scriptPath, 'import_loadout']); // 
    console.log(python.stdout)
    dataBuffer = ''
    console.log(dataBuffer)

    // Capture stdout from Python script
    python.stdout.on('data', (data) => {
        console.log(dataBuffer)
        dataBuffer += data.toString(); // Collect stdout data
    });

    // Capture stderr from Python script (if needed)
    python.stderr.on('data', (data) => {
        console.error(`Python script stderr: ${data}`);
    });

    // Handle script completion
    python.on('close', (code) => {
        try {
            if (dataBuffer.trim() !== '') { // Check if dataBuffer is not empty
                const updatedLoadout = JSON.parse(dataBuffer); // Parse JSON data received from Python
                console.log('Updated loadout from Python:', updatedLoadout);
                renderWeaponsData(updatedLoadout); // Render updated data in the UI
            } else {
                throw new Error('No JSON data received from Python');
            }
        } catch (err) {
            console.error('Error parsing JSON data from Python:', err);
        }
        console.log(`Python script child process exited with code ${code}`);
    });
}

// Function to save loadout to JSON file
function saveLoadoutToFile(fileName) {
    if (!fileName) {
        console.error('Agent loadout file name is not defined');
        return;
    }

    try {
        console.log(dataBuffer)
        fs.writeFileSync(fileName, dataBuffer);
        console.log(`Saved loadout to ${fileName}`);
    } catch (err) {
        console.error('Error saving loadout to file:', err);
    }
}

function renderWeaponsData(data) {
    console.log(data);
    const guns = Array.isArray(data.Guns) ? data.Guns : [];
    const weaponCategories = document.querySelectorAll('.invCategory');
    

    weaponCategories.forEach(category => {
        const items = category.querySelectorAll('.invItem');

        items.forEach(item => {
            var weaponId = item.getAttribute('data-weaponID'); // Get the ID of the item
            const gun = guns.find(g => g.ID === weaponId); // Find corresponding gun in JSON data

            if (gun) {
                const displayIconUrl = gun.displayIcon; // Assuming displayIcon is the property in your JSON
                const weaponImage = item.querySelector('.weaponimage');
                var buddyid = gun.CharmID;

                const buddyImage = item.querySelector('.buddyimage')

                if (weaponImage) {
                    weaponImage.onload = function() {
                        // Once weaponImage is loaded, then check and update buddyImage if needed
                        if (buddyid) {
                            buddyid = buddyid.toUpperCase()
                            const buddyImageUrl = `https://vinfo-api.com/media/Charms/${buddyid}.png`;
                            buddyImage.onload = function() {
                                // Once buddyImage is loaded, or directly set its src
                                buddyImage.src = buddyImageUrl;
                            };
                            buddyImage.src = buddyImageUrl; // Set src immediately
                        }else{
                            const buddyImageUrl = ""
                            buddyImage.onload = function() {
                                // Once buddyImage is loaded, or directly set its src
                                buddyImage.src = buddyImageUrl;
                            };
                        }
                    };
                    weaponImage.src = displayIconUrl; // Set src attribute of weapon image
                }

                
            }else {
            }
        });

    });
    const Identity = data.Identity
    const playercard = document.querySelector('.cardImage');
    const cardImage = Identity.PlayerCardID.toUpperCase();
    playercard.src = "https://vinfo-api.com/media/PlayerCards/"+cardImage+"_large.png"
    const playercardWide = document.querySelector('.cardImageWide');
    playercardWide.src = "https://vinfo-api.com/media/PlayerCards/"+cardImage+"_wide.png"

    const sprays = Array.isArray(data.Sprays) ? data.Sprays : [];

    const sprayCategories = document.querySelectorAll('.sprayItem');

    sprayCategories.forEach(spraySlot => {  
        const sprayPos = spraySlot.getAttribute('data-slotId')
        var spray = sprays.find(s => s.EquipSlotID === sprayPos);


        if (spray){
            const sprayId = spray.SprayID.toUpperCase();
            const sprayIconURL = "https://vinfo-api.com/media/Sprays/"+sprayId+".png"
            const sprayImage = spraySlot.querySelector('.sprayImage')
            sprayImage.src = sprayIconURL
        }
    })

    console.log(dataBuffer)

}

