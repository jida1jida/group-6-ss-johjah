document.addEventListener('DOMContentLoaded', () => {
  let completedDuration = 0; 
  let popupShown = false;
    // Set background inside the meditation box       
    const bg = localStorage.getItem('meditationBackground');
    if (bg) {
      const bgContainer = document.getElementById('backgroundImageContainer');
      if (bgContainer) {
        bgContainer.style.backgroundImage = `url(${bg})`;
        bgContainer.style.position = 'absolute';
        bgContainer.style.top = 0;
        bgContainer.style.left = 0;
        bgContainer.style.width = '100%';
        bgContainer.style.height = '100%';
        bgContainer.style.backgroundSize = 'cover';
        bgContainer.style.backgroundPosition = 'center';
        bgContainer.style.backgroundRepeat = 'no-repeat';
        bgContainer.style.zIndex = 0;
        bgContainer.style.opacity = 0.5; // Optional fade effect
      }
    }
  
    // Elements
    const timerDisplay = document.getElementById("timer");
    const startStopBtn = document.getElementById("startStopBtn");
    const resetBtn = document.getElementById("resetBtn");
    const progressCircle = document.getElementById("progressCircle");
    const breathText = document.getElementById("breathText");
  
    // Timer variables
    let userTimer = 60;
    let timer;
    let timeLeft = userTimer;
    let running = false;
    let startTime = null;
    let elapsedTime = 0;
    let breathInterval = null;
  
    // Event Listeners

    startStopBtn.addEventListener('click', startStopTimer);
    resetBtn.addEventListener('click', resetTimer);
  
    // Timer Functions
    function updateDisplay() {
      let seconds = Math.ceil(timeLeft);
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
      timeLeft = Math.max(0, userTimer - elapsedTimeInSeconds - elapsedTime);
    
      updateDisplay();
      updateCircle();
    
      if (timeLeft <= 0 && !popupShown) {
        handleMeditationComplete(userTimer, "Breathing Exercise");
        return; // exit loop
      }
    
      requestAnimationFrame(animateTimer);
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
      } else {
        if (!startTime) {
          startTime = Date.now();
          elapsedTime = 0;
        } else {
          startTime = Date.now() - (userTimer - timeLeft - elapsedTime) * 1000;
        }
        progressCircle.style.transition = "stroke-dashoffset 0s linear";
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
      timeLeft = userTimer;
      elapsedTime = 0;
      startTime = null;
      running = false;
      popupShown = false; // <-- reset this
      updateDisplay();
      updateCircle();
      breathText.textContent = "Breathe In";
      breathText.style.opacity = 1;
      startStopBtn.textContent = "Start Timer";
    }
  
    async function logMeditationSession(duration, type, mood = null) {
      const token = localStorage.getItem('jwtToken');
      try {
        const response = await fetch('/api/med-session', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration, type, mood: mood || "Unknown" }),
        });
        if (!response.ok) throw new Error("Failed to log session.");
        console.log("Meditation session logged with mood:", mood);
      } catch (error) {
        console.error("Error logging session: ", error);
      }
    }
    function handleMeditationComplete(duration, type) {
      if (popupShown) return; // prevent double popup
      console.log("Meditation complete!");
      completedDuration = Math.round(duration);
      popupShown = true;
      showEmojiPopup();
      running = false;
      startStopBtn.textContent = "Start Timer";
    }

    // Mood popup      
    const emojiPopup = document.getElementById("emojiPopup");

    function showEmojiPopup() {
      console.log("SHOWING EMOJI POPUP");
      emojiPopup.classList.remove("hidden");
      emojiPopup.style.display = "block"
    }

    emojiPopup.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const feeling = e.target.getAttribute("data-feeling"); // get mood
        console.log("User is feeling:", feeling);
    
        // Send session + mood to backend
        logMeditationSession(completedDuration, "Breathing Exercise", feeling);
    
        // Hide popup after selection
        emojiPopup.classList.add("hidden");
        emojiPopup.style.display = "none";
    
        // Optional: reset for future session if needed
        popupShown = false;
      }
    });
    const spotifyEmbedUrl = localStorage.getItem('spotifyEmbedUrl');
    const spotifyPlayer = document.getElementById('spotifyPlayer');
    if (spotifyEmbedUrl && spotifyPlayer) {
      spotifyPlayer.src = spotifyEmbedUrl;
    }

  
    // Initial setup
    updateDisplay();
    updateCircle();
  });
  