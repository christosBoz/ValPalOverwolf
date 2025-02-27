// const { func } = require("prop-types");

// const { NONAME } = require("dns");

let dataBuffer = '';
let activeAgentName = '';
let userid = '';
let username = ''
let weaponsOnly = ''
let activeItem = ''
let activeSkin = ''
let activeChroma = ''
let activeBuddy = ''
let weaponChoicesHTML = ''
let cardChoicesHTML = ''
let buddiesOnly = ''
let buddiesChoiceHTML = ''
let activeType = ''
let activeCard = ''
let activeTitle = ''
let activeTitleFullData = ''
let spraysOnly = ''
let activeSpray = ''
let spray1 = ''
let spray2 = ''
let spray3 = ''
let spray4 = ''

document.addEventListener('DOMContentLoaded', async () => {
    try {
        userid = localStorage.getItem(`puuid`)
        async function sendPing() {
            try {
                const response = await fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/ping?puuid=${userid}`);
                if (!response.ok) {
                    throw new Error('Ping failed');
                }
                console.log('Ping successful:', new Date().toLocaleTimeString());
            } catch (error) {
                console.error('Error sending ping:', error);
            }
        }
    
        // Set up the ping interval (600,000 ms = 10 minutes)
        setInterval(sendPing, 600000); // 10 minutes


        // Fetch user ID and agents data in parallel
        const [agentsResponse, usernameResponse] = await Promise.all([
        
            fetch('https://valorant-api.com/v1/agents'),
            fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/get-username?puuid=${userid}`)
        ]);

        if (!agentsResponse.ok) {
            throw new Error('Network response was not ok');
        }
        username = await usernameResponse.text();
        console.log('String from backend:', username);
        console.log('String from backend:', userid);

        const agentsData = await agentsResponse.json();
        const filteredAgents = agentsData.data.filter(agent => agent.uuid !== 'ded3520f-4264-bfed-162d-b080e2abccf9');
        filteredAgents.sort((a, b) => a.displayName.localeCompare(b.displayName));

        // Initialize agent grid
        const agentsGrid = document.getElementById('agentsGrid');
        const fragment = document.createDocumentFragment();
        filteredAgents.forEach(agent => {
            const agentDiv = document.createElement('div');
            agentDiv.classList.add('make-button');
            agentDiv.innerHTML = `
                <div class="p-0">
                    <img src="${agent.displayIconSmall}" alt="${agent.displayName}" class="img-fluid agent-image">
                </div>
            `;
            fragment.appendChild(agentDiv);
        });
        agentsGrid.appendChild(fragment);

        const inventory = localStorage.getItem(`${userid}_inventory`);
        const inventoryData = JSON.parse(inventory);
        console.log(inventoryData)
        weaponsOnly = inventoryData.Weapons
        buddiesOnly = inventoryData.Buddies
        cardsOnly = inventoryData.Cards
        titlesOnly = inventoryData.Titles
        spraysOnly = inventoryData.Sprays
        console.log(buddiesOnly)


        // Update agent loadout function
        async function updateAgentLoadout(agentName, image) {
            activeAgentName = agentName; // Update active agent's name
            const localStorageKey = `${userid}_${agentName}_loadout`;
            const agentLoadoutData = localStorage.getItem(localStorageKey);
            
            resetUses()
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
                agent_image.src = filteredAgents[index].displayIconSmall;

                // Update agent loadout based on clicked agent
                updateAgentLoadout(filteredAgents[index].displayName, filteredAgents[index].displayIconSmall);
            });
        });

        // Set initial loadout based on the first agent
        if (filteredAgents.length > 0) {
            const agent_name = document.querySelector('.agentname');
            agent_name.innerHTML = filteredAgents[0].displayName;

            const agent_image = document.querySelector('.agentImage');
            agent_image.src = filteredAgents[0].displayIconSmall;

            const firstAgentImage = document.querySelector('.agent-image');
            if (firstAgentImage) {
                firstAgentImage.classList.add('green-border');
            }

            // Update agent loadout for the first agent
            updateAgentLoadout(filteredAgents[0].displayName, filteredAgents[0].displayIconSmall);
        }

        // Event listener for saving the loadout data
        document.getElementById('saveLoadoutButton').addEventListener('click', () => {
            if (activeAgentName) {
                console.log("saving");
                console.log(dataBuffer)
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
                const loadoutResponse = await fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/import-loadout?puuid=${userid}`);
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
                const refreshResponse = await fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/refresh-inventory?puuid=${userid}`);
                const refreshData = await refreshResponse.text();
    
                localStorage.setItem(`${userid}_inventory`, refreshData)
                const inventory = localStorage.getItem(`${userid}_inventory`);
                const inventoryData = JSON.parse(inventory);
                weaponsOnly = inventoryData.Weapons
                buddiesOnly = inventoryData.Buddies
                cardsOnly = inventoryData.Cards
                titlesOnly = inventoryData.Titles
                spraysOnly = inventoryData.Sprays
                console.log("Refreshed Inv");
            } catch (error) {
                console.error('Error refreshing inventory:', error);
            }
        });

        // Function to render weapons data (assuming it's defined elsewhere)


    } catch (error) {
        console.error('Error fetching and processing data:', error);
    }

    document.querySelectorAll('.weapon').forEach(item => {
        // console.log(item)
        item.addEventListener('click', function(event) {
            activeItem = item
            var weaponId = item.getAttribute('data-weaponID')
            var topSkinId = item.getAttribute('data-skinID')
            weapon_popup(weaponId, topSkinId, item)
        })
    
        

      });

      console.log(buddiesOnly)

      document.querySelector('.skinPickerBg').addEventListener('click', function() {
        const skinPickerContainer = document.querySelector('.skinPickerContainer');
        skinPickerContainer.style.display = 'none';
        var currentBuddyID = activeItem.getAttribute("data-buddyID")
    
        console.log(currentBuddyID)
        if (currentBuddyID != "undefined") {
        const currentBuddy = buddiesOnly.find(b => b.ItemID === currentBuddyID)

        currentBuddy.Uses -= 1
        }
      });

      



      document.querySelector('.chooseButton').addEventListener('click', function() {
        if (activeBuddy.Uses == 0) {
            alert("no more buddies")
        }
        else {
            activeItem.setAttribute("data-skinID", activeSkin.ItemID)
            activeItem.setAttribute("data-activeChromaID", activeChroma)
            activeItem.setAttribute("data-buddyID", activeBuddy.ItemID);
            const skinPickerContainer = document.querySelector('.skinPickerContainer');
            skinPickerContainer.style.display = 'none';
            console.log(activeItem)
            console.log(activeSkin)
            console.log(activeChroma)
            weaponimage = activeItem.querySelector('.weaponimage')
            buddyimage = activeItem.querySelector('.buddyimage')
            
            chroma = activeSkin.Chromas.find(chroma => chroma.uuid === activeChroma)
            console.log(chroma)
        // Find the index of the item in dataBuffer.Guns
            const index = dataBuffer.Guns.findIndex(gun => gun.ID === activeSkin.Weaponid);

            // Log the old item
            console.log(dataBuffer.Guns[index]);

            // Update the item's properties
            console.log(dataBuffer.Guns[index].ChromaID)
            console.log(chroma.uuid)
            dataBuffer.Guns[index].ChromaID = chroma.uuid;
            console.log(dataBuffer.Guns[index].SkinID)
            console.log(activeSkin.ItemID.toLowerCase())
            dataBuffer.Guns[index].SkinID = activeSkin.ItemID.toLowerCase();
            dataBuffer.Guns[index].SkinLevelID = activeSkin.Levels[activeSkin.Levels.length - 1].uuid;
            dataBuffer.Guns[index].displayIcon = chroma.fullRender
            if (activeBuddy != ''){
                console.log(activeBuddy)
                dataBuffer.Guns[index].CharmID = activeBuddy.ItemID.toLowerCase();
                if (activeBuddy.Uses == 2) {
                    dataBuffer.Guns[index].CharmInstanceID = activeBuddy.InstanceID1.toLowerCase();
                }
                else {
                    dataBuffer.Guns[index].CharmInstanceID = activeBuddy.InstanceID2.toLowerCase();
                }
                dataBuffer.Guns[index].CharmLevelID = activeBuddy.LevelID.toLowerCase();
                buddyimage.src = activeBuddy.ImageURL

            }
            
            // Log the updated item
            console.log(dataBuffer.Guns[index]);
            console.log(buddyimage)
            console.log(activeItem)
            weaponimage.src = chroma.fullRender
            
            console.log(activeItem)
            activeBuddy = ''

        }
      });

      document.getElementById('skinSearchInput').addEventListener('input', function() {

        let filter = this.value.toLowerCase();
        if (activeType = "weapons") {
            let skins = document.getElementsByClassName('weapon-skin');
            for (let i = 0; i < skins.length; i++) {
                let skinName = skins[i].getElementsByClassName('skinName')[0].textContent.toLowerCase();
             //    let buddyName = buddies[i].getElementsByClassName('buddyName')[0].textContent.toLowerCase();
                if (skinName.includes(filter)) {
                    skins[i].style.display = '';
                } else {
                    skins[i].style.display = 'none';
                }
            }
        }
        if(activeType = "buddies") {
            let buddies = document.getElementsByClassName('buddy-item');
            for (let i = 0; i < buddies.length; i++) {
                let buddyName = buddies[i].getElementsByClassName('buddyName')[0].textContent.toLowerCase();
                if (buddyName.includes(filter)) {
                    buddies[i].style.display = '';
                } else {
                    buddies[i].style.display = 'none';
                }
            }
        }
        
    });

    document.getElementById('spraySearchInput').addEventListener('input', function() {
        let filter = this.value.toLowerCase()
        let sprays = document.querySelectorAll('.sprayGrid .spray-container')
        sprays.forEach(function(spray) {
            let altText = spray.querySelector('img').getAttribute('alt').toLowerCase();
            if (altText.includes(filter)) {
                spray.style.display = '';  // Show the spray
            } else {
                spray.style.display = 'none';  // Hide the spray
            }
        });

    });




    document.getElementById('cardSearchInput').addEventListener('input', function() {

        let filter = this.value.toLowerCase();
        let cards = document.querySelectorAll('.card-image'); // Select all .card-image elements
        
        for (let i = 0; i < cards.length; i++) {
            let img = cards[i].querySelector('img'); // Get the img tag within the current .card-image
            let cardName = img.alt.toLowerCase(); // Access the alt attribute of the img
        
            if (cardName.includes(filter)) {
                cards[i].style.display = ''; // Show the card if it matches the filter
            } else {
                cards[i].style.display = 'none'; // Hide the card if it doesn't match the filter
            }
        }
        })

    

    document.getElementById('cardSearchInput').addEventListener('input', function() {

        let filter = this.value.toLowerCase();
        let cards = document.querySelectorAll('.card-image'); // Select all .card-image elements
        
        for (let i = 0; i < cards.length; i++) {
            let img = cards[i].querySelector('img'); // Get the img tag within the current .card-image
            let cardName = img.alt.toLowerCase(); // Access the alt attribute of the img
        
            if (cardName.includes(filter)) {
                cards[i].style.display = ''; // Show the card if it matches the filter
            } else {
                cards[i].style.display = 'none'; // Hide the card if it doesn't match the filter
            }
        }
        })

      document.querySelector('.topWeapon').addEventListener('click', function() {
        const topWeapon = document.querySelector('.topWeapon')
        const weaponId = topWeapon.getAttribute('data-weaponId');
        const weapon = weaponsOnly.filter(weapon => weapon.Weaponid === weaponId);
        document.getElementById('skinSearchInput').value=''
        const skinGrid = document.querySelector('.skinGrid');

        weaponChoices(weapon)
      });
    document.querySelector('.buddyPreview').addEventListener('click', function() {
        buddyChoices()
    })


    document.querySelector('.confirm').addEventListener('click', function() {
        const invLargeImage = document.querySelector('.cardImage')
        const invWideImage = document.querySelector('.cardImageWide')
        const playercard = document.querySelector('.Card')
        const playerTitle = document.querySelector('.titleName')
        invLargeImage.src = activeCard.largeImageURL
        invWideImage.src = activeCard.wideImageURL
        playercard.setAttribute('data-cardID', activeCard.ItemID) 
        dataBuffer.Identity.PlayerCardID = activeCard.ItemID
        dataBuffer.Identity.PlayerTitleID = activeTitle.ItemID
        playerTitle.textContent = activeTitle.Title
        //if activeTitle has data in it then do this. else we cant i guess.
        console.log(activeTitle)
        playercard.setAttribute('data-titleid', activeTitle.ItemID)
        // playercard.setAttribute('data-titleid', activeTitle.getAttribute('data-item-id'))
        const cardPickerContainer = document.querySelector('.cardPickerContainer');
        cardPickerContainer.style.display = "none";

        //do data buffer stuff here:

        console.log(activeCard.ItemID)

        console.log(activeTitle.ItemID)


    })

    // const playercard = document.querySelector('.Card')
    // const titleid = playercard.getAttribute('data-titleID')
    // activeTitle = titlesOnly.find(title => title.ItemID === titleid)
    // console.log(activeTitle)
    // const player_title = document.querySelector('.titleName')
    // player_title.textContent = activeTitle.Title
  

    //do sprays here
    const sprayBar = document.querySelector('.spraysBar')
    const defaultSprayURL = 'https://media.valorant-api.com/sprays/0a6db78c-48b9-a32d-c47a-82be597584c1/displayicon.png'
    sprayBar.querySelector(".leftSpray").src = defaultSprayURL;
    sprayBar.querySelector(".TopSpray").src = defaultSprayURL;
    sprayBar.querySelector(".BotSpray").src = defaultSprayURL;
    sprayBar.querySelector(".RightSpray").src = defaultSprayURL;
    const sprayContainer = document.querySelector('.sprayPickerContainer')
    document.querySelector('.spraysBar').addEventListener('click', function(){
            if (sprayContainer.style.display === 'none') {
                document.getElementById('spraySearchInput').value = '';
                sprayContainer.style.display = "unset";
                const sprayBarLine = document.querySelector('.spraysBarLine')
            
                renderSprayData()
            } else {
                sprayContainer.style.display = 'none';
                console.log("not openning because it says its closed");
            }

        })
           
    document.querySelector('.sprayPickerBg').addEventListener('click', function() {
        const sprayPickerContainer = document.querySelector('.sprayPickerContainer');
        const leftSprayBarImg = document.querySelector('.spraysBar img.leftSpray')
        const rightSprayBarImg = document.querySelector('.spraysBar img.RightSpray')
        const topSprayBarImg = document.querySelector('.spraysBar img.TopSpray')
        const bottSprayBarImg = document.querySelector('.spraysBar img.BotSpray')
        // Select the image inside .sprayContainer directly
        const sprayTopImg = document.querySelector('.sprayContainer img.topSpray');
        const sprayRightImg = document.querySelector('.sprayContainer img.rightSpray');
        const sprayLeftImg = document.querySelector('.sprayContainer img.leftSpray');
        const sprayBotImg = document.querySelector('.sprayContainer img.botSpray');
        console.log("Logging Spray Top Image: ", sprayTopImg);
        const imgSrc = sprayTopImg.src;
        const imgId = sprayTopImg.getAttribute('img-id');
        console.log("Image Src: ", imgSrc);
        console.log("Image ID: ", imgId);
        topSprayBarImg.src = sprayTopImg.src;
        leftSprayBarImg.src = sprayLeftImg.src;
        rightSprayBarImg.src = sprayRightImg.src;
        bottSprayBarImg.src = sprayBotImg.src;


        dataBuffer.Sprays[0].SprayID = sprayTopImg.getAttribute('img-id');
        dataBuffer.Sprays[1].SprayID = sprayRightImg.getAttribute('img-id');
        dataBuffer.Sprays[2].SprayID = sprayBotImg.getAttribute('img-id');
        dataBuffer.Sprays[3].SprayID = sprayLeftImg.getAttribute('img-id');
        sprayPickerContainer.style.display = 'none';
        
        
    
        });
      

    document.querySelector('.spraysBar').addEventListener('click', function() {
        console.log("test")
        // const sprayTop = document.querySelector('.sprayTop')
        // const sprayTopImg = document.querySelector('.sprayTop img')

        // const sprayRight = document.querySelector('.sprayRight')
        // const sprayRightImg = document.querySelector('.sprayRight img')

        // const sprayBottom = document.querySelector('.sprayBottom')
        // const sprayBottomImg = document.querySelector('.sprayBottom img')

        // const sprayLeft = document.querySelector('.sprayLeft')
        // const sprayLeftImg = document.querySelector('.sprayLeft img')

        // const wheelTop = document.querySelector('.sprayDirectionTopButton img')
        // const wheelRight = document.querySelector('.sprayDirectionRightButton img')
        // const wheelBottom = document.querySelector('.sprayDirectionBottomButton img')
        // const wheelLeft = document.querySelector('.sprayDirectionLeftButton img')
        // console.log(sprayRight)
        // console.log(sprayRightImg)

        // wheelTop.src = sprayTopImg.src
        // wheelRight.src = sprayRightImg.src
        // wheelLeft.src = sprayLeftImg.src
        // wheelBottom.src = sprayBottomImg.src

        // dataBuffer.Sprays[0].SprayID = sprayTop.getAttribute('img-id');
        // dataBuffer.Sprays[1].SprayID = sprayRight.getAttribute('img-id');
        // dataBuffer.Sprays[2].SprayID = sprayBottom.getAttribute('img-id');
        // dataBuffer.Sprays[3].SprayID = sprayLeft.getAttribute('img-id');
      
        // console.log(dataBuffer)




        // sprayContainer.style.display = 'none';




    




    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    const grid = document.querySelector('.skinPickerSkins');

    // Scroll to a specific position smoothly
    grid.scrollTo({
        top: 100, // Replace with your desired scroll position
        behavior: 'smooth'
    });

    // Scroll by a certain amount smoothly
    grid.scrollBy({
        top: 100, // Replace with your desired scroll amount
        behavior: 'smooth'
    });
       
    
    const popup = document.getElementById("infoPopup");
    const closePopup = document.getElementById("closePopup");
    const dontShowAgain = document.getElementById("dontShowAgain");
    const helpButton = document.querySelector('.faq-button');
    // Check if the popup should be shown
    // const shouldShowPopup = localStorage.getItem("dontShowAgain") !== "true";
    const shouldShowPopup = localStorage.getItem("dontShowAgain");
    console.log(shouldShowPopup)


    if (shouldShowPopup !== "true") {
        popup.style.display = "flex";
    }

    // Close button event
    closePopup.addEventListener("click", () => {
        if (dontShowAgain.checked) {
        localStorage.setItem("dontShowAgain", "true");
        }
        popup.style.display = "none";
    });

    helpButton.addEventListener("click", () => {
        popup.style.display = "flex"
    });
    

});







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

                var skinid = gun.SkinID
                var chromaid = gun.ChromaID

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
                            const buddyImageUrl = `https://media.valorant-api.com/buddies/${buddy}/displayicon.png`;
                            const usedBuddy = buddiesOnly.find(b => b.ItemID === buddy);
                            usedBuddy.Uses -= 1;
                            // console.log(usedBuddy)
                            buddyImage.onload = function() {
                                // Once buddyImage is loaded, or directly set its src
                                buddyImage.src = buddyImageUrl;
                            };
                            buddyImage.src = buddyImageUrl; // Set src immediately
                        } else {
                            // console.log("no buddy")
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


    const sprays = Array.isArray(data.Sprays) ? data.Sprays : [];

    const sprayCategories = document.querySelectorAll('.sprayItem');

    sprayCategories.forEach(spraySlot => {
        const sprayPos = spraySlot.getAttribute('data-slotId');
        var spray = sprays.find(s => s.EquipSlotID === sprayPos);

        if (spray) {
            const sprayId = spray.SprayID.toUpperCase();
            const sprayIconURL = "http://vinfo-api.com/media/Sprays/" + sprayId + ".png";
            const sprayImage = spraySlot.querySelector('.sprayImage');
            sprayImage.src = sprayIconURL;
        }
    });
}
function resetUses(){
    buddiesOnly.forEach(buddy => {
        buddy.Uses = 2;
        // console.log("hi")
    })
}

function weapon_popup(weaponId, topSkinId, item) {
    const skinGrid = document.querySelector('.skinGrid');
    const buddyImage = item.querySelector('.buddyimage');
    console.log(buddyImage.src)
    const buddyPreviewImage = document.querySelector('.buddyPreview .clickForBuddy');
    const chromaPreview = document.querySelector('.chromaPreview');
    const topWeapon = document.querySelector('.topWeapon');
    var buddy = item.getAttribute('data-buddyID');
    topWeapon.setAttribute('data-weaponID', weaponId);
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
    console.log(buddy)
    if (buddy != "undefined") {
        
        currentBuddy = buddiesOnly.find(b => b.ItemID === buddy)
        console.log(currentBuddy)
        currentBuddy.Uses += 1;

        buddyPreviewImage.src = `https://media.valorant-api.com/buddies/${buddy}/displayicon.png`;
        
    }
    else {
        buddyPreviewImage.src = "./img/image.png"
    }

    
    renderTopWeapon(topWeaponData)
    weaponChoices(weapon)
    



}


function weaponChoices(weapon){
    activeType = "weapons"
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';

    skinGrid.style.visibility = 'hidden';
    
    document.getElementById('skinSearchInput').value=''
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
                skinImage.src = w.Chromas[0].fullRender; // Set the src to the first chroma displayIcon
                skinImage.alt = w.Name; // Optionally set alt text
                const skinName = document.createElement('div');
                skinName.className = "skinName"
                skinName.innerHTML = w.Name

                weaponDiv.appendChild(skinName)

                weaponDiv.appendChild(skinImage);

                // Add event listener to update topWeapon image on click
                weaponDiv.addEventListener('click', () => {
                    activeSkin = w
                    activeChroma = w.Chromas[0].uuid;

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
    document.getElementById('skinSearchInput').value=''
    activeType = "buddies"

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
        const buddyName = document.createElement('div');
        buddyName.className = "buddyName"
        buddyName.innerHTML = buddy.Name 
        const buddyUses = document.createElement('div')
        buddyUses.className = "buddyUses"
        buddyUses.innerHTML = "Uses: "+buddy.Uses

        // Add event listener to update buddyPreview image when clicked 
        buddyImage.addEventListener('click', () => {
            buddyImg.src = buddy.ImageURL;
            console.log(buddyImg.src)
            activeBuddy = buddy
           
            console.log(activeBuddy)
        });

        buddyDiv.appendChild(buddyImage);
        skinGrid.appendChild(buddyDiv);
        buddyDiv.appendChild(buddyName);
        buddyDiv.appendChild(buddyUses);
    });    
}
function renderTopWeapon(data){
    const chromaPreview = document.querySelector('.chromaPreview');
    const topWeapon = document.querySelector('.topWeapon');
    console.log(data);
    // console.log(data.Chromas[0]);
    // chroma = activeSkin.Chromas.find(chroma => chroma.id === activeChroma)
    console.log(activeSkin);
    console.log(data.Chromas)
    console.log(activeChroma)
    const topweaponimg = data.Chromas.find(chroma=>chroma.uuid===activeChroma);
    console
    console.log(topweaponimg);
    console.log(topweaponimg.fullRender);
    topWeapon.src = topweaponimg.fullRender;
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
            topWeaponImage.src = chroma.fullRender;
            activeChroma = chroma.uuid;
        });
        chromaImage.className = `chroma${index + 1}image`;

        chromaSwatch.appendChild(chromaImage);
        chromaPreview.appendChild(chromaSwatch);
    });

    // If a weapon has only 1 chroma, set the first chroma.id as active chroma id
    if (data.Chromas.length === 1) {
        activeChroma = data.Chromas[0].uuid;
        console.log(`Active chroma set to: ${activeChroma}`);
    }
}









function renderSprayData(){
    const sprayDisplay = document.querySelector('.topSpray');
    const grid = document.querySelector('.sprayGrid');
    const sprayPreview = document.querySelector('.fullartimage');
    grid.innerHTML = '';
    grid.style.visibility = 'hidden';
    console.log(spraysOnly);

    spraysOnly.forEach(s => {
        const sprayDiv = document.createElement('div');
        sprayDiv.classList.add('spray-container');

        const sprayImage = document.createElement('img');
        sprayImage.src = s.displayIcon;
        sprayImage.alt = s.Name;
        sprayImage.setAttribute('full-display-img',  s.fullDisplayImg);
        const sprayTitle = document.querySelector('.sprayTitle');
        // Handle click event to display the spray
        sprayDiv.addEventListener('click', () => {
            activeSpray = s;
            console.log(activeSpray);
            console.log(activeSpray.fullDisplayImg)
            if (activeSpray.fullDisplayGif != null) {
                sprayPreview.src = activeSpray.fullDisplayGif;
            } else if (activeSpray.fullDisplayImg != null) {
                sprayPreview.src = activeSpray.fullDisplayImg;
            }
            else {
                sprayPreview.src = activeSpray.displayIcon
            }
            sprayTitle.textContent = activeSpray.Name;
        });

        sprayDiv.appendChild(sprayImage);
        grid.appendChild(sprayDiv);
    });

    grid.style.visibility = 'visible';

    // Add event listeners to dropzones to update their images based on activeSpray
    const dropzones = document.querySelectorAll('.topSpray, .botSpray, .rightSpray, .leftSpray');

    dropzones.forEach(dropzone => {
        dropzone.addEventListener('click', () => {
            console.log("clciked")
            if (activeSpray) {
                console.log(activeSpray)
                console.log(dropzone.src)
                dropzone.src = activeSpray.displayIcon; 
                dropzone.setAttribute('img-id', activeSpray.ItemID);
            }
        });
    });
}
