//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////

    // //////////////////////////////////////////
    // //END ELEMENTS TO ATTACH EVENT LISTENERS
    // //////////////////////////////////////////


    // //////////////////////////////////////////
    // //EVENT LISTENERS
    // //////////////////////////////////////////

    window.onload = function() {
        const loadingScreen = document.getElementById("loadingScreen");
        const content = document.getElementById("content");
    
        // Show the content immediately
        content.style.display = "block";
    
        // Show the loading screen initally
        loadingScreen.style.display = "flex";
        loadingScreen.style.opacity = 1;
    
        // Simulate loading process by showing loading screen for 2 seconds
        setTimeout(function() {
            loadingScreen.style.transition = "opacity 1s ease-out";
            loadingScreen.style.opacity = 0;
    
            // After fading out, hides the loading screen
            setTimeout(function() {
                loadingScreen.style.display = "none";
            }, 1000);
        }, 2000);
        // a bit of a delay
    };

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

    };

    // calendar things
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        fixedWeekCount: false,
        height: 500,
        events: [],
        eventContent: function(arg) {
            return { html: '<span style="font-size: 1.2em;">🔥</span>' };
        }
    });
    fetchUserMedDays().then(days => {
        const events = days.map(date => ({
            title: '', // or "Meditated"
            start: date,
            allDay: true
        }));
        calendar.addEventSource(events);
    });
    calendar.render();

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
            
            let weeklyStatsMessage = '';
            if (data.totalMinutes === 1) {
                // Grammar: 1 *minute*
                weeklyStatsMessage = `<br>You have meditated for <strong>${data.totalMinutes} minute</strong> this week. Keep going! 💜`;
            } else if (data.totalMinutes > 1) {
                weeklyStatsMessage = `<br>You have meditated for <strong>${data.totalMinutes} minutes</strong> this week. Keep going! 💜`;
            } else if (data.totalMinutes === 0) {
                weeklyStatsMessage = `<br>You haven't meditated yet this week. Let's start today! 🧘‍♂️`;
            }
    
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

    async function fetchUserMedDays() { //
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch ('/api/med-days', {
                method: 'GET',
                headers: {
                    'Authorization': token
                }
            });
            const data = await response.json();
            return data.dates;
        } catch (error) {
            console.error('Error fetching calendar data! ', error)
            return [];
        }
    }

    // MESSAGE BOX TEST //
    const modal = document.getElementById("myModal");
    const openModalBtn = document.getElementById("openModal");
    const cancelBtn = document.getElementById("cancelBtn");
    
    openModalBtn.addEventListener("click", () => {
        localStorage.setItem('meditationDuration', 60); // override to default 60-second session
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