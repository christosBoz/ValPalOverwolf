document.addEventListener('DOMContentLoaded', () => {
    const activateButton = document.getElementById('activate-button');
    const activationStatusPre = document.getElementById('activation-status');

    activateButton.addEventListener('click', async () => {
        try {
            // Read the lockfile content
            const lockfileContent = await new Promise((resolve, reject) => {
                overwolf.io.readTextFile(this.lockfilePath, { encoding: 'utf8' }, (result) => {
                    if (result.success) {
                        resolve(result.content);
                    } else {
                        reject(new Error('Failed to read lockfile: ' + result.error));
                    }
                });
            });

            // Send the lockfile content to the Python server
            const response = await fetch('http://localhost:5000/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lockfileContent }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            activationStatusPre.textContent = `Success: ${JSON.stringify(result, null, 2)}`;
        } catch (error) {
            activationStatusPre.textContent = `Error: ${error.message}`;
        }
    });
});
