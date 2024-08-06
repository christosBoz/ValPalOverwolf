userid = ""
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

        userInventory = localStorage.getItem(`${userid}_inventory`);
        console.log("", userInventory);

        if (userInventory === null) {
            console.log("hello");
            try {
                const refreshResponse = await fetch('http://127.0.0.1:5000/refresh_inventory');
                const refreshData = await refreshResponse.text();
                localStorage.setItem(`${userid}_inventory`, refreshData);
                console.log("penis");
            } catch (error) {
                console.error('Error refreshing inventory:', error);
            }
        }

        // Navigate to index.html after all operations are complete
        window.location.assign("index.html");

    } catch (e) {
        console.error("bad", e);
    }
});