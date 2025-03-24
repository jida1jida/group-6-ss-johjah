document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    // ELEMENTS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const timerDisplay = document.getElementById("timer");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");
    const progressCircle = document.getElementById("progressCircle");
    const breathText = document.getElementById("breathText");
    const imageGallery = document.getElementById("imageGallery");
    const imagePreviewContainer = document.getElementById("imagePreviewContainer");

    // Variables
    let timer;
    let timeLeft = 60;
    let running = false;
    let startTime = null;
    let breathInterval = null;
    let elapsedTime = 0;
    let selectedImages = [];

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

    startStopBtn.addEventListener("click", startStopTimer);
    resetBtn.addEventListener("click", resetTimer);

    // Image Selection from Gallery
    const galleryImages = document.querySelectorAll('.selectable-image');
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            const src = img.src;

            if (selectedImages.includes(src)) {
                selectedImages = selectedImages.filter(item => item !== src);
                img.style.border = '';
            } else {
                selectedImages.push(src);
                img.style.border = '3px solid #4CAF50';
            }

            updateSelectedPreviews();
        });
    });

    function updateSelectedPreviews() {
        imagePreviewContainer.innerHTML = '';
        selectedImages.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.style.maxWidth = '150px';
            img.style.margin = '10px';
            imagePreviewContainer.appendChild(img);
        });
    }

    //////////////////////////////////////////
    // TIMER FUNCTIONS
    //////////////////////////////////////////
    function updateDisplay() {
        let seconds = Math.ceil(timeLeft);
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
            breathText.style.opacity = 0;

            setTimeout(() => {
                breathText.textContent = inhale ? "Breathe In" : "Breathe Out";
                breathText.style.opacity = 1;
            }, 1000);
        }, 4000);
    }

    function animateTimer() {
        if (!running) return;

        let now = Date.now();
        let elapsedTimeInSeconds = (now - startTime) / 1000;

        timeLeft = Math.max(0, 60 - elapsedTimeInSeconds - elapsedTime);

        updateDisplay();
        updateCircle();

        if (timeLeft > 0) {
            requestAnimationFrame(animateTimer);
        } else {
            handleMeditationComplete(elapsedTimeInSeconds, "Breathing Exercise");
        }
    }

    function startStopTimer() {
        if (running) {
            clearInterval(timer);
            clearInterval(breathInterval);
            breathInterval = null;
            elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            running = false;
            startStopBtn.textContent = "Start Timer";
            progressCircle.style.transition = "none";
            progressCircle.style.strokeDashoffset = progressCircle.style.strokeDashoffset;
        } else {
            if (!startTime) {
                startTime = Date.now();
                elapsedTime = 0;
            } else {
                startTime = Date.now() - (60 - timeLeft - elapsedTime) * 1000;
            }

            progressCircle.style.transition = "stroke-dashoffset 1s linear";
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

    //////////////////////////////////////////
    // INITIALIZE
    //////////////////////////////////////////
    updateDisplay();
    updateCircle();
});
