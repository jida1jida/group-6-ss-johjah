document.addEventListener('DOMContentLoaded', () => {
   
    //////////////////////////////////////////
    // ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const meditationButton = document.getElementById('meditationButton');

    // TIMER ELEMENTS
    const timerDisplay = document.getElementById("timer");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");
    const progressCircle = document.getElementById("progressCircle");
    const breathText = document.getElementById("breathText");


    // TIMER VARIABLES
    let userTimer = 60; // This allows the user to change how long they want to meditate

    let timer;
    let timeLeft = userTimer;
    let running = false;
    let startTime = null;
    let breathInterval = null;

    //////////////////////////////////////////
    // EVENT LISTENERS
    //////////////////////////////////////////
    if (meditationButton) {
        meditationButton.addEventListener('click', () => {
            window.location.href = '/meditation';
        });
    }

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/logon';
    });

    homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu'; 
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
        const progress = timeLeft / userTimer;
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
        timeLeft = Math.max(0, userTimer - elapsedTimeInSeconds - elapsedTime);
   
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
                startTime = Date.now() - (userTimer - timeLeft - elapsedTime) * 1000; // Resume based on elapsed time
            }

            // Re-enable smooth animation when resuming
            progressCircle.style.transition = "stroke-dashoffset 0s linear";

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
   
        timeLeft = userTimer;
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


    //////////////////////////////////////////
    // IMAGE PREVIEW FUNCTIONALITY
    //////////////////////////////////////////
    const imageInput = document.getElementById("imageUpload");
    const preview = document.getElementById("previewImage");

    if (imageInput && preview) {
        imageInput.addEventListener("change", function () {
            const file = imageInput.files[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                    preview.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                preview.src = "";
                preview.style.display = "none";
            }
        });
    }

});

