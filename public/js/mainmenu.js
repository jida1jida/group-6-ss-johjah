// this is just a duplicate of dashboard.js for now, with a few things commented out! -jake
// you can access this page at localhost:3000/mainmenu until we implement navigation

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
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = './logon';
    });

    // // Refresh list when the button is clicked
    // refreshButton.addEventListener('click', async () => {
    //     renderUserList();
    // });

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

    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
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

//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////