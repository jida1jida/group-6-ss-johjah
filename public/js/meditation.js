document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    // ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
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
    // EVENT LISTENERS
    //////////////////////////////////////////
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
    });

    homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu.html'; 
    });

    // Timer event listeners
    startStopBtn.addEventListener("click", startStopTimer);
    resetBtn.addEventListener("click", resetTimer);

    //////////////////////////////////////////
    // TIMER FUNCTIONS
    //////////////////////////////////////////
    function updateDisplay() {
        let seconds = Math.ceil(timeLeft); // Ensure it shows whole seconds
        timerDisplay.textContent = `${seconds}s`;
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
        let elapsedTimeInSeconds = (now - startTime) / 1000;  // Time passed in seconds
    
        // Calculate remaining time based on elapsed time and elapsedTime (paused time)
        timeLeft = Math.max(0, 60 - elapsedTimeInSeconds - elapsedTime);
    
        updateDisplay();
        updateCircle();
    
        // Continue animation as long as timeLeft is more than 0
        if (timeLeft > 0) {
            requestAnimationFrame(animateTimer);
        } else {
            // stopTimer(); I don't this does anything????? --jake
            handleMeditationComplete(elapsedTimeInSeconds, "Breathing Exercise")  // type is hardcoded for now -jake
        }
    }

    function startStopTimer() {
        if (running) {
            // Stop the timer and save elapsed time
            clearInterval(timer);
            clearInterval(breathInterval);
            breathInterval = null;
            elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Store elapsed time when stopped
            running = false;
            startStopBtn.textContent = "Start Timer";

            // Stop the circular progress animation immediately
            progressCircle.style.transition = "none";  // Disable transition
            progressCircle.style.strokeDashoffset = progressCircle.style.strokeDashoffset; // Freeze animation
        } else {
            if (!startTime) {
                // First time starting, initialize startTime and set elapsedTime to 0
                startTime = Date.now();  // Set startTime to current time
                elapsedTime = 0;  // Reset elapsed time to 0
            } else {
                // If the timer was paused, adjust the startTime to resume from the correct point
                startTime = Date.now() - (60 - timeLeft - elapsedTime) * 1000; // Resume based on elapsed time
            }

            // Re-enable smooth animation when resuming
            progressCircle.style.transition = "stroke-dashoffset 1s linear";

            startBreathingCycle();  // Start the breathing cycle
            requestAnimationFrame(animateTimer);  // Start the timer animation

            running = true;
            startStopBtn.textContent = "Stop Timer";
        }
    }

    function resetTimer() {
        clearInterval(timer);
        clearInterval(breathInterval);
        breathInterval = null;
    
        timeLeft = 60;
        elapsedTime = 0; // Reset elapsed time
        startTime = null;
        running = false;
    
        updateDisplay();
        updateCircle();
    
        breathText.textContent = "Breathe In";
        breathText.style.opacity = 1;
    
        startStopBtn.textContent = "Start Timer";
    }

//////////////////////////////////////////
    // LOGGING FUNCTIONS
    //////////////////////////////////////////

    async function logMeditationSession(duration, type) {
        const token = localStorage.getItem('jwtToken');
        
        try {
            const response = await fetch('/api/med-session', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ duration, type }),
            });
    
            if (!response.ok) {
                throw new Error("Failed to log session.");
            }
    
            console.log("Meditation session logged!");
        } catch (error) {
            console.error("Error logging session: ", error);
        }
    }

    function handleMeditationComplete(duration, type) {
        logMeditationSession(duration, type);
    }

    // Initialize Display
    updateDisplay();
    updateCircle();
});
