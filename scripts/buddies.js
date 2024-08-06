document.addEventListener('DOMContentLoaded', async() => {
    let chooseButton;
    let buddyImg;
    try {
        // Fetch user ID and agents data in parallel
        const [useridResponse] = await Promise.all([
            fetch('http://127.0.0.1:5000/get-userid'),
        ]);

        if (!useridResponse.ok) {
            throw new Error('Network response was not ok');
        }
        
        // Get user ID from response
        const userid = await useridResponse.text();
        const skinGrid = document.querySelector('.skinGrid');
        const buddyPreview = document.querySelector('.buddyPreview');
        buddyImg = buddyPreview.querySelector('.clickForBuddy');
        chooseButton = document.querySelector('.chooseButton');
        // Fetch inventory data from localStorage
        const inventory = localStorage.getItem(`${userid}_inventory`);
        
        // Parse the JSON data
        const inventoryData = JSON.parse(inventory);
     
        // Extract buddies data
        const buddiesOnly = inventoryData.Buddies;
        console.log(buddiesOnly);

        // Event listener for the buddies button
        buddyPreview.addEventListener('click', () => {
            // Clear the current skinGrid content
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
                });

                buddyDiv.appendChild(buddyImage);
                skinGrid.appendChild(buddyDiv);
            });    
        });

        // Event listener for the choose button
        // chooseButton.addEventListener('click', () => {
        //     const weaponDiv = document.querySelector('.invItem.weapon');
        //     const buddyImageInWeapon = weaponDiv.querySelector('.buddyimage');
        //     buddyImageInWeapon.src = buddyPreviewImage.src;
        // });

    } catch (e) {
        console.error("bad", e);
    }

    let selectedBuddyImageSrc = ''; // Variable to store the buddy image URL
    let selectedWeaponItem = null; // Variable to store the weapon name

    // Get all weapon items
    const weaponItems = document.querySelectorAll('.invItem.weapon');
    

    // Get the buddyPreview image element
    const buddyPreviewImage = document.querySelector('.buddyPreview .clickForBuddy');
    
    weaponItems.forEach(item => {
        item.addEventListener('click', () => {
            selectedWeaponItem = item;
            console.log(selectedWeaponItem)
            console.log(buddyPreviewImage);
            // Find the buddy image within the clicked item
            const buddyImage = item.querySelector('.buddyimage');
            
            if (buddyImage) {
                // Update the variable with the buddy image URL
                selectedBuddyImageSrc = buddyImage.src;
                console.log('Selected Buddy Image URL:', selectedBuddyImageSrc);
                
                // Update the src attribute of the buddyPreview image
                if (buddyPreviewImage) {
                    buddyPreviewImage.src = selectedBuddyImageSrc;
                    console.log(buddyPreviewImage.src)
                }
            }
        });
    });
    

      // Event listener for the choose button
      chooseButton.addEventListener('click', () => {
        if (selectedWeaponItem) {
            
            const buddyImageInWeapon = selectedWeaponItem.querySelector('.buddyimage');
            
            if (buddyImageInWeapon) {
                buddyImageInWeapon.src = buddyImg.src;
                console.log(buddyImg.src)
            }
        }
    });
});


