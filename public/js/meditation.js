document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    // ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const homeButton = document.getElementById('homeButton');

    // Timer elements
    const timerDisplay = document.getElementById("timer");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");

    const progressCircle = document.getElementById("progressCircle");
    const breathText = document.getElementById("breathText");

    // Timer variables
    let timer;
    let timeLeft = 60;
    let running = false;
    let startTime = null;
    let breathInterval = null;

    //////////////////////////////////////////
    // END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    // EVENT LISTENERS
    //////////////////////////////////////////
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
    });

    // Redirect to the homepage when the Home button is clicked
    homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu.html'; 
    });

    // Timer event listeners
    startStopBtn.addEventListener("click", startStopTimer);
    resetBtn.addEventListener("click", resetTimer);

    //////////////////////////////////////////
    // END EVENT LISTENERS
    //////////////////////////////////////////


    ///////////////////////////////////////////////////////
    // CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    ///////////////////////////////////////////////////////
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    } else {
        DataModel.setToken(token);
        renderUserList();
    }

    updateDisplay();
    updateCircle();

    //////////////////////////////////////////
    // END CODE THAT NEEDS TO RUN IMMEDIATELY
    //////////////////////////////////////////


    //////////////////////////////////////////
    // TIMER FUNCTIONS
    //////////////////////////////////////////
    function updateDisplay() {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateCircle() {
        const progress = timeLeft / 60; 
        progressCircle.style.strokeDashoffset = 377 * progress; 
    }

    function startBreathingCycle() {
        if (breathInterval) return; 

        let inhale = true;
        breathText.textContent = "Breathe In";
        breathText.style.opacity = 1;

        breathInterval = setInterval(() => {
            inhale = !inhale;
            breathText.style.opacity = 0; // Fade out

            setTimeout(() => {
                breathText.textContent = inhale ? "Breathe In" : "Breathe Out";
                breathText.style.opacity = 1; // Fade in
            }, 1000);
        }, 4000); // Every 4 seconds, switch between inhale and exhale
    }

    function animateTimer() {
        if (!running) return; 

        let now = Date.now();
        timeLeft = Math.max(0, 60 - (now - startTime) / 1000);

        updateDisplay();
        updateCircle();

        if (timeLeft > 0) {
            requestAnimationFrame(animateTimer); 
        } else {
            stopTimer();
        }
    }

    function startStopTimer() {
        if (running) {
            clearInterval(timer);
            clearInterval(breathInterval);
            breathInterval = null;
            running = false;
            startStopBtn.textContent = "Start Timer";
        } else {
            if (!startTime) {
                startTime = Date.now() - (60 - timeLeft) * 1000;
            }

            startBreathingCycle();
            requestAnimationFrame(animateTimer); 

            running = true;
            startStopBtn.textContent = "Stop Timer";
        }
    }

    function resetTimer() {
        clearInterval(timer);
        clearInterval(breathInterval);
        breathInterval = null;

        timeLeft = 60;
        startTime = null;
        running = false;

        updateDisplay();
        updateCircle();

        breathText.textContent = "Breathe In";
        breathText.style.opacity = 1;

        startStopBtn.textContent = "Start Timer";
    }
    
    //////////////////////////////////////////
    // END TIMER FUNCTIONS
    //////////////////////////////////////////

});

//////////////////////////////////////////
// FUNCTIONS TO MANIPULATE THE DOM
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
// END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////
