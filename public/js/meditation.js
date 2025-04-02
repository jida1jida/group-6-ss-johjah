document.addEventListener('DOMContentLoaded', () => {
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
        bgContainer.style.opacity = 0.3; // Optional fade effect
      }
    }
  
    // Elements
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
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
    let breathInterval = null;
    let elapsedTime = 0;
  
    // Event Listeners
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('jwtToken');
      window.location.href = '/logon';
    });
  
    homeButton.addEventListener('click', () => {
      window.location.href = '/mainmenu';
    });
  
    startStopBtn.addEventListener("click", startStopTimer);
    resetBtn.addEventListener("click", resetTimer);
  
    // Timer Functions
    npm run devfunction updateDisplay() {
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
      updateDisplay();
      updateCircle();
      breathText.textContent = "Breathe In";
      breathText.style.opacity = 1;
      startStopBtn.textContent = "Start Timer";
    }
  
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
        if (!response.ok) throw new Error("Failed to log session.");
        console.log("Meditation session logged!");
      } catch (error) {
        console.error("Error logging session: ", error);
      }
    }
  
    function handleMeditationComplete(duration, type) {
      logMeditationSession(duration, type);
    }
  
    // Initial setup
    updateDisplay();
    updateCircle();
  });
  