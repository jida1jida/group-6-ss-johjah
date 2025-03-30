//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const meditationButton = document.getElementById('meditationButton');
    const meditationCustomizeButton = document.getElementById('meditationCustomizeButton');
    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////

    // Dropdown menu
    function toggleDropdown() {
        var menu = document.getElementById("dropdown-menu");
        menu.classList.toggle("show");
    }
    
    window.onclick = function(event) {
        if (!event.target.matches('.dropdown-button')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains("show")) {
                    openDropdown.classList.remove("show");
                }
            }
        }
    }

    const dropdownButton = document.querySelector(".dropdown-button");
    dropdownButton.addEventListener("click", toggleDropdown)


    // Log out and redirect to login
    if (logoutButton) { // Check if the button exists
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            window.location.href = './logon'; // Redirect to login page
        });
    }

    // Redirect to the meditation page when the Meditation button is clicked
    meditationButton.addEventListener('click', () => {
        window.location.href = '/meditation'; // Adjust the path if necessar
    });

    accountButton.addEventListener('click', () => {
        window.location.href = '/account';
    });

    meditationCustomizeButton.addEventListener('click', () => {
        window.location.href = '/customize';
    });
    //////////////////////////////////////////
    //END EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////////////////
    //CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////////////////
    // Initial check for the token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    } else {
        DataModel.setToken(token);
        getUserName();
        fetchAIQuote(); // Fetch the AI-generated quote when the page loads
        resetStreakIfNeeded().then(() => { // resets streak to 0 if needed, then...
            console.log('Reset check done, now fetching streak');
            fetchUserStreak(); // display streak info on main menu
            fetchWeeklyMeditation(); // display weekly meditation stats
        })

    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////

//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////

    async function getUserName(){
        const token = localStorage.getItem('jwtToken');

        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const data = await response.json();
            
            const email = JSON.parse(atob(token.split('.')[1])).email; // Decode JWT token
            const user = data.users.find(u => u.email === email);

            if (user && user.prefname) {
                welcomeMessage.textContent = `Welcome, ${user.prefname}!`;
            } else {
                welcomeMessage.textContent = "Welcome!"; // if no prefname, generic message will display
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            welcomeMessage.textContent = "Welcome!"; // if error when fetching prefname, generic message will display
        }
    }

    async function fetchAIQuote() {
        const quoteContainer = document.getElementById('quoteContainer');

        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDW692uBKbYpliX9sYUXgCGZ0ELFfrPkhM', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text:  "Generate a fresh, unique, and inspiring meditation quote. Each quote should be different from the previous ones." }] }]
                })
            });

            const data = await response.json();
            const quote = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Stay mindful and present.";
            quoteContainer.textContent = `"${quote}"`;
        } catch (error) {
            console.error("Error fetching AI quote:", error);
            quoteContainer.textContent = "Error generating quote.";
        }
    }

    async function fetchUserStreak() {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch('/api/streak', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('User streak:', data.streak);
    
            const streakMessage = document.getElementById('streakMessage');
    
            // Save the existing weekly stats if present
            const existingWeeklyStats = streakMessage.querySelector('.weekly-stats')?.outerHTML || '';
    
            let streakText = '';
            if (data.streak === 1) {
                streakText = `Your current meditation streak is ${data.streak} day! 🔥<br><br>You last meditated on ${new Date(data.lastSessionDate).toLocaleDateString()}`;
            } else if (data.streak > 1) {
                streakText = `Your current meditation streak is ${data.streak} days! 🔥<br><br>You last meditated on ${new Date(data.lastSessionDate).toLocaleDateString()}`;
            } else if (data.streak === 0 && data.lastSessionDate) {
                streakText = `You do not currently have a streak!<br><br>You last meditated on ${new Date(data.lastSessionDate).toLocaleDateString()}`;
            } else {
                streakText = `You do not currently have a streak!<br><br>You have never meditated. 😭`;
            }
    
            // Preserve weekly stats
            streakMessage.innerHTML = streakText + existingWeeklyStats;
    
        } catch (error) {
            console.error('Error fetching streak:', error);
        }
    }

    async function resetStreakIfNeeded() {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch ('/api/reset-streak-if-needed', {
                method: 'POST',
                headers: {
                    'Authorization': token
                }
            });

            const data = await response.json();
            console.log(data.message);
            fetchUserStreak(); // refreshes streak message, in case streak was reset
        } catch (error) {
            console.error('Error resetting streak: ', error);
        }
    }

    async function fetchWeeklyMeditation() {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch('/api/weekly-med-stats', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log('Weekly meditation minutes:', data.totalMinutes);
    
            const streakMessage = document.getElementById('streakMessage');
            if (!streakMessage) {
                console.error('streakMessage div not found.');
                return;
            }
    
            let weeklyStatsMessage = data.totalMinutes > 0 
                ? `<br>You have meditated for <strong>${data.totalMinutes} minutes</strong> this week. Keep going! 🌿`
                : `<br>You haven't meditated yet this week. Let's start today! 🧘‍♂️`;
    
            // Ensure previous weekly stats are removed before appending a new one
            let existingStats = streakMessage.querySelector('.weekly-stats');
            if (existingStats) {
                existingStats.remove();
            }
    
            // Append weekly stats
            streakMessage.innerHTML += `<br><div class="weekly-stats">${weeklyStatsMessage}</div>`;
    
        } catch (error) {
            console.error('Error fetching weekly meditation minutes:', error);
        }
    }

    // MESSAGE BOX TEST //
    const modal = document.getElementById("myModal");
    const openModalBtn = document.getElementById("openModal");
    const cancelBtn = document.getElementById("cancelBtn");
    
    openModalBtn.addEventListener("click", () => {
        modal.style.display = "block";
    });
    
    cancelButton.addEventListener("click", () => {
        modal.style.display = "none";
    });
    
    
    // Close if clicking outside modal
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

//////////////////////////////////////////
// END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////
})