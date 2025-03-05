
//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const homeButton = document.getElementById('homeButton');

    // timer buttons
    const timerDisplay = document.getElementById("timer");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");

    // timer variables
    let timer;
    let timeLeft = 60;
    let running = false;

    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
    });

    // // Refresh list when the button is clicked
    // refreshButton.addEventListener('click', async () => {
    //     renderUserList();
    // });

    // Redirect to the homepage when the Home button is clicked
    homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu.html'; // Redirect to the homepage
    });

    // timer buttons
    startStopBtn.addEventListener("click", startStopTimer);
    resetBtn.addEventListener("click", resetTimer);

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
        renderUserList();
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////

    // timer functions
    function updateDisplay() {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function startStopTimer() {
        if (running) {
            clearInterval(timer);
            running = false;
            startStopBtn.textContent = "Start Timer";
        } else {
            timer = setInterval(() => {
                if (timeLeft > 0) {
                    timeLeft--;
                    updateDisplay();
                } else {
                    clearInterval(timer);
                    running = false;
                    startStopBtn.textContent = "Start Timer";
                }
            }, 1000);
            running = true;
            startStopBtn.textContent = "Stop Timer";
        }
    }

    function resetTimer() {
        clearInterval(timer);  // Stop the timer
        timeLeft = 60;  // Reset to 1 minute
        running = false;  // Ensure it's stopped
        updateDisplay();  // Update the UI
        startStopBtn.textContent = "Start Timer";  // Reset button text
    }

    updateDisplay();
    // end timer functions

});
//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////
async function renderUserList() {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '<div class="loading-message">Loading user list...</div>';
    const users = await DataModel.getUsers(); 
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        userItem.textContent = user;
        userListElement.appendChild(userItem);
    });
}
//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////