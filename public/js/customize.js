document.addEventListener('DOMContentLoaded', () => {
    
    // check for token, and redirect if it doesn't exist
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    };
  
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

      const patternButtons = document.querySelectorAll('.phase-pattern-btn');
      if (patternButtons.length > 0) {
        patternButtons.forEach(button => {
          button.addEventListener('click', event => {
            // Remove selected class if you want a visual cue
            patternButtons.forEach(btn => btn.classList.remove('selected'));
            event.target.classList.add('selected');
      
            // Store the breathing phase durations
            const phaseDurations = event.target.getAttribute('data-phase-durations');
            localStorage.setItem('breathPhaseDurations', phaseDurations);
      
            console.log("Saved breathing pattern:", phaseDurations);
          });
        });
      }

      const enableAudioBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === "Enable");
      const disableAudioBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === "Disable");
      const audioButtons = document.querySelectorAll('.med-aud-btn');
      if (enableAudioBtn && disableAudioBtn) {
        enableAudioBtn.addEventListener('click', () => {
        audioButtons.forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        localStorage.setItem('audioEnabled', 'true');
        // alert("Audio cues enabled!");
      });
      
        disableAudioBtn.addEventListener('click', () => {
          audioButtons.forEach(btn => btn.classList.remove('selected'));
          event.target.classList.add('selected');
          localStorage.setItem('audioEnabled', 'false');
          // alert("Audio cues disabled!");
        });
      }
  
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

    let breathingPaused = false;
    let currentBreathingPhase = 0;
    let phaseTimeout = null;
  
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

      const audioCues = {
        "Breathe In": new Audio('audio/Breathe_in.mp3'),
        "Hold Breath": new Audio('audio/Hold_it.mp3'),
        "Breathe Out": new Audio('audio/Breathe_out.mp3'),
        "Rest": new Audio('audio/Rest.mp3')
      };
  
      function startBreathingCycle() {
        if (breathInterval) return;
      
        const phases = ["Breathe In", "Hold Breath", "Breathe Out", "Rest"];
        const savedDurations = localStorage.getItem('breathPhaseDurations');
        const durations = savedDurations ? JSON.parse(savedDurations) : [4000, 4000, 4000, 4000];
      
        function nextPhase() {
          if (breathingPaused) return; // Don't proceed if paused
          breathText.textContent = phases[currentBreathingPhase];

          const currentPhase = phases[currentBreathingPhase];
          const audioEnabled = localStorage.getItem('audioEnabled') !== 'false'; // default to true
          
          if (audioEnabled && audioCues[currentPhase]) {
            audioCues[currentPhase].currentTime = 0;
            audioCues[currentPhase].play().catch(err => {
              console.warn("Audio playback failed:", err);
            });
          }

          breathText.style.opacity = 1;
      
          // Clear previous timeout if there's any
          if (phaseTimeout) clearTimeout(phaseTimeout);
      
          // Set new timeout for phase change
          phaseTimeout = setTimeout(() => {
            if (breathingPaused) return; // Stop immediately if paused
            breathText.style.opacity = 0;
      
            // Set the next phase timeout
            setTimeout(() => {
              currentBreathingPhase = (currentBreathingPhase + 1) % phases.length;
              nextPhase(); // Call again for the next phase
            }, 1000);
          }, durations[currentBreathingPhase]);
        }
      
        nextPhase(); // Start the cycle
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
      
          // Pause breathing cycle
          breathingPaused = true;
      
          // Clear the phase timeout to avoid any active fade/phase after pause
          if (phaseTimeout) clearTimeout(phaseTimeout);
      
          // Fade elements back IN if you want them fully visible when paused
          fadeInContainers();
        } else {
          // Start
          startTime = Date.now();
          progressCircle.style.transition = "stroke-dashoffset 0s linear";
      
          // Restart breathing cycle from where it left off
          breathingPaused = false;
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
      
        // Reset breathing cycle and phase
        currentBreathingPhase = 0; // Reset to the first phase
        breathingPaused = false; // Ensure it's not paused
      
        // Clear phase timeout when resetting
        if (phaseTimeout) clearTimeout(phaseTimeout);
      
        // Restart the breathing cycle from the beginning
        breathText.textContent = "Breathe In";
        breathText.style.opacity = 1;
      
        // Re-initialize the timer display and circle
        updateDisplay();
        updateCircle();
      
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

      // MESSAGE BOX TEST //
      const modal = document.getElementById("myModal");
      const openModalBtn = document.getElementById("openModal");
      const cancelBtn = document.getElementById("cancelBtn");
      
      openModalBtn.addEventListener("click", () => {
          modal.style.display = "block";
      });
      
      cancelButton.addEventListener("click", () => {
          modal.style.display = "none";
      });
      
      // Close if clicking outside modal
      window.addEventListener("click", (event) => {
          if (event.target === modal) {
              modal.style.display = "none";
          }
      });
  const musicSelect = document.getElementById('musicSelect');
  if (musicSelect) {
    musicSelect.addEventListener('change', (event) => {
      const embedUrl = event.target.value;
      if (embedUrl) {
        localStorage.setItem('spotifyEmbedUrl', embedUrl);
        alert("Music selection saved!");
      } else {
        localStorage.removeItem('spotifyEmbedUrl');
        alert("Music disabled.");
      }
    });
  }

      