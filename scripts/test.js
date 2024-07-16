userid = "4345dee3-676f-5305-a414-c0d6828730bb";
const inventoryJSON = localStorage.getItem(`${userid}_inventory`);
const inventoryData = JSON.parse(inventoryJSON);
console.log(inventoryData);

// Define the target weapon ID to search for
const targetWeaponId = "1BAA85B4-4C70-1284-64BB-6481DFC3BB4E";

// Get the skinGrid div where the new divs will be added
// Get the skinGrid div where the new divs will be added
const skinGrid = document.querySelector('.skinGrid');

// Filter weapons to find matching IDs

const matchingWeapons = inventoryData.Weapons.filter(weapon => weapon.Weaponid === targetWeaponId);

// Loop through matching weapons and create divs
matchingWeapons.forEach(weapon => {
  const weaponChromas = weapon.Chromas;

  // Check if there are chromas available
  if (weaponChromas && weaponChromas.length > 0) {
    const firstDisplayIcon = weaponChromas[0].displayIcon;

    // Create a new div for each weapon skin
    const weaponDiv = document.createElement('div');
    weaponDiv.classList.add('weapon-skin'); // Add a class for styling if needed

    // Create an img element for the skin
    const skinImage = document.createElement('img');
    skinImage.src = firstDisplayIcon; // Set the src to the first displayIcon
    skinImage.alt = weapon.Name; // Optionally set alt text

    // Append the image to the weapon div
    weaponDiv.appendChild(skinImage);

    // Append the weapon div to the skinGrid
    skinGrid.appendChild(weaponDiv);
  }
});