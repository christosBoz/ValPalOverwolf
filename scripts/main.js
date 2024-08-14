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

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch user ID and agents data in parallel
        const [useridResponse, agentsResponse, usernameResponse] = await Promise.all([
            fetch('http://127.0.0.1:5000/get-userid'),
            fetch('https://vinfo-api.com/json/characters'),
            fetch('http://127.0.0.1:5000/get-username')
        ]);

        if (!useridResponse.ok || !agentsResponse.ok) {
            throw new Error('Network response was not ok');
        }
        username = await usernameResponse.text();
        console.log('String from backend:', username);
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
        cardsOnly = inventoryData.Cards
        titlesOnly = inventoryData.Titles
        console.log(cardsOnly)


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
            var weaponId = item.getAttribute('data-weaponID').toUpperCase()
            var topSkinId = item.getAttribute('data-skinID').toUpperCase()
            weapon_popup(weaponId, topSkinId, item)
        })
    
        

      });
      const card = document.querySelector('.Card')
        card.addEventListener('click', function(){
            
            card_popup();
            console.log(activeCard)

    
      });

      document.querySelector('.skinPickerBg').addEventListener('click', function() {
        const skinPickerContainer = document.querySelector('.skinPickerContainer');
        skinPickerContainer.style.display = 'none';
        var currentBuddyID = activeItem.getAttribute("data-buddyID")
        currentBuddyID = currentBuddyID.toUpperCase();
        // console.log(currentBuddyID)
        const currentBuddy = buddiesOnly.find(b => b.ItemID === currentBuddyID)
        currentBuddy.Uses -= 1
      });

      document.querySelector('.cardPickerBg').addEventListener('click', function() {
        const cardPickerContainer = document.querySelector('.cardPickerContainer');
        cardPickerContainer.style.display = 'none';
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
            weaponimage.src = chroma.displayIcon
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
        const skinGrid = document.querySelector('.skinGrid');
        skinGrid.innerHTML = '';
        skinGrid.innerHTML = weaponChoicesHTML
    })
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
                        // console.log(buddyid);
                        if (buddy != "undefined") {
                            buddy = buddy.toUpperCase();
                            const buddyImageUrl = `https://vinfo-api.com/media/Charms/${buddy}.png`;
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

    const playercard = document.querySelector('.Card')
    const Identity = data.Identity;
    const playercardImg = document.querySelector('.cardImage');
    const cardImage = Identity.PlayerCardID.toUpperCase();
    playercardImg.src = "https://vinfo-api.com/media/PlayerCards/" + cardImage + "_large.png";
    const playercardWide = document.querySelector('.cardImageWide');
    playercardWide.src = "https://vinfo-api.com/media/PlayerCards/" + cardImage + "_wide.png";

    playercard.setAttribute('data-cardID', Identity.PlayerCardID);
    playercard.setAttribute('data-titleID', Identity.PlayerTitleID);

    const player_username = document.querySelectorAll('#username')
    const player_title = document.querySelector('.titleName')
    const wideUsername = document.querySelector('.botLineUsername')
    wideUsername.textContent = username;
    activeTitle = titlesOnly.find(title => title.ItemID === Identity.PlayerTitleID)
    console.log(activeTitle)
    player_title.textContent = activeTitle.Title;
    console.log(player_username)
    player_username.forEach(name =>{
        name.innerHTML = username
    })

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
function resetUses(){
    buddiesOnly.forEach(buddy => {
        buddy.Uses = 2;
        // console.log("hi")
    })
}

function card_popup() {

//     preview_dictionary={
//         "card":cardID,
//         "agentImg":agentImg,
//         "agentName":agentName,
//         "username":username
//    };

//    console.log(preview_dictionary);


    const cardPickerContainer = document.querySelector('.cardPickerContainer');
    if (cardPickerContainer.style.display === 'none') {
        cardPickerContainer.style.display = "unset";
    } else {
        cardPickerContainer.style.display = 'none';
        console.log("balls");
    }
    

    cardChoices()

    const dropdown = document.querySelector('.titleDropDown');
    const select = dropdown.querySelector('.select');
    const selected = dropdown.querySelector('.selected');
    const caret = dropdown.querySelector('.caret');
    const menu = dropdown.querySelector('.selectMenu');
    selected.innerText = activeTitle.Title;

    
    select.addEventListener('click', (event) => {
        event.stopPropagation();
        // Toggle the clicked select styles
        select.classList.toggle('select-clicked');
        
        // Toggle the rotation of the caret
        caret.classList.toggle('caret-rotate');
        
        // Toggle the visibility of the menu
        menu.classList.toggle('menu-open');

        titleChoices()
    });
    //when click on select then do titlechoices.
    
}

function cardChoices(){
    const cardGrid = document.querySelector('.cardGrid')
    const invLargeImage = document.querySelector('.cardImage')
    const invWideImage = document.querySelector('.cardImageWide')
    
    cardGrid.innerHTML = '';
    cardGrid.style.visibility = 'hidden';
    const topCardLong = document.querySelector(".topCardLong");
    topLoadingCard = document.querySelector(".topLoadingCard");
    const loadingCardWide = topLoadingCard.querySelector('.cardImageWide');
    const cardtitle = document.querySelector('.cardTitle')
    const playercard = document.querySelector('.Card')
    const cardid = playercard.getAttribute('data-cardID')
    // console.log(cardid)
    activeCard = cardsOnly.find(card => card.ItemID === cardid)
    console.log(activeCard)
    topCardLong.src = activeCard.largeImageURL
    loadingCardWide.src = activeCard.wideImageURL
    cardtitle.innerHTML = activeCard.Name
    
    
    const renderCardPromise = new Promise((resolve, reject) => {
        cardsOnly.forEach(c => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card-image'); // Add a class for styling if needed

             // Create an img element for the skin
             const cardImage = document.createElement('img');
            //  cardImage.className = "Card_"+ c.ItemID
             cardImage.src = c.smallImageURL
             cardImage.alt = c.Name; // Optionally set alt text
             const cardName = document.createElement('div');
             cardName.className = "cardName"
            //  cardName.innerHTML = c.Name

            //  cardDiv.appendChild(cardName)
            cardDiv.addEventListener('click', () => {
                activeCard = c
                console.log(activeCard)
                topCardLong.src = c.largeImageURL
                loadingCardWide.src = c.wideImageURL
                cardtitle.innerHTML = c.Name
                // invLargeImage.src = c.largeImageURL
                // invWideImage.src = c.wideImageURL
                // playercard.setAttribute('data-cardID', c.ItemID) 
            });
             cardDiv.appendChild(cardImage);



             cardGrid.appendChild(cardDiv);
             cardChoicesHTML = cardGrid.innerHTML
        })
        
        resolve();
    });
    renderCardPromise.then(() => {
        cardGrid.style.visibility = 'visible';
    });

}


function titleChoices() {
    const playercard = document.querySelector('.Card')
    const titleid = playercard.getAttribute('data-titleID')
    console.log(titleid)
    activeTitle = titlesOnly.find(title => title.ItemID === titleid)
    const titleSelect = document.querySelector('.selectMenu');
    console.log(titleSelect)
    titleSelect.innerHTML = '';
    console.log(titlesOnly)
    titlesOnly.forEach(t => {
        const option = document.createElement('li');
        option.classList.add('option-select'); // Add a class for styling if needed
        //<option value="option1">Option 1</option>
        option.setAttribute('data-item-id', t.ItemID);
        option.textContent = t.Title;
        titleSelect.appendChild(option);
    });

    const dropdown = document.querySelector('.titleDropDown');

    // Get inner elements
    const select = dropdown.querySelector('.select');
    const caret = dropdown.querySelector('.caret');
    const menu = dropdown.querySelector('.selectMenu');
    const options = dropdown.querySelectorAll('.option-select');
    const selected = dropdown.querySelector('.selected');
    selected.innerText = activeTitle.Title;

    
    select.addEventListener('click', (event) => {
        event.stopPropagation();
        // Toggle the clicked select styles
        select.classList.toggle('select-clicked');
        
        // Toggle the rotation of the caret
        caret.classList.toggle('caret-rotate');
        
        // Toggle the visibility of the menu
        menu.classList.toggle('menu-open');
    });
    
    options.forEach(option => {
        option.addEventListener('click', (event) => {
            // Stop the event from bubbling up to the select element
            event.stopPropagation();
    
            // Set the selected text
            selected.innerText = option.innerText;
    
            // Remove the styles indicating the select is active
            select.classList.remove('select-clicked');
            caret.classList.remove('caret-rotate');
            menu.classList.remove('menu-open');
    
            // Remove active class from all options and add it to the clicked one
            options.forEach(option => {
                option.classList.remove('active');
            });
            option.classList.add('active');
            console.log(option)

            activeTitle = titlesOnly.find(title => title.Title === option.textContent)
            console.log(activeTitle)
        });
    });
    
    
    // Close the dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!dropdown.contains(event.target)) {
            select.classList.remove('select-clicked');
            caret.classList.remove('caret-rotate');
            menu.classList.remove('menu-open');
            event.stopPropagation();
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
    var buddy = item.getAttribute('data-buddyID');
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
        buddy = buddy.toUpperCase();
        currentBuddy = buddiesOnly.find(b => b.ItemID === buddy)
        console.log(currentBuddy)
        currentBuddy.Uses += 1;

        buddyPreviewImage.src = `https://vinfo-api.com/media/Charms/${buddy}.png`;
        
    }
    else {
        buddyPreviewImage.src = "./img/image.png"
    }
    // if (buddyImage.src != "overwolf-extension://mhlpbbigoglahfnkpekoamfknlnaneebgodenaam/index.html") {
    //     // Update the variable with the buddy image URL
    //     selectedBuddyImageSrc = buddyImage.src;
    //     console.log('Selected Buddy Image URL:', selectedBuddyImageSrc);
        
    //     // Update the src attribute of the buddyPreview image
    //     if (buddyPreviewImage) {
    //         buddyPreviewImage.src = selectedBuddyImageSrc;
    //         console.log(buddyPreviewImage.src)
    //     }
    // }
    
    renderTopWeapon(topWeaponData)
    weaponChoices(weapon)
    



}
// function cardChoices(card){
//     const cardGrid = document.querySelector('.cardGrid')
//     cardGrid.innerHTML = '';
//     cardGrid.style.visibility = 'hidden';
//     const topCardLong = document.querySelector(".topCardLong");
//     const loadingCardWide = topLoadingCard.querySelector('.cardImageWide');


//     const renderCardPromise = new Promise((resolve, reject) => {
//         card.forEach(c => {
//             const cardDiv = document.createElement('div');
//             cardDiv.classList.add('card-image'); // Add a class for styling if needed

//              // Create an img element for the skin
//              const cardImage = document.createElement('img');
//             //  cardImage.className = "Card_"+ c.ItemID
//              cardImage.src = c.smallImageURL
//              cardImage.alt = c.Name; // Optionally set alt text
//              const cardName = document.createElement('div');
//              cardName.className = "cardName"
//             //  cardName.innerHTML = c.Name

//             //  cardDiv.appendChild(cardName)
//             cardDiv.addEventListener('click', () => {
//                 topCardLong.src = card.
//             });
//              cardDiv.appendChild(cardImage);



//              cardGrid.appendChild(cardDiv);
//              cardChoicesHTML = cardGrid.innerHTML
//         })
//         resolve();
//     });
//     renderCardPromise.then(() => {
//         cardGrid.style.visibility = 'visible';
//     });

// }

// function renderCardImage(data){
    

// }

function weaponChoices(weapon){
    activeType = "weapons"
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









