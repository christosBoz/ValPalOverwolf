let weaponsOnly = '';
let activeCategory = 'Weapons';
let activeSubCategory = 'All';
const weaponType = {
    Pistol: [
        '29a0cfab-485b-f5d5-779a-b59f85e204a8', // Classic
        '1baa85b4-4c70-1284-64bb-6481dfc3bb4e', // Shorty
        '44d4e95c-4157-0037-81b2-17841bf2e8e3', // Frenzy
        '42da8ccc-40d5-affc-beec-15aa47b42eda', // Ghost
        'e336c6b8-418d-9340-d77f-7a9e4cfe0702'  // Sheriff
    ],
    Rifle: [
        'ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a', // Vandal
        '9c82e19d-4575-0200-1a81-3eacf00cf872'  // Phantom
    ],
    SMG: [
        '462080d1-4035-2937-7c09-27aa2a5c27a7', // Stinger
        'f7e1b454-4ad4-1063-ec0a-159e56b58941'  // Spectre
    ],
    Shotgun: [
        '910be174-449b-c412-ab22-d0873436b21b', // Bucky
        'ec845bf4-4f79-ddda-a3da-0db3774b2794'  // Judge
    ],
    Sniper: [
        'c4883e50-4494-202c-3ec3-6b8a9284f00b', // Marshal
        'a03b24d3-4319-996d-0f8c-94bbfba1dfc7'  // Operator
    ],
    'Machine Gun': [
        '55d8a0f4-4274-ca67-fe2c-06ab45efdf58', // Ares
        '63e6c2b6-4a8e-869c-3d4c-e38355226584'  // Odin
    ],
    Melee: [
        '2f59173c-4bed-b6c3-2191-dea9b58be9c7'  // Knife
    ]
};



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

        const inventory = localStorage.getItem(`${userid}_inventory`);
        const inventoryData = JSON.parse(inventory);
        console.log(inventoryData)
        weaponsOnly = inventoryData.Weapons
        buddiesOnly = inventoryData.Buddies
        cardsOnly = inventoryData.Cards
        // titlesOnly = inventoryData.Titles
        spraysOnly = inventoryData.Sprays
    

        async function fetchLoadout(loadoutFileName) {
            const response = await fetch(loadoutFileName);
            if (!response.ok) {
                throw new Error('Loadout file not found');
            }
            return await response.json();
        }



    } catch (error) {
        console.error('Error fetching and processing data:', error);
    }
    const arrow = document.querySelector('.sortDrop .Arrow'); 
    if (!arrow.hasAttribute('alt')) {
        arrow.setAttribute('alt', 'UP'); 
    } 

    updateSelectedFilter('Weapons');

    renderWeaponGrid(weaponsOnly);
    console.log(weaponsOnly)
    const slider = document.getElementById("colorSlider");
    if (slider) {
        slider.addEventListener("input", logSliderValue);
    }

    const fancySearch = document.querySelector('.search_input');
    const colorBar = document.getElementById('colorSlider')
    document.querySelector('[data-filter="Buddies"]').addEventListener('click', () => {
        console.log("working")
        renderBuddiesGrid(buddiesOnly); // Assuming buddyData is the array of buddies
        updateSelectedFilter('Buddies');
        changeDropDown('Buddies')
        sortByDirectionBuddies(arrow.alt);
        activeCategory = "Buddies";
        setupSearch(buddiesOnly);
        fancySearch.value = "";
        colorBar.style.visibility = 'visible';
    });
    document.querySelector('[data-filter="Weapons"]').addEventListener('click', () => {
        console.log("working")
        renderWeaponGrid(weaponsOnly); // Assuming buddyData is the array of buddies
        updateSelectedFilter('Weapons');
        updateSelectedFilterWeapons('all')
        changeDropDown('Weapons')
        activeCategory = "Weapons";
        // setupSearch(weaponsOnly);
        fancySearch.value = "";
        colorBar.style.visibility = 'hidden';

        
    });
    document.querySelector('[data-filter="Sprays"]').addEventListener('click', () => {
        console.log("clicked sprays")
        renderSprayGrid(spraysOnly); // Assuming buddyData is the array of buddies
        updateSelectedFilter('Sprays');
        changeDropDown('Sprays')
        sortByDirectionSprays(arrow.alt);
        activeCategory = "Sprays";
        setupSearch(spraysOnly);
        fancySearch.value = "";
        colorBar.style.visibility = 'hidden';


    });
    document.querySelector('[data-filter="Cards"]').addEventListener('click', () => {
        console.log("clicked cards")
        renderCardGrid(cardsOnly); // Assuming buddyData is the array of buddies
        updateSelectedFilter('Cards');
        changeDropDown('Cards')
        sortByDirectionCards(arrow.alt);
        activeCategory = "Cards";
        setupSearch(cardsOnly);
        fancySearch.value = "";
        colorBar.style.visibility = 'hidden';


    });
    
    setupSearch(weaponsOnly);
    setupFilter(weaponsOnly);
    console.log("content has been loaded")

    


    const dropDown = document.querySelector('.sortDrop #priceSort');
    const filterItems = document.querySelectorAll('.filterDrop .filterItem'); 
    console.log(dropDown.value)
    dropDown.addEventListener('change', function() {
        console.log("Dropdown value: " + dropDown.value);
        if (dropDown.value !== 'All' && dropDown.value === 'Price') {
            arrow.style.visibility = 'visible'; 
            console.log("changed value to" + dropDown.value)
            sortByDirection(arrow.alt)
        } else if (dropDown.value !== 'All' && dropDown.value === 'Alph') {
            arrow.style.visibility = 'visible'; 
            console.log("changed value to" + dropDown.value)
            sortByDirection(arrow.alt)
        } else if (dropDown.value !== 'All' && dropDown.value === 'Rarity') {
            arrow.style.visibility = 'visible'; 
            console.log("changed value to" + dropDown.value)
            sortByDirection(arrow.alt)
        } 
         else {
            renderWeaponGrid(weaponsOnly);
            arrow.style.visibility = 'hidden';
            updateSelectedFilterWeapons('all')
        }
    });
    
   

    arrow.addEventListener('click', () => {
        console.log("Clikcing Arrow")
        if (arrow.style.transform === "scaleY(-1)") {
            arrow.style.transform = "scaleY(1)";
            arrow.setAttribute('alt', 'UP');
        } else {
            arrow.style.transform = "scaleY(-1)";
            arrow.setAttribute('alt', 'DOWN');          
        }
        console.log(activeCategory)

        if (activeCategory === "Weapons") {
            sortByDirection(arrow.alt);
        } else if (activeCategory === "Buddies") {
            sortByDirectionBuddies(arrow.alt)
        }else if (activeCategory === "Sprays") {
            sortByDirectionSprays(arrow.alt);
        }else if(activeCategory === "Cards") {
            sortByDirectionCards(arrow.alt);
        }
    });

  
});


async function renderWeaponGrid(weaponsOnly) {
    console.log("render weapon grid called")
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';
    skinGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(16%, 1fr))";
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

            //Create skin name div
            const skinName = document.createElement('div');
            skinName.className = "skinName";
            skinName.innerHTML = w.Name;

            //Create skin price div
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
            weaponDiv.appendChild(skinPrice);
            weaponDiv.appendChild(skinImage);
            weaponDiv.appendChild(skinName);

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
    const filterMenu = document.querySelector('.filterDrop');
    filterMenu.style.visibility = 'visible';
    const costUSD = (totalCounter * 0.010505).toFixed(2);
    // totalCounterDiv.textContent = `${totalCounter} \t ≈ $${costUSD}`;
    // totalCounterDiv.textContent = "";
    const vpLogo = document.createElement('img')
    vpLogo.src = "img/vpimg.png";
    // totalCounterDiv.appendChild(vpLogo);
    console.log('Total Counter:', totalCounter);




}

// Function to log the min and max slider values
// Function to enforce range constraints and log values
function logSliderValue() {
    const buddyGrid = document.querySelector('.skinGrid');

    const colorSlider = document.getElementById("colorSlider");
    if (!colorSlider) return;

    const minRange = colorSlider.children[0];
    const maxRange = colorSlider.children[1];

    let minValue = parseInt(minRange.value);
    let maxValue = parseInt(maxRange.value);

    // Prevent min slider from exceeding max slider
    if (minValue > maxValue) {
        minRange.value = maxValue;
    }

    // Prevent max slider from going below min slider
    if (maxValue < minValue) {
        maxRange.value = minValue;
    }

    console.log("Min range value:", minRange.value);
    console.log("Max range value:", maxRange.value);

    const buddies = Array.from(buddyGrid.querySelectorAll('.buddy-container'));

    buddies.forEach(buddy => {
        const dominantColor = parseInt(buddy.dataset.dominantColor);
        
        if (dominantColor >= minValue && dominantColor <= maxValue) {
            buddy.style.display = "block"; // Show valid buddies
        } else {
            buddy.style.display = "none"; // Hide those outside the range
        }
    });
}


async function renderBuddiesGrid(buddiesOnly) {
    

    try {
        const response = await fetch("buddiestuff_updated.json");
        const buddiesData = await response.json();

        // Ensure we are accessing the correct part of the JSON structure
        const buddiesArray = buddiesData.data; 

        // Create a lookup map using uuid as the key
        const buddiesMap = new Map();
        buddiesArray.forEach(b => buddiesMap.set(b.uuid, b.dominantHue));

        const skinGrid = document.querySelector('.skinGrid');
        skinGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(12%, 1fr))";
        skinGrid.innerHTML = '';
        skinGrid.style.visibility = 'hidden';

        buddiesOnly.forEach(b => {
            const buddyDiv = document.createElement('div');
            buddyDiv.classList.add('buddy-container');

            // Match ItemID with the uuid from buddiesData
            const dominantHue = buddiesMap.get(b.ItemID) ?? "Unknown";

            // Store dominant hue as a data attribute
            buddyDiv.dataset.dominantColor = dominantHue;  

            const buddyName = document.createElement('div');
            buddyName.className = "buddyName";
            buddyName.innerHTML = b.Name;

            const buddyImage = document.createElement('img');
            buddyImage.src = b.ImageURL;

            const buddyColors = document.createElement('div');
            buddyColors.className = "DominantColors";
            // buddyColors.innerText = `Hue: ${dominantHue}`;

            buddyDiv.appendChild(buddyImage);
            buddyDiv.appendChild(buddyName);
            buddyDiv.appendChild(buddyColors);
            skinGrid.appendChild(buddyDiv);
        });

        skinGrid.style.visibility = 'visible';
        const filterMenu = document.querySelector('.filterDrop');
        filterMenu.style.visibility = 'hidden';
    } catch (error) {
        console.error("Error fetching buddies data:", error);
    }
    // const skinGrid = document.querySelector('.skinGrid');
    // // grid-template-columns: repeat(auto-fill, minmax(12%, 1fr));
    // skinGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(12%, 1fr))";
    // skinGrid.innerHTML = '';
    // skinGrid.style.visibility = 'hidden';

    // buddiesOnly.forEach(b => {
    //     const buddyDiv = document.createElement('div');
    //     buddyDiv.classList.add('buddy-container');
        
    //     // Store DominantColors as a data attribute
    //     buddyDiv.dataset.dominantColor = b["Dominant Colors"];;
    
    //     const buddyName = document.createElement('div');
    //     buddyName.className = "buddyName";
    //     buddyName.innerHTML = b.Name;
    
    //     const buddyImage = document.createElement('img');
    //     buddyImage.src = b.ImageURL;
    
    //     const buddyColors = document.createElement('div');
    //     buddyColors.className = "DominantColors";
    
    //     buddyDiv.appendChild(buddyImage);
    //     buddyDiv.appendChild(buddyName);
    //     buddyDiv.appendChild(buddyColors);
    //     skinGrid.appendChild(buddyDiv);
    // });

    // skinGrid.style.visibility = 'visible';
    // const filterMenu = document.querySelector('.filterDrop');
    // filterMenu.style.visibility = 'hidden';

    
}

async function renderSprayGrid(spraysOnly) {
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';
    skinGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(12%, 1fr))";
    skinGrid.style.visibility = 'hidden';
    
    spraysOnly.forEach(s => {
        // console.log(s)
        const sprayDiv = document.createElement('div');
        sprayDiv.classList.add('spray-container');

        const sprayImage = document.createElement('img');
        const sprayName = document.createElement('div');
        sprayName.className = "sprayName";
        sprayName.innerHTML = s.Name;
        sprayImage.src = s.displayIcon;
        sprayImage.setAttribute('full-display-img',  s.fullDisplayImg);

        sprayDiv.appendChild(sprayImage);
        sprayDiv.appendChild(sprayName);
        skinGrid.appendChild(sprayDiv);
    });

    skinGrid.style.visibility = 'visible';
    const filterMenu = document.querySelector('.filterDrop');
    filterMenu.style.visibility = 'hidden';
    colorMenu.style.visibility = 'hidden';
}


async function renderCardGrid(cardsOnly) {
    const skinGrid = document.querySelector('.skinGrid');
    skinGrid.innerHTML = '';
    skinGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(15%, 1fr))";
    skinGrid.style.visibility = 'hidden';

    cardsOnly.forEach(c => {
        // console.log(c)
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card-container');

        const cardSmallImg = document.createElement('img');
        const cardName = document.createElement('div');
        cardName.className = "cardName";
        cardName.innerHTML = c.Name;
        cardSmallImg.src = c.smallImageURL;
        // sprayImage.setAttribute('full-display-img',  s.fullDisplayImg);

        cardDiv.appendChild(cardSmallImg);
        cardDiv.appendChild(cardName);
        skinGrid.appendChild(cardDiv);
    });
    skinGrid.style.visibility = 'visible';
    const filterMenu = document.querySelector('.filterDrop');
    filterMenu.style.visibility = 'hidden';
    
}

// Set up the search functionality
function setupSearch(categoryOnly) {
    const skinGrid = document.querySelector('.skinGrid');
    const searchBar = document.getElementById('SearchInput');
    const fancySearch = document.querySelector('.search_input');

    // Remove any existing event listener
    fancySearch.removeEventListener('input', handleSearch);

    // Add a new event listener based on the current activeCategory
    function handleSearch(event) {
        const searchText = event.target.value.toLowerCase();
    
        if (activeCategory === "Weapons") {
            const filteredWeapons = categoryOnly.filter(w => {
                // Filter by subcategory (activeSubCategory)
                if (activeSubCategory && activeSubCategory !== 'All') {
                    const subcategoryWeapons = weaponType[activeSubCategory];
                    console.log(subcategoryWeapons)
                    if (!subcategoryWeapons || !subcategoryWeapons.includes(w.Weaponid)) {
                        return false; // Exclude weapons not in the subcategory
                    }
                }
    
                // Filter by search text
                return (
                    !w.Name.toLowerCase().includes('standard') &&
                    !w.Name.toLowerCase().includes('random') &&
                    w.Name.toLowerCase() !== 'melee' &&
                    w.Name.toLowerCase().includes(searchText)
                );
            });
    
            renderWeaponGrid(filteredWeapons);
        } else if (activeCategory === "Buddies") {
            const filteredBuddies = categoryOnly.filter(w =>
                w.Name.toLowerCase().includes(searchText)
            );
            renderBuddiesGrid(filteredBuddies);
        } else if (activeCategory === "Cards") {
            const filteredCards = categoryOnly.filter(w =>
                w.Name.toLowerCase().includes(searchText)
            );
            renderCardGrid(filteredCards);
        } else if (activeCategory === "Sprays") {
            const filteredSprays = categoryOnly.filter(w =>
                w.Name.toLowerCase().includes(searchText)
            );
            renderSprayGrid(filteredSprays);
        }
    }

    fancySearch.addEventListener('input', handleSearch);
}




function setupFilter(weaponsOnly) {
    const filterItems = document.querySelectorAll('.filterDrop .filterItem'); // Select all text items
    const line = document.createElement('div');
    line.className = "line";
    line.style.position = 'absolute';
    line.style.bottom = '0';
    line.style.left = '0';
    line.style.height = '2px';
    line.style.backgroundColor = '#bf3d3d';
    line.style.transition = 'left 0.3s ease, width 0.3s ease';
    document.querySelector('.filterDrop').appendChild(line);


    const defaultSelected = document.querySelector('.filterDrop .filterItem[data-filter="all"]');
    if (defaultSelected) {
        defaultSelected.classList.add('selected');
        const { left, width } = defaultSelected.getBoundingClientRect();
        const parentLeft = document.querySelector('.filterDrop').getBoundingClientRect().left;

        line.style.left = `${left - parentLeft}px`;
        line.style.width = `${width}px`;
    }
    filterItems.forEach(item => {
        item.addEventListener('click', (event) => {
            console.log(item.textContent);
            activeSubCategory = item.textContent;
            // Remove the 'selected' class from all items
            filterItems.forEach(i => i.classList.remove('selected'));

            // Add 'selected' class to the clicked item
            event.target.classList.add('selected');

            // Get the selected item
            const selectedItem = event.target;

            // Set the underline position and width dynamically based on the selected item
            const { left, width } = selectedItem.getBoundingClientRect();
            const parentLeft = document.querySelector('.filterDrop').getBoundingClientRect().left;

            line.style.left = `${left - parentLeft}px`; // Align to the selected item
            line.style.width = `${width}px`; // Match the width of the selected item

            const selected = event.target.dataset.filter;

            // Map filter item values to content tier UUIDs
            const weaponType = {
                Pistol: ['29a0cfab-485b-f5d5-779a-b59f85e204a8', '1baa85b4-4c70-1284-64bb-6481dfc3bb4e', '44d4e95c-4157-0037-81b2-17841bf2e8e3', '42da8ccc-40d5-affc-beec-15aa47b42eda', 'e336c6b8-418d-9340-d77f-7a9e4cfe0702'],
                Rifle: ['ee8e8d15-496b-07ac-e5f6-8fae5d4c7b1a', '9c82e19d-4575-0200-1a81-3eacf00cf872'],
                SMG: ['462080d1-4035-2937-7c09-27aa2a5c27a7', 'f7e1b454-4ad4-1063-ec0a-159e56b58941'],
                Shotgun: ['910be174-449b-c412-ab22-d0873436b21b','ec845bf4-4f79-ddda-a3da-0db3774b2794'],
                Sniper: ['c4883e50-4494-202c-3ec3-6b8a9284f00b', '5f0aaf7a-4289-3998-d5ff-eb9a5cf7ef5c', 'a03b24d3-4319-996d-0f8c-94bbfba1dfc7'],
                MachineGun: ['55d8a0f4-4274-ca67-fe2c-06ab45efdf58', '63e6c2b6-4a8e-869c-3d4c-e38355226584'],
                Melee: ['2f59173c-4bed-b6c3-2191-dea9b58be9c7'],
            };

            const filteredWeapons = weaponsOnly.filter(w => {
                const typeWeapon = w.Weaponid; // Ensure `Weaponid` is part of the data
                // Check if selected filter is "all" and return all weapons if true
                if (selected === 'all') return true;
                // If the selected category is "Pistol", check if the weapon ID is in the array of pistols
                if (selected === 'Pistol') {
                    return weaponType.Pistol.includes(typeWeapon);
                }
                // For other weapon types, compare the selected category with the weapon's type
                return weaponType[selected] && weaponType[selected].includes(typeWeapon);
            });

            renderWeaponGrid(filteredWeapons);
        });
    });
}











function sortByDirection(Direction) {
    const sortDrop = document.querySelector('.sortDrop #priceSort');
    const weaponGrid = document.querySelector('.skinGrid');
    // Function to sort the grid
    const sortGrid = (order) => {
        const weapons = Array.from(weaponGrid.querySelectorAll('.weapon-skin'));

        const sortedWeapons = weapons.sort((a, b) => {
            const priceA = parseInt(a.querySelector('.skinPrice').textContent.trim().replace(/\D/g, '')) || 0;
            const priceB = parseInt(b.querySelector('.skinPrice').textContent.trim().replace(/\D/g, '')) || 0;

            if (order === 'asc') {
                return priceA - priceB; // Ascending
            } else if (order === 'desc') {
                return priceB - priceA; // Descending
            }
            return 0; // No sorting
        });

        // Clear the grid and re-append sorted elements
        weaponGrid.innerHTML = '';
        sortedWeapons.forEach(skin => weaponGrid.appendChild(skin));
    };

    const sortGridAlph = (order) => {
        const weapons = Array.from(weaponGrid.querySelectorAll('.weapon-skin'));
    
        const sortedWeapons = weapons.sort((a, b) => {
            // Assuming the weapon name is in an element with class '.skinName'
            const nameA = a.querySelector('.skinName').textContent.trim().toLowerCase();
            const nameB = b.querySelector('.skinName').textContent.trim().toLowerCase();
    
            // Compare alphabetically
            if (order === 'asc') {
                return nameA.localeCompare(nameB); // Ascending alphabetical order
            } else if (order === 'desc') {
                return nameB.localeCompare(nameA); // Descending alphabetical order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        weaponGrid.innerHTML = '';
        sortedWeapons.forEach(skin => weaponGrid.appendChild(skin));
    };


    const tierRanking = {
        'e046854e-406c-37f4-6607-19a9ba8426fc': 1, 
        '411e4a55-4e59-7757-41f0-86a53f101bb5': 2,
        '60bca009-4182-7998-dee7-b8a2558dc369': 3,
        '0cebb8be-46d7-c12a-d306-e9907bfc5a25': 4,
        '12683d76-48d7-84a3-4e09-6985794f0445': 5  
    };


    const sortGridRarity = (order) => {
        const weapons = Array.from(weaponGrid.querySelectorAll('.weapon-skin'));
    
        const sortedWeapons = weapons.sort((a, b) => {
            const contentTierA = a.getAttribute('data-contenttier').trim();
            const contentTierB = b.getAttribute('data-contenttier').trim();
    
            // Get the rarity rank for each tier
            const rankA = tierRanking[contentTierA] || Infinity; // Default to Infinity if not found
            const rankB = tierRanking[contentTierB] || Infinity; // Default to Infinity if not found
    
            // Sort based on the rank of the tiers
            if (order === 'asc') {
                return rankA - rankB; // Ascending order
            } else if (order === 'desc') {
                return rankB - rankA; // Descending order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        weaponGrid.innerHTML = '';
        sortedWeapons.forEach(skin => weaponGrid.appendChild(skin));
    };

    const selectedValue = sortDrop.value;
    console.log("we get here")
    console.log(selectedValue)
    if (selectedValue === "Price") {
        if (Direction === "UP") {
            sortGrid('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGrid('desc');
        }
    } else if (selectedValue === "Alph") {
        if (Direction === "UP") {
            sortGridAlph('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridAlph('desc');
        }
    } else if (selectedValue === "Rarity") {
        if (Direction === "UP") {
            sortGridRarity('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridRarity('desc');
        }
    }

}

function sortByDirectionBuddies(Direction) {
    const sortDrop = document.querySelector('.sortDrop #priceSort');

    const buddyGrid = document.querySelector('.skinGrid');
    const sortGridAlph = (order) => {
        const buddies = Array.from(buddyGrid.querySelectorAll('.buddy-container'));
    
        const sortedBuddies = buddies.sort((a, b) => {
            // Assuming the weapon name is in an element with class '.skinName'
            const nameA = a.querySelector('.buddyName').textContent.trim().toLowerCase();
            const nameB = b.querySelector('.buddyName').textContent.trim().toLowerCase();
    
            // Compare alphabetically
            if (order === 'asc') {
                return nameA.localeCompare(nameB); // Ascending alphabetical order
            } else if (order === 'desc') {
                return nameB.localeCompare(nameA); // Descending alphabetical order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        buddyGrid.innerHTML = '';
        sortedBuddies.forEach(buddy => buddyGrid.appendChild(buddy));
    };

    const sortGridHue = (order) => {
        const buddies = Array.from(buddyGrid.querySelectorAll('.buddy-container'));
    
        const sortedBuddies = buddies.sort((a, b) => {
            const HueA = a.getAttribute('data-dominant-color').trim();
            const HueB = b.getAttribute('data-dominant-color').trim();
    
            
    
            // Sort based on the rank of the tiers
            if (order === 'asc') {
                return HueA - HueB; // Ascending order
            } else if (order === 'desc') {
                return HueB - HueA; // Descending order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        buddyGrid.innerHTML = '';
        sortedBuddies.forEach(buddy => buddyGrid.appendChild(buddy));
    };


    const selectedValue = sortDrop.value;

    console.log(selectedValue)
    if (selectedValue === "Alph") {
        if (Direction === "UP") {
            sortGridHue('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridHue('desc');
        }
    }else if (selectedValue === "Color") {
        if (Direction === "UP") {
            sortGridHue('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridHue('desc');
        }
    }

}
function sortByDirectionSprays(Direction) {
    const sortDrop = document.querySelector('.sortDrop #priceSort');

    const sprayGrid = document.querySelector('.skinGrid');
    const sortGridAlph = (order) => {
        const sprays = Array.from(sprayGrid.querySelectorAll('.spray-container'));
    
        const sortedSprays = sprays.sort((a, b) => {
            // Assuming the weapon name is in an element with class '.skinName'
            const nameA = a.querySelector('.sprayName').textContent.trim().toLowerCase();
            const nameB = b.querySelector('.sprayName').textContent.trim().toLowerCase();
    
            // Compare alphabetically
            if (order === 'asc') {
                return nameA.localeCompare(nameB); // Ascending alphabetical order
            } else if (order === 'desc') {
                return nameB.localeCompare(nameA); // Descending alphabetical order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        sprayGrid.innerHTML = '';
        sortedSprays.forEach(spray => sprayGrid.appendChild(spray));
    };
    const selectedValue = sortDrop.value;

    console.log(selectedValue)
    if (selectedValue === "Alph") {
        if (Direction === "UP") {
            sortGridAlph('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridAlph('desc');
        }
    } 
}
function sortByDirectionCards(Direction) {
    const sortDrop = document.querySelector('.sortDrop #priceSort');

    const cardGrid = document.querySelector('.skinGrid');
    const sortGridAlph = (order) => {
        const cards = Array.from(cardGrid.querySelectorAll('.card-container'));
    
        const sortedCards = cards.sort((a, b) => {
            // Assuming the weapon name is in an element with class '.skinName'
            const nameA = a.querySelector('.cardName').textContent.trim().toLowerCase();
            const nameB = b.querySelector('.cardName').textContent.trim().toLowerCase();
    
            // Compare alphabetically
            if (order === 'asc') {
                return nameA.localeCompare(nameB); // Ascending alphabetical order
            } else if (order === 'desc') {
                return nameB.localeCompare(nameA); // Descending alphabetical order
            }
            return 0; // No sorting
        });
    
        // Clear the grid and re-append sorted elements
        cardGrid.innerHTML = '';
        sortedCards.forEach(card => cardGrid.appendChild(card));
    };
    const selectedValue = sortDrop.value;

    console.log(selectedValue)
     if (selectedValue === "Alph") {
        if (Direction === "UP") {
            sortGridAlph('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridAlph('desc');
        }
    } else if (selectedValue === "Rarity") {
        if (Direction === "UP") {
            sortGridRarity('asc');
            console.log("sorting in asc order")
        }else if (Direction === "DOWN") {
            sortGridRarity('desc');
        }
    }
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

function updateSelectedFilter(selectedFilter) {
    const line = document.querySelector('.line');
    if (line) {
        line.remove();
    }
    const menuItems = document.querySelectorAll('.menuItem'); // Ensure this matches your HTML

    menuItems.forEach(item => {
        if (item.getAttribute('data-filter') === selectedFilter) {
            item.classList.add('selected'); // Add the 'selected' class to the clicked item
        } else {
            item.classList.remove('selected'); // Remove 'selected' class from others
        }
    });
    
}


function updateSelectedFilterWeapons(selectedFilter) {
    const filterItems = document.querySelectorAll('.filterItem');
    console.log(selectedFilter)
    // Remove 'selected' class from all items to reset
    filterItems.forEach(item => {
        item.classList.remove('selected');
    });

    // Set the selected filter's class
    filterItems.forEach(item => {
        console.log(item)
        if (item.getAttribute('data-filter') === selectedFilter) {
            item.classList.add('selected');
        }
    });
}

function changeDropDown(category) {
    const dropDown = document.querySelector('.sortDrop #priceSort');
    const arrow = document.querySelector('.sortDrop .Arrow'); 
    if (category === "Buddies" || category === "Sprays" || category === "Cards") {
        console.log(dropDown);

        // Iterate through all the options and disable or hide them
        Array.from(dropDown.options).forEach(option => {
            if (option.value !== "Alph") {
                option.style.display = "none"; // Hide the option
            } else {
                option.style.display = "block"; // Ensure "Alph" is visible
                option.selected = true;       // Set "Alph" as the selected option
                arrow.style.visibility = "visible";
            }
        });
    } else if (category === "Weapons") {
        // Reset the dropdown to its original state (default at "All")
        Array.from(dropDown.options).forEach(option => {
            option.style.display = "block"; // Make all options visible
        });
        dropDown.value = "All"; // Default the dropdown to "All"
        arrow.style.visibility = "hidden"; // Hide the arrow
    
    }
    else {
        // Reset all options to be available if the category is not "Buddies"
        Array.from(dropDown.options).forEach(option => {
            option.style.display = "block";
        });
    }
}






