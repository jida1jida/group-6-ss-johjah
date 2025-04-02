document.addEventListener('DOMContentLoaded', () => {
    ////////////////////////////////////////////////////////
    // COMMON ELEMENTS (Appear on Both Pages)
    ////////////////////////////////////////////////////////
  
    // Sometimes these buttons exist on both pages:
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const meditationButton = document.getElementById('meditationButton');
    const meditationCustomizeButton = document.getElementById('meditationCustomizeButton');
  
    // Safely attach event listeners only if elements exist:
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/logon';
      });
    }
  
    if (homeButton) {
      homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu';
      });
    }
  
    if (meditationButton) {
      meditationButton.addEventListener('click', () => {
        window.location.href = '/meditation';
      });
    }
  
    if (meditationCustomizeButton) {
      meditationCustomizeButton.addEventListener('click', () => {
        window.location.href = '/customize';
      });
    }
  
    ////////////////////////////////////////////////////////
    // CUSTOMIZE PAGE-SPECIFIC CODE
    ////////////////////////////////////////////////////////
    // On customize.html, we have .med-time-btn and a background upload input
    const timeButtons = document.querySelectorAll('.med-time-btn');
    if (timeButtons && timeButtons.length > 0) {
      // We know we're on 'customize.html'
      
      // Attach event listeners for time selection
      timeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          // Remove 'selected' class from all, add to clicked one
          timeButtons.forEach(btn => btn.classList.remove('selected'));
          event.target.classList.add('selected');
  
          // Save duration in localStorage
          const duration = event.target.getAttribute('data-duration');
          console.log(`User selected ${duration} seconds`);
          localStorage.setItem('meditationDuration', duration);
        });
      });
  
      // (Optional) If you want a file input for the background
      const backgroundUpload = document.getElementById('backgroundUpload');
      if (backgroundUpload) {
        backgroundUpload.addEventListener('change', function (event) {
          const file = event.target.files[0];
          if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
              localStorage.setItem("meditationBackground", e.target.result);
              alert("Background image saved! Head to the meditation page to see it.");
            };
            reader.readAsDataURL(file);
          }
        });
      }
  
      // If you have an "Edit" button to *trigger* the file input, do:
      const backgroundEditButton = document.getElementById('backgroundEditButton');
      if (backgroundEditButton && backgroundUpload) {
        backgroundEditButton.addEventListener('click', () => {
          // Programmatically click the hidden file input
          backgroundUpload.click();
        });
      }
  
      // If you have a "Default" button for background, e.g.:
      const backgroundDefaultButton = document.getElementById('backgroundDefaultButton');
      if (backgroundDefaultButton) {
        backgroundDefaultButton.addEventListener('click', () => {
          localStorage.removeItem("meditationBackground");
          alert("Background reset to default!");
        });
      }
    }
  
    ////////////////////////////////////////////////////////
    // MEDITATION PAGE-SPECIFIC CODE
    ////////////////////////////////////////////////////////
    // On meditation.html, we have #timer, #startStopBtn, etc.
    const timerDisplay = document.getElementById('timer');
    const startStopBtn = document.getElementById('startStopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressCircle = document.getElementById('progressCircle');
    const breathText = document.getElementById('breathText');
  
    // Only initialize timer code if these elements exist
    if (timerDisplay && startStopBtn && resetBtn && progressCircle && breathText) {
      // Grab the user's chosen duration (or default to 60)
      let userTimer = localStorage.getItem('meditationDuration')
        ? parseInt(localStorage.getItem('meditationDuration'))
        : 60;
  
      let timeLeft = userTimer;
      let running = false;
      let startTime = null;
      let elapsedTime = 0;
      let breathInterval = null;
  
      // Initialize Display (so it shows correct time right away)
      updateDisplay();
      updateCircle();
  
      // Attach timer event listeners
      startStopBtn.addEventListener("click", startStopTimer);
      resetBtn.addEventListener("click", resetTimer);
  
      function updateDisplay() {
        timerDisplay.textContent = `${Math.ceil(timeLeft)}s`;
      }
  
      function updateCircle() {
        // 2πr = ~377 for r=60 (your circle's circumference)
        const progress = timeLeft / userTimer;
        progressCircle.style.strokeDashoffset = 377 * progress;
      }
  
      function startBreathingCycle() {
        if (breathInterval) return;
  
        let phase = 0; // 0=Inhale, 1=Hold, 2=Exhale, 3=Hold
        const phases = ["Breathe In", "Hold Breath", "Breathe Out", "Pause"];
  
        breathText.textContent = phases[phase];
        breathText.style.opacity = 1;
  
        breathInterval = setInterval(() => {
          breathText.style.opacity = 0;
          setTimeout(() => {
            phase = (phase + 1) % phases.length;
            breathText.textContent = phases[phase];
            breathText.style.opacity = 1;
          }, 1000);
        }, 4000); // Each phase lasts 4s
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
          // Timer done
          clearInterval(breathInterval);
          breathInterval = null;
          handleMeditationComplete(userTimer, "Breathing Exercise");
        }
      }
  
      function startStopTimer() {
        if (running) {
          // Stop
          clearInterval(breathInterval);
          breathInterval = null;
          elapsedTime += (Date.now() - startTime) / 1000;
          running = false;
          startStopBtn.textContent = "Start Timer";
          progressCircle.style.transition = "none";

        // Fade elements back IN if you want them fully visible when paused
        fadeInContainers();
        } else {
          // Start
          startTime = Date.now();
          progressCircle.style.transition = "stroke-dashoffset 0s linear";
  
          startBreathingCycle();
          requestAnimationFrame(animateTimer);
  
          running = true;
          startStopBtn.textContent = "Stop Timer";

        // Fade elements OUT when meditation starts
        fadeOutContainers();
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

        // Fade elements back in
        fadeInContainers();
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
    }
  
    ////////////////////////////////////////////////////////
    // OPTIONAL: Set background image if user uploaded one
    ////////////////////////////////////////////////////////
    const bgContainer = document.getElementById('backgroundImageContainer');
    if (bgContainer) {
      const bg = localStorage.getItem('meditationBackground');
      if (bg) {
        bgContainer.style.backgroundImage = `url(${bg})`;
      }
    }
  });

// Fade html elements when start button pressed
function fadeOutContainers() {
    // Grab whichever elements you want to fade
    // Example: ALL elements with class "container" AND the .header
    const fadeTargets = document.querySelectorAll('.fade-target');
  
    fadeTargets.forEach(el => {
      el.classList.add('faded'); // Add the .faded class to fade them out
    });
  }
  
  function fadeInContainers() {
    const fadeTargets = document.querySelectorAll('.fade-target');
  
    fadeTargets.forEach(el => {
      el.classList.remove('faded'); // Remove .faded to fade back in
    });
  }