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

    let timeLeft = userTimer;
    let running = false;
    let startTime = null;
    let elapsedTime = 0;
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

    // function updateDisplay() {
    //     let seconds = Math.ceil(timeLeft); // Ensure it shows whole seconds
    //     timerDisplay.textContent = `${seconds}s`;
    // }

    function updateDisplay() {
        timerDisplay.textContent = `${Math.ceil(timeLeft)}s`; // Show whole seconds
    }

    function updateCircle() {
        const progress = timeLeft / userTimer;
        progressCircle.style.strokeDashoffset = 377 * progress;
    }

    function startBreathingCycle() {
        if (breathInterval) return;
    
        let phase = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold
        const phases = ["Breathe In", "Hold Breath", "Breathe Out", "Pause"];
    
        breathText.textContent = phases[phase];
        breathText.style.opacity = 1;
    
        breathInterval = setInterval(() => {
            breathText.style.opacity = 0; // Fade out completely
    
            setTimeout(() => {
                phase = (phase + 1) % phases.length; // Cycle through phases
                breathText.textContent = phases[phase];
                breathText.style.opacity = 1; // Fade in
            }, 1000); // Wait for fade-out before changing text
        }, 4000); // Each phase lasts 4 seconds
    }

    function animateTimer() {
        if (!running) return;
    
        let now = Date.now();
        let elapsedTimeInSeconds = (now - startTime) / 1000;
        timeLeft = Math.max(0, userTimer - elapsedTimeInSeconds - elapsedTime);
    
        updateDisplay();
        updateCircle();
    
        if (timeLeft > 0) {
            requestAnimationFrame(animateTimer);
        } else {
            clearInterval(breathInterval);
            breathInterval = null;
            handleMeditationComplete(userTimer, "Breathing Exercise");
        }
    }

    function startStopTimer() {
        if (running) {
            clearInterval(breathInterval);
            breathInterval = null;
            elapsedTime += (Date.now() - startTime) / 1000; // Store elapsed time
            running = false;
            startStopBtn.textContent = "Start Timer";
    
            progressCircle.style.transition = "none"; // Stop animation immediately
        } else {
            startTime = Date.now();
            progressCircle.style.transition = "stroke-dashoffset 0s linear";
    
            startBreathingCycle();
            requestAnimationFrame(animateTimer);
    
            running = true;
            startStopBtn.textContent = "Stop Timer";
        }
    }

    function resetTimer() {
        clearInterval(breathInterval);
        breathInterval = null;
    
        timeLeft = userTimer;
        elapsedTime = 0;
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