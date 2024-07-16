// Initialize dataBuffer and activeAgentName
let dataBuffer = '';
let activeAgentName = '';
let userid = '';

document.addEventListener('DOMContentLoaded', () => {
    fetch('http://127.0.0.1:5000/get-userid')
        .then(response => {
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            return response.text(); // Assuming the backend returns plain text
        })
        .then(data => {
            console.log('String from backend:', data);
            userid = data;
            // Handle the string data here, such as displaying it in the UI
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Handle errors here, such as showing an error message to the user
        });

    // Function to fetch agents data and set up agent grid
    let agentLoadoutFileName = ''; // Initialize agent loadout file name

    // Function to update agent loadout based on selected agent
    function updateAgentLoadout(agentName, image) {
        activeAgentName = agentName; // Update active agent's name
        const localStorageKey = `${userid}_${agentName}_loadout`;
        const agentLoadoutData = localStorage.getItem(localStorageKey);

        if (agentLoadoutData) {
            try {
                const agentLoadout = JSON.parse(agentLoadoutData)
                
            
                renderWeaponsData(agentLoadout); // Render updated data in the UI
            } catch (error) {
                console.error('Error parsing agent loadout from localStorage:', error);
                // Handle error (optional)
            }
        } else {
            console.log(`Loadout for ${agentName} not found in localStorage.`);
            const defaultLoadoutFileName = './data/default_loadout.json';
                fetchLoadout(defaultLoadoutFileName)
                    .then(defaultLoadout => {
                        renderWeaponsData(defaultLoadout, image); // Render updated data in the UI
                    })
                    .catch(error => {
                        console.error('Error fetching and displaying weapons data:', error);
        })
    }
    
    }

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

    fetch('https://vinfo-api.com/json/characters')
        .then(response => response.json())
        .then(data => {
            // Filter and sort agent data
            data = data.filter(agent => agent.id !== 'DED3520F-4264-BFED-162D-B080E2ABCCF9');
            data.sort((a, b) => a.displayName.localeCompare(b.displayName));

            const agentsGrid = document.getElementById('agentsGrid');
            let agentHtml = '';

            // Generate HTML for agents grid
            data.forEach(agent => {
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
                    const prevSelected = document.querySelector('.agent-image.green-border');
                    if (prevSelected) {
                        prevSelected.classList.remove('green-border');
                    }

                    // Add green border to currently clicked agent image
                    image.classList.add('green-border');

                    const agent_name = document.querySelector('.agentname');
                    agent_name.innerHTML = data[index].displayName;

                    const agent_image = document.querySelector('.agentImage');
                    agent_image.src = data[index].displayIcon_small;

                    // Update agent loadout based on clicked agent
                    updateAgentLoadout(data[index].displayName, data[index].displayIcon_small);
                });
            });

            // Set initial loadout based on the first agent
            if (data.length > 0) {
                const agent_name = document.querySelector('.agentname');
                agent_name.innerHTML = data[0].displayName;

                const agent_image = document.querySelector('.agentImage');
                agent_image.src = data[0].displayIcon_small;

                const firstAgentImage = document.querySelector('.agent-image');
                if (firstAgentImage) {
                    firstAgentImage.classList.add('green-border');
                }

                // Update agent loadout for the first agent
                updateAgentLoadout(data[0].displayName, data[0].displayIcon_small);
            }

            
        })
        .catch(error => {
            console.error('Error fetching agents data:', error);
        });

        document.getElementById('saveLoadoutButton').addEventListener('click', () => {
            if (activeAgentName) {
                console.log("saving")
                console.log(dataBuffer)
                localStorage.setItem(`${userid}_${activeAgentName}_loadout`, dataBuffer);
                alert(`Loadout for ${activeAgentName} saved successfully!`);
            } else {
                alert('No active agent selected.');
            }
        });

        // Event listener for fetching the loadout data
        document.getElementById('loadLoadoutButton').addEventListener('click', () => {
            fetch('http://127.0.0.1:5000/import_loadout')
                .then(response => response.json())
                .then(data => {
                    console.log("importing..")
                    dataBuffer += JSON.stringify(data); // Append fetched data to dataBuffer
                    console.log(dataBuffer);
                    renderWeaponsData(data); // Render updated data
                })
                .catch(error => console.error('Error fetching loadout:', error));
        });


        document.getElementById('refreshButton').addEventListener('click', () => {
            fetch('http://127.0.0.1:5000/refresh_inventory')
                .then(response => response.text())
                .then(data => {
                    localStorage.setItem(`${userid}_inventory`, data);
                })
                .catch(error => console.error('Error fetching loadout:', error));
        });
        



    // Function to render weapons data (assuming it's defined elsewhere)
    function renderWeaponsData(data) {
        const guns = Array.isArray(data.Guns) ? data.Guns : [];
        console.log(guns);
        const weaponCategories = document.querySelectorAll('.invCategory');
        
    
        weaponCategories.forEach(category => {
            const items = category.querySelectorAll('.invItem');
    
            items.forEach(item => {
                var weaponId = item.getAttribute('data-weaponID'); // Get the ID of the item
                const gun = guns.find(g => g.ID === weaponId); // Find corresponding gun in JSON data
    
                if (gun) {
                    const displayIconUrl = gun.displayIcon; // Assuming displayIcon is the property in your JSON
                    const weaponImage = item.querySelector('.weaponimage');
                    console.log(gun)
                    var buddyid = gun.CharmID;
                    
                    var skinid = gun.ChromaID
    
                    const buddyImage = item.querySelector('.buddyimage')
                    item.setAttribute('data-skinID', skinid);

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
        const Identity = data.Identity;
        const playercard = document.querySelector('.cardImage');
        console.log(Identity);
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
    }
// Add event listener to each 'div' element with a 'weapon' attribute
document.querySelectorAll('.invItem').forEach(item => {
    item.addEventListener('click', function(event) {
        var weaponId = item.getAttribute('data-weaponID').toUpperCase()
        var topSkinId = item.getAttribute('data-skinID').toUpperCase()
        console.log(topSkinId)
        console.log(weaponId)
      event.stopPropagation(); // Prevents the event from bubbling up to parent elements
      const skinPickerContainer = document.querySelector('.skinPickerContainer');
      if (skinPickerContainer.style.display === 'none') {
        skinPickerContainer.style.display = 'unset';
      } else {
        skinPickerContainer.style.display = 'none';
      }
      const inventory = localStorage.getItem(`${userid}_inventory`);
      console.log(inventory)
        if (inventory) {
            console.log(userid);
            try {
                const inventoryData = JSON.parse(inventory);
                console.log('Original Inventory:', inventoryData);

                // Assuming inventoryData is an array of items and each item has a type property
                const weaponsOnly = inventoryData.Weapons
                console.log('Filtered Weapons:', weaponsOnly);

                const weapon = weaponsOnly.filter(weapon => weapon.Weaponid === weaponId);
                console.log('Filtered Weapon:', weapon);
            
                weapon.forEach(weapon => {
                    weapon.Chromas.forEach(chroma => {
                        console.log(chroma.id)
                        if (chroma.id === topSkinId){
                            const topWeaponImage = document.querySelector('.topWeapon');
                            topWeaponImage.src = chroma.displayIcon

                        }
                    })
                })

                
            } catch (error) {
                console.error('Error parsing inventory data:', error);
            }
        } else {
            console.log('No inventory data found in local storage.');
        }
      
      
    });
  });

  document.querySelector('.closeWindow').addEventListener('click', function() {
    const skinPickerContainer = document.querySelector('.skinPickerContainer');
    skinPickerContainer.style.display = 'none';
  });
  
  
    // console.log(dataBuffer)
});