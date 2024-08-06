let dataBuffer = '';
let activeAgentName = '';
let userid = '';
let weaponsOnly = ''
let activeItem = ''
let activeSkin = ''
let activeChroma = ''
let activeBuddy = ''
let weaponChoicesHTML = ''
let buddiesOnly = ''
let buddiesChoiceHTML = ''

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user ID and agents data in parallel
        const [useridResponse, agentsResponse] = await Promise.all([
            fetch('http://127.0.0.1:5000/get-userid'),
            fetch('https://vinfo-api.com/json/characters')
        ]);

        if (!useridResponse.ok || !agentsResponse.ok) {
            throw new Error('Network response was not ok');
        }

        userid = await useridResponse.text();
        console.log('String from backend:', userid);

        const agentsData = await agentsResponse.json();
        const filteredAgents = agentsData.filter(agent => agent.id !== 'DED3520F-4264-BFED-162D-B080E2ABCCF9');
        filteredAgents.sort((a, b) => a.displayName.localeCompare(b.displayName));

        // Initialize agent grid
        const agentsGrid = document.getElementById('agentsGrid');
        const fragment = document.createDocumentFragment();
        filteredAgents.forEach(agent => {
            const agentDiv = document.createElement('div');
            agentDiv.classList.add('make-button');
            agentDiv.innerHTML = `
                <div class="p-0">
                    <img src="${agent.displayIcon_small}" alt="${agent.displayName}" class="img-fluid agent-image">
                </div>
            `;
            fragment.appendChild(agentDiv);
        });
        agentsGrid.appendChild(fragment);

        const inventory = localStorage.getItem(`${userid}_inventory`);
        const inventoryData = JSON.parse(inventory);
        weaponsOnly = inventoryData.Weapons
        buddiesOnly = inventoryData.Buddies

        // Update agent loadout function
        async function updateAgentLoadout(agentName, image) {
            activeAgentName = agentName; // Update active agent's name
            const localStorageKey = `${userid}_${agentName}_loadout`;
            const agentLoadoutData = localStorage.getItem(localStorageKey);

            if (agentLoadoutData) {
                try {
                    const agentLoadout = JSON.parse(agentLoadoutData);
                    dataBuffer = agentLoadout
                    console.log(dataBuffer)
                    renderWeaponsData(agentLoadout); // Render updated data in the UI
                } catch (error) {
                    console.error('Error parsing agent loadout from localStorage:', error);
                }
            } else {
                console.log(`Loadout for ${agentName} not found in localStorage.`);
                const defaultLoadout = await fetchLoadout('./data/default_loadout.json');
                dataBuffer = defaultLoadout
                console.log(dataBuffer)
                renderWeaponsData(defaultLoadout, image); // Render updated data in the UI
            }
        }

        async function fetchLoadout(loadoutFileName) {
            const response = await fetch(loadoutFileName);
            if (!response.ok) {
                throw new Error('Loadout file not found');
            }
            return await response.json();
        }

        // Add click event listeners to agent images
        const agentImages = document.querySelectorAll('.agent-image');
        agentImages.forEach((image, index) => {
            image.addEventListener('click', () => {
                const prevSelected = document.querySelector('.agent-image.green-border');
                if (prevSelected) {
                    prevSelected.classList.remove('green-border');
                }

                // Add green border to currently clicked agent image
                image.classList.add('green-border');

                const agent_name = document.querySelector('.agentname');
                agent_name.innerHTML = filteredAgents[index].displayName;

                const agent_image = document.querySelector('.agentImage');
                agent_image.src = filteredAgents[index].displayIcon_small;

                // Update agent loadout based on clicked agent
                updateAgentLoadout(filteredAgents[index].displayName, filteredAgents[index].displayIcon_small);
            });
        });

        // Set initial loadout based on the first agent
        if (filteredAgents.length > 0) {
            const agent_name = document.querySelector('.agentname');
            agent_name.innerHTML = filteredAgents[0].displayName;

            const agent_image = document.querySelector('.agentImage');
            agent_image.src = filteredAgents[0].displayIcon_small;

            const firstAgentImage = document.querySelector('.agent-image');
            if (firstAgentImage) {
                firstAgentImage.classList.add('green-border');
            }

            // Update agent loadout for the first agent
            updateAgentLoadout(filteredAgents[0].displayName, filteredAgents[0].displayIcon_small);
        }

        // Event listener for saving the loadout data
        document.getElementById('saveLoadoutButton').addEventListener('click', () => {
            if (activeAgentName) {
                console.log("saving");
                const saveData = JSON.stringify(dataBuffer)
                localStorage.setItem(`${userid}_${activeAgentName}_loadout`, saveData);
                alert(`Loadout for ${activeAgentName} saved successfully!`);
            } else {
                alert('No active agent selected.');
            }
        });

        // Event listener for fetching the loadout data
        document.getElementById('loadLoadoutButton').addEventListener('click', async () => {
            try {
                const loadoutResponse = await fetch('http://127.0.0.1:5000/import_loadout');
                const loadoutData = await loadoutResponse.json();
                dataBuffer = loadoutData // Append fetched data to dataBuffer
                renderWeaponsData(loadoutData); // Render updated data
            } catch (error) {
                console.error('Error fetching loadout:', error);
            }
        });

        // Event listener for refreshing the inventory data
        document.getElementById('refreshButton').addEventListener('click', async () => {
            try {
                const refreshResponse = await fetch('http://127.0.0.1:5000/refresh_inventory');
                const refreshData = await refreshResponse.text();
    
                localStorage.setItem(`${userid}_inventory`, refreshData);
            } catch (error) {
                console.error('Error refreshing inventory:', error);
            }
        });

        // Function to render weapons data (assuming it's defined elsewhere)


    } catch (error) {
        console.error('Error fetching and processing data:', error);
    }

    document.querySelectorAll('.weapon').forEach(item => {
        console.log(item)
        item.addEventListener('click', function(event) {
            activeItem = item
            var weaponId = item.getAttribute('data-weaponID').toUpperCase()
            var topSkinId = item.getAttribute('data-skinID').toUpperCase()
            weapon_popup(weaponId, topSkinId, item)
        })
    
    
      });

      document.querySelector('.closeWindow').addEventListener('click', function() {
        const skinPickerContainer = document.querySelector('.skinPickerContainer');
        skinPickerContainer.style.display = 'none';
      });
      
      document.querySelector('.chooseButton').addEventListener('click', function() {
        activeItem.setAttribute("data-skinID", activeSkin.ItemID)
        activeItem.setAttribute("data-activeChromaID", activeChroma)
        activeItem.setAttribute("data-buddyID", activeBuddy.ItemID);
        const skinPickerContainer = document.querySelector('.skinPickerContainer');
        skinPickerContainer.style.display = 'none';
        console.log(activeItem)
        weaponimage = activeItem.querySelector('.weaponimage')
        buddyimage = activeItem.querySelector('.buddyimage')
        
        chroma = activeSkin.Chromas.find(chroma => chroma.id === activeChroma)
        console.log(chroma)
       // Find the index of the item in dataBuffer.Guns
        const index = dataBuffer.Guns.findIndex(gun => gun.ID === activeSkin.Weaponid.toLowerCase());

        // Log the old item
        console.log(dataBuffer.Guns[index]);

        // Update the item's properties
        console.log(dataBuffer.Guns[index].ChromaID)
        console.log(chroma.id.toLowerCase())
        dataBuffer.Guns[index].ChromaID = chroma.id.toLowerCase();
        console.log(dataBuffer.Guns[index].SkinID)
        console.log(activeSkin.ItemID.toLowerCase())
        dataBuffer.Guns[index].SkinID = activeSkin.ItemID.toLowerCase();
        dataBuffer.Guns[index].SkinLevelID = activeSkin.Levels[activeSkin.Levels.length - 1].id.toLowerCase();
        dataBuffer.Guns[index].displayIcon = chroma.displayIcon

        dataBuffer.Guns[index].CharmID = activeBuddy.ItemID.toLowerCase();
        dataBuffer.Guns[index].CharmInstanceID = activeBuddy.InstanceID.toLowerCase();
        dataBuffer.Guns[index].CharmLevelID = activeBuddy.LevelID.toLowerCase();

        // Log the updated item
        console.log(dataBuffer.Guns[index]);
        console.log(buddyimage)
        console.log(activeItem)
        buddyimage.src = activeBuddy.ImageURL
        weaponimage.src = chroma.displayIcon
        console.log(activeItem)
      });

      document.querySelector('.topWeapon').addEventListener('click', function() {
        const skinGrid = document.querySelector('.skinGrid');
        skinGrid.innerHTML = '';
        skinGrid.innerHTML = weaponChoicesHTML
    })
    document.querySelector('.buddyPreview').addEventListener('click', function() {
        buddyChoices()
    })
    
    
    
       
    

    }

);


function renderWeaponsData(data) {

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

                var skinid = gun.SkinID.toUpperCase();
                var chromaid = gun.ChromaID.toUpperCase()

                const buddyImage = item.querySelector('.buddyimage');
                item.setAttribute('data-skinID', skinid);
                item.setAttribute('data-activeChromaID', chromaid);
                item.setAttribute('data-buddyID', buddyid);
                if (weaponImage) {
                    weaponImage.onload = function() {
                        // Once weaponImage is loaded, then check and update buddyImage if needed
                        var buddy = item.getAttribute('data-buddyID');
                        console.log(buddyid);
                        if (buddy != "undefined") {
                            buddy = buddy.toUpperCase();
                            const buddyImageUrl = `https://vinfo-api.com/media/Charms/${buddy}.png`;
                            buddyImage.onload = function() {
                                // Once buddyImage is loaded, or directly set its src
                                buddyImage.src = buddyImageUrl;
                            };
                            buddyImage.src = buddyImageUrl; // Set src immediately
                        } else {
                            console.log("not working")
                            const buddyImageUrl = "";
                            buddyImage.onload = function() {
                                // Once buddyImage is loaded, or directly set its src
                                buddyImage.src = buddyImageUrl;
                            };
                        }
                    };
                    weaponImage.src = displayIconUrl; // Set src attribute of weapon image
                }
            }
        });
    });

    const Identity = data.Identity;
    const playercard = document.querySelector('.cardImage');
    const cardImage = Identity.PlayerCardID.toUpperCase();
    playercard.src = "https://vinfo-api.com/media/PlayerCards/" + cardImage + "_large.png";
    const playercardWide = document.querySelector('.cardImageWide');
    playercardWide.src = "https://vinfo-api.com/media/PlayerCards/" + cardImage + "_wide.png";

    const sprays = Array.isArray(data.Sprays) ? data.Sprays : [];

    const sprayCategories = document.querySelectorAll('.sprayItem');

    sprayCategories.forEach(spraySlot => {
        const sprayPos = spraySlot.getAttribute('data-slotId');
        var spray = sprays.find(s => s.EquipSlotID === sprayPos);

        if (spray) {
            const sprayId = spray.SprayID.toUpperCase();
            const sprayIconURL = "https://vinfo-api.com/media/Sprays/" + sprayId + ".png";
            const sprayImage = spraySlot.querySelector('.sprayImage');
            sprayImage.src = sprayIconURL;
        }
    });
}

  

function weapon_popup(weaponId, topSkinId, item) {
    const skinGrid = document.querySelector('.skinGrid');
    const buddyImage = item.querySelector('.buddyimage');
    console.log(buddyImage.src)
    const buddyPreviewImage = document.querySelector('.buddyPreview .clickForBuddy');
    const chromaPreview = document.querySelector('.chromaPreview');
    const topWeapon = document.querySelector('.topWeapon');
    topWeapon.src = '';
    skinGrid.innerHTML = '';
    chromaPreview.innerHTML = '';


    const skinPickerContainer = document.querySelector('.skinPickerContainer');
    if (skinPickerContainer.style.display === 'none') {
        skinPickerContainer.style.display = 'unset';
    } else {
        skinPickerContainer.style.display = 'none';
        console.log("hi");
    }

    console.log(weaponsOnly);
    const weapon = weaponsOnly.filter(weapon => weapon.Weaponid === weaponId);
    console.log('Filtered Weapon:', weapon);

    const topWeaponData = weapon.find(w => w.ItemID === topSkinId);
    activeSkin = topWeaponData
    activeChroma = activeItem.getAttribute("data-activeChromaID");
    if (buddyImage.src != "overwolf-extension://mhlpbbigoglahfnkpekoamfknlnaneebgodenaam/index.html") {
        // Update the variable with the buddy image URL
        selectedBuddyImageSrc = buddyImage.src;
        console.log('Selected Buddy Image URL:', selectedBuddyImageSrc);
        
        // Update the src attribute of the buddyPreview image
        if (buddyPreviewImage) {
            buddyPreviewImage.src = selectedBuddyImageSrc;
            console.log(buddyPreviewImage.src)
        }
    }
    renderTopWeapon(topWeaponData)
    weaponChoices(weapon)



}
function weaponChoices(weapon){
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';

    skinGrid.style.visibility = 'hidden';
    

    // Create a promise to handle rendering of weapons
    const renderWeaponsPromise = new Promise((resolve, reject) => {
        weapon.forEach(w => {
            // Check if Chromas array exists and has at least one element
            if (w.Chromas && w.Chromas.length > 0) {
                // Create a div for the weapon skin
                const weaponDiv = document.createElement('div');
                weaponDiv.classList.add('weapon-skin'); // Add a class for styling if needed

                // Create an img element for the skin
                const skinImage = document.createElement('img');
                skinImage.className = "Weapon_"+ w.Weaponid
                skinImage.src = w.Chromas[0].displayIcon; // Set the src to the first chroma displayIcon
                skinImage.alt = w.Name; // Optionally set alt text
                const skinName = document.createElement('div');
                skinName.className = "skinName"
                skinName.innerHTML = w.Name

                weaponDiv.appendChild(skinName)

                weaponDiv.appendChild(skinImage);

                // Add event listener to update topWeapon image on click
                weaponDiv.addEventListener('click', () => {
                    activeSkin = w
                    activeChroma = w.Chromas[0].id;

                    renderTopWeapon(w);
                });

                // Append the weapon div to the skinGrid
                skinGrid.appendChild(weaponDiv);
                weaponChoicesHTML = skinGrid.innerHTML
            }
        });

        // Resolve the promise after rendering is complete
        resolve();
    });

    // Once rendering is complete, make the skinGrid visible
    renderWeaponsPromise.then(() => {
        skinGrid.style.visibility = 'visible';
    });
}

function buddyChoices(){
    const skinGrid = document.querySelector('.skinGrid');
    const buddyPreview = document.querySelector('.buddyPreview');
    const buddyImg = buddyPreview.querySelector('.clickForBuddy');
    skinGrid.innerHTML = '';
    // Loop through the buddies and create the HTML
    buddiesOnly.forEach(buddy => {
        const buddyDiv = document.createElement('div');
        buddyDiv.classList.add('buddy-item');

        const buddyImage = document.createElement('img');
        buddyImage.src = buddy.ImageURL;
        buddyImage.alt = 'Buddy';

        // Add event listener to update buddyPreview image when clicked
        buddyImage.addEventListener('click', () => {
            buddyImg.src = buddy.ImageURL;
            console.log(buddyImg.src)
            activeBuddy = buddy
            console.log(activeBuddy)
        });

        buddyDiv.appendChild(buddyImage);
        skinGrid.appendChild(buddyDiv);
    });    
}
function renderTopWeapon(data){
    const chromaPreview = document.querySelector('.chromaPreview');
    const topWeapon = document.querySelector('.topWeapon');
    console.log(data);
    // console.log(data.Chromas[0]);
    // chroma = activeSkin.Chromas.find(chroma => chroma.id === activeChroma)
    console.log(activeSkin);
    const topweaponimg = data.Chromas.find(chroma=>chroma.id===activeChroma);
    console.log(topweaponimg);
    console.log(topweaponimg.displayIcon);
    topWeapon.src = topweaponimg.displayIcon;
    console.log(activeChroma);
    chromaPreview.innerHTML = '';           
  
    data.Chromas.forEach((chroma, index) => {
        const chromaSwatch = document.createElement('div');
        chromaSwatch.classList.add(`chroma${index + 1}`);

        const chromaImage = document.createElement('img');
        if (chroma.swatch != null){
            chromaImage.src = chroma.swatch;
            chromaImage.alt = chroma.Name;
        }
        
        chromaImage.addEventListener('click', () => {
            const topWeaponImage = document.querySelector('.topWeapon');
            topWeaponImage.src = chroma.displayIcon;
            activeChroma = chroma.id;
        });
        chromaImage.className = `chroma${index + 1}image`;

        chromaSwatch.appendChild(chromaImage);
        chromaPreview.appendChild(chromaSwatch);
    });

    // If a weapon has only 1 chroma, set the first chroma.id as active chroma id
    if (data.Chromas.length === 1) {
        activeChroma = data.Chromas[0].id;
        console.log(`Active chroma set to: ${activeChroma}`);
    }
}




// let selectedBuddyImageSrc = ''; // Variable to store the buddy image URL
// let selectedWeaponItem = null; // Variable to store the weapon name

// // Get all weapon items
// const weaponItems = document.querySelectorAll('.invItem.weapon');


// // Get the buddyPreview image element
// const buddyPreviewImage = document.querySelector('.buddyPreview .clickForBuddy');

// weaponItems.forEach(item => {
//     item.addEventListener('click', () => {
//         selectedWeaponItem = item;
//         console.log(selectedWeaponItem)
//         console.log(buddyPreviewImage);
//         // Find the buddy image within the clicked item
//         const buddyImage = item.querySelector('.buddyimage');
        
//         if (buddyImage) {
//             // Update the variable with the buddy image URL
//             selectedBuddyImageSrc = buddyImage.src;
//             console.log('Selected Buddy Image URL:', selectedBuddyImageSrc);
            
//             // Update the src attribute of the buddyPreview image
//             if (buddyPreviewImage) {
//                 buddyPreviewImage.src = selectedBuddyImageSrc;
//                 console.log(buddyPreviewImage.src)
//             }
//         }
//     });
// });


//   // Event listener for the choose button
//   chooseButton.addEventListener('click', () => {
//     if (selectedWeaponItem) {
        
//         const buddyImageInWeapon = selectedWeaponItem.querySelector('.buddyimage');
        
//         if (buddyImageInWeapon) {
//             buddyImageInWeapon.src = buddyImg.src;
//             console.log(buddyImg.src)
//         }
//     }
// });






