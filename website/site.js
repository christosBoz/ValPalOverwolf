// scripts.js

let currentSection = 0;  // To track the current section index
const sections = document.querySelectorAll('.section');
const totalSections = sections.length;

let isScrolling = false;  // Flag to track if scrolling is in progress

function goToSection(index) {
    if (index >= 0 && index < totalSections) {
        // Scroll to the target section smoothly
        const targetSection = sections[index];
        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }
}

// Throttle scroll events to prevent multiple triggers
window.addEventListener('wheel', (event) => {
    // If scrolling is already in progress, ignore further scroll events
    if (isScrolling) return;

    // Set the scrolling flag to true, so no further scroll events are processed
    isScrolling = true;

    // Prevent default scroll behavior
    event.preventDefault();

    // Handle the scroll direction
    if (event.deltaY > 0) {
        // Scrolling down, move to the next section
        currentSection++;
        if (currentSection >= totalSections) {
            currentSection = totalSections - 1;  // Prevent going beyond the last section
        }
    } else {
        // Scrolling up, move to the previous section
        currentSection--;
        if (currentSection < 0) {
            currentSection = 0;  // Prevent going before the first section
        }
    }

    // Move to the section based on the updated index
    goToSection(currentSection);

    // After the scroll has finished (wait for the scroll transition), reset the flag
    setTimeout(() => {
        isScrolling = false;
    }, 1000);  // Adjust timeout duration (in ms) to match the scroll transition duration
}, { passive: false });
