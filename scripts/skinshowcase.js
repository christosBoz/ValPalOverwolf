let weaponsOnly = ''




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
        const [usernameResponse] = await Promise.all([
            fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/get-username?puuid=${userid}`)
        ]);

       
        username = await usernameResponse.text();
        console.log('String from backend:', username);
        console.log('String from backend:', userid);

    
        // // Initialize agent grid
        // const agentsGrid = document.getElementById('agentsGrid');
        // const fragment = document.createDocumentFragment();
        // filteredAgents.forEach(agent => {
        //     const agentDiv = document.createElement('div');
        //     agentDiv.classList.add('make-button');
        //     agentDiv.innerHTML = `
        //         <div class="p-0">
        //             <img src="${agent.displayIconSmall}" alt="${agent.displayName}" class="img-fluid agent-image">
        //         </div>
        //     `;
        //     fragment.appendChild(agentDiv);
        // });
        // agentsGrid.appendChild(fragment);

        const inventory = localStorage.getItem(`${userid}_inventory`);
        const inventoryData = JSON.parse(inventory);
        console.log(inventoryData)
        weaponsOnly = inventoryData.Weapons
        // buddiesOnly = inventoryData.Buddies
        // cardsOnly = inventoryData.Cards
        // titlesOnly = inventoryData.Titles
        // spraysOnly = inventoryData.Sprays


        

        async function fetchLoadout(loadoutFileName) {
            const response = await fetch(loadoutFileName);
            if (!response.ok) {
                throw new Error('Loadout file not found');
            }
            return await response.json();
        }

        
        

        // Event listener for refreshing the inventory data
        // document.getElementById('refreshButton').addEventListener('click', async () => {
        //     try {
        //         const refreshResponse = await fetch(`http://ec2-3-18-187-99.us-east-2.compute.amazonaws.com:5000/refresh-inventory?puuid=${userid}`);
        //         const refreshData = await refreshResponse.text();
    
        //         localStorage.setItem(`${userid}_inventory`, refreshData)
        //         const inventory = localStorage.getItem(`${userid}_inventory`);
        //         const inventoryData = JSON.parse(inventory);
        //         weaponsOnly = inventoryData.Weapons
        //         buddiesOnly = inventoryData.Buddies
        //         cardsOnly = inventoryData.Cards
        //         titlesOnly = inventoryData.Titles
        //         spraysOnly = inventoryData.Sprays
        //         console.log("Refreshed Inv");
        //     } catch (error) {
        //         console.error('Error refreshing inventory:', error);
        //     }
        // });

        // Function to render weapons data (assuming it's defined elsewhere)


    } catch (error) {
        console.error('Error fetching and processing data:', error);
    }


    console.log(weaponsOnly)
    renderWeaponGrid(weaponsOnly);
    // setGradients()
    setupSearch(weaponsOnly);
    setupFilter(weaponsOnly);

    
});


async function renderWeaponGrid(weaponsOnly) {
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';
    skinGrid.style.visibility = 'hidden';
    const totalCounterDiv = document.querySelector('.totalCounter p');

    let totalCounter = 0;

    // Use a for...of loop to work with async/await
    for (const w of weaponsOnly) {
        if (
            w.Name.toLowerCase().includes('standard') ||
            w.Name.toLowerCase().includes('random') ||
            w.Name.toLowerCase() === 'melee'
        ) {
            continue; // Skip unwanted skins
        }

        if (w.Chromas && w.Chromas.length > 0) {
            // Fetch necessary data
            const contentTierDisplayIcon = await fetchContentTierIcon(w.ContentTierUuid);
            const priceData = await fetchWeaponSkinByOfferID(w.OfferID);

            // Create a div for the weapon skin
            const weaponDiv = document.createElement('div');
            weaponDiv.classList.add('weapon-skin');
            weaponDiv.setAttribute('data-contenttier', w.ContentTierUuid);

            // Create skin image
            const skinImage = document.createElement('img');
            skinImage.className = "Weapon_" + w.Weaponid;
            skinImage.src = w.Chromas[0].fullRender;
            skinImage.alt = w.Name;
            skinImage.id = "skin_" + w.Weaponid; 

            // Create skin name div
            const skinName = document.createElement('div');
            skinName.className = "skinName";
            skinName.innerHTML = w.Name;

            // Create skin price div
            const skinPrice = document.createElement('div');
            skinPrice.className = "skinPrice";
            skinPrice.innerHTML = priceData === null ? '' : `${priceData}`;

            // Conditionally append tier image if priceData is not null
            if (priceData !== null) {
                const tierImg = document.createElement('img');
                tierImg.src = "img/vpimg.png";
                tierImg.alt = "tier img";
                skinPrice.appendChild(tierImg);
                // You can also adjust the image size or any other styles for the tier image here if needed.
            }

            // Append elements
            weaponDiv.appendChild(skinName);
            weaponDiv.appendChild(skinImage);
            weaponDiv.appendChild(skinPrice);

            // Update totalCounter if priceData is available
            if (priceData !== null) {
                totalCounter += priceData;
            }

            // Add click event listener
            weaponDiv.addEventListener('click', () => {
                activeSkin = w;
                activeChroma = w.Chromas[0].uuid;
            });

            // Append weaponDiv to the grid
            skinGrid.appendChild(weaponDiv);
        }
    }

    // Make the skinGrid visible after rendering
    skinGrid.style.visibility = 'visible';
    const costUSD = (totalCounter * 0.010505).toFixed(2);
    totalCounterDiv.textContent = `${totalCounter} \t ≈ $${costUSD}`;
    const vpLogo = document.createElement('img')
    vpLogo.src = "img/vpimg.png";
    totalCounterDiv.appendChild(vpLogo);
    console.log('Total Counter:', totalCounter);




}

function setGradients(){
    
    const skinGrid = document.querySelector('.skinGrid');
    const allSkins = skinGrid.querySelectorAll(".weapon-skin");
    console.log(allSkins);
    // console.log(skinGrid.getElementsByClassName("weapon-skin"))
    
    // weaponDivs.forEach(weaponDiv => {
    //     const contentTier = weaponDiv.getAttribute('data-contenttier'); // Get the content tier ID

    //     // Use a switch statement to apply the corresponding gradient
    //     switch (contentTier) {
    //         case '12683d76-48d7-84a3-4e09-6985794f0445': // Select
    //             weaponDiv.style.background = 'linear-gradient(to top, #4382AA, transparent)';
    //             break;
    //         case '60bca009-4182-7998-dee7-b8a2558dc369': // Premium
    //             weaponDiv.style.background = 'linear-gradient(to top, #864763, transparent)';
    //             break;
    //         case 'e046854e-406c-37f4-6607-19a9ba8426fc': // Exclusive
    //             weaponDiv.style.background = 'linear-gradient(to top, #B26947, transparent)';
    //             break;
    //         case '0cebb8be-46d7-c12a-d306-e9907bfc5a25': // Deluxe
    //             weaponDiv.style.background = 'linear-gradient(to top, #179682, transparent)';
    //             break;
    //         case '411e4a55-4e59-7757-41f0-86a53f101bb5': // Ultra
    //             weaponDiv.style.background = 'linear-gradient(to top, #DABE59, transparent)';
    //             break;
    //         default:
    //             console.log('Unknown tier:', contentTier); // Optional: for debugging if any tier doesn't match
    //             break;
    //     }
    // });
}




// Set up the search functionality
function setupSearch(weaponsOnly) {
    const searchBar = document.getElementById('SearchInput');
    searchBar.addEventListener('input', (event) => {
        const searchText = event.target.value.toLowerCase();
        const filteredWeapons = weaponsOnly.filter(w => 
            !w.Name.toLowerCase().includes('standard') &&
            !w.Name.toLowerCase().includes('random') &&
            w.Name.toLowerCase() !== 'melee' &&
            w.Name.toLowerCase().includes(searchText)
        );
        renderWeaponGrid(filteredWeapons);
    });
}


function setupFilter(weaponsOnly) {
    const filterDrop = document.querySelector('.filterDrop #skinFilter');
    filterDrop.addEventListener('change', (event) => {
        const selected = event.target.value;

        // Map dropdown values to content tier UUIDs
        const contentTierMapping = {
            deluxe: '0cebb8be-46d7-c12a-d306-e9907bfc5a25',
            exclusive: 'e046854e-406c-37f4-6607-19a9ba8426fc',
            premium: '60bca009-4182-7998-dee7-b8a2558dc369',
            select: '12683d76-48d7-84a3-4e09-6985794f0445',
            ultra: '411e4a55-4e59-7757-41f0-86a53f101bb5',
        };

        const filteredWeapons = weaponsOnly.filter(w => {
            const contentTier = w.ContentTierUuid; // Ensure `ContentTierID` is part of the data
            // console.log(contentTier)
            if (selected === 'all') return true; // Show all items if "All Items" is selected
            return contentTier === contentTierMapping[selected];
        });
        renderWeaponGrid(filteredWeapons)
    });
}

// Function to fetch content tier display icon
async function fetchContentTierIcon(contentTierUuid) {
    try {
        const response = await fetch(`https://valorant-api.com/v1/contenttiers/${contentTierUuid}`);
        const data = await response.json();
        if (data.status === 200) {
            return data.data.displayIcon; // Return the display icon URL
        } else {
            console.error("Content tier fetch failed", data);
            return null; // If the fetch failed, return null
        }
    } catch (error) {
        console.error("Error fetching content tier icon:", error);
        return null; // Return null in case of an error
    }
}

let weaponDataCache = null;

async function fetchWeaponSkinByOfferID(offerID) {
    try {
        if (!weaponDataCache) {
            const response = await fetch('./weaponskin.json');
            if (!response.ok) {
                console.error(`Failed to load local JSON: ${response.status} ${response.statusText}`);
                return null;
            }
            weaponDataCache = await response.json();
        }

        // Search for the skin with the matching offerID
        const skin = weaponDataCache.find((item) => item.offerId === offerID);

        return skin ? Object.values(skin.price)[0] : null;
    } catch (error) {
        console.error("Error loading weapon skins locally:", error);
        return null;
    }
}




