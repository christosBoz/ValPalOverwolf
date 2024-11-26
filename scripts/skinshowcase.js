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
    renderWeaponGrid(weaponsOnly)
    setupSearch(weaponsOnly)



});


function renderWeaponGrid(weaponsOnly) {
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';
    skinGrid.style.visibility = 'hidden';

    // document.getElementById('skinSearchInput').value=''
    // Create a promise to handle rendering of weapons
    const renderWeaponsPromise = new Promise((resolve, reject) => {
        weaponsOnly.forEach(w => {
            //filter out standard and random skin img

            if (w.Name.toLowerCase().includes('standard') || w.Name.toLowerCase().includes('random') || w.Name.toLowerCase() === 'melee') {
                return; // Skip this iteration
            }


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