// Unified meditation + customize script

// This file handles BOTH customize.html and meditation.html pages

document.addEventListener('DOMContentLoaded', () => {
    ////////////////////////////////////////
    // INITIAL SETUP
    ////////////////////////////////////////
  
    const token = localStorage.getItem('jwtToken');
  
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    const meditationButton = document.getElementById('meditationButton');
    const openModalBtn = document.getElementById('openModal');
    const cancelButton = document.getElementById('cancelButton');

    // med-specifics
    let breathingPaused = false;
    let currentBreathingPhase = 0;
    let phaseTimeout = null;

  
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
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
  
    if (openModalBtn) {
      openModalBtn.addEventListener('click', () => {
        localStorage.setItem('meditationDuration', userTimer);
        document.getElementById('myModal').style.display = 'block';
      });
    }
  
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        document.getElementById('myModal').style.display = 'none';
      });
    }
  
    ////////////////////////////////////////
    // CUSTOMIZE PAGE FEATURES
    ////////////////////////////////////////
  
    const timeButtons = document.querySelectorAll('.med-time-btn');
    const breathingButtons = document.querySelectorAll('.phase-pattern-btn');
    const audioButtons = document.querySelectorAll('.med-aud-btn');
    const musicSelect = document.getElementById('musicSelect');
    const backgroundEditButton = document.getElementById('backgroundEditButton');
    const backgroundDefaultButton = document.getElementById('backgroundDefaultButton');
    const backgroundUpload = document.getElementById('backgroundUpload');
  
    let userTimer = parseInt(localStorage.getItem('meditationDuration')) || 60;
    let breathingPattern = JSON.parse(localStorage.getItem('breathingPattern')) || [4000, 4000, 4000, 4000];
    let audioEnabled = localStorage.getItem('audioEnabled') !== 'false'; // default true
  
    if (timeButtons.length > 0) {
      timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          timeButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          userTimer = parseInt(btn.getAttribute('data-duration'));
          localStorage.setItem('meditationDuration', userTimer);
        });
      });
    }
  
    if (breathingButtons.length > 0) {
      breathingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          breathingButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          breathingPattern = JSON.parse(btn.getAttribute('data-phase-durations'));
          localStorage.setItem('breathingPattern', JSON.stringify(breathingPattern));
        });
      });
    }

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
  
    // if (audioButtons.length > 0) {
    //   audioButtons.forEach(btn => {
    //     btn.addEventListener('click', () => {
    //       audioButtons.forEach(b => b.classList.remove('selected'));
    //       btn.classList.add('selected');
    //       audioEnabled = btn.textContent.trim().toLowerCase() === 'enable';
    //       localStorage.setItem('audioEnabled', audioEnabled);
    //     });
    //   });
    // }

    const enableAudioBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === "Enable");
    const disableAudioBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === "Disable");
    //   const audioButtons = document.querySelectorAll('.med-aud-btn');
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
      const audioCues = {
        "Breathe In": new Audio('audio/Breathe_in.mp3'),
        "Hold Breath": new Audio('audio/Hold_it.mp3'),
        "Breathe Out": new Audio('audio/Breathe_out.mp3'),
        "Rest": new Audio('audio/Rest.mp3')
      };
  
    if (musicSelect) {
      musicSelect.addEventListener('change', () => {
        const embedUrl = musicSelect.value;
        localStorage.setItem('spotifyEmbedUrl', embedUrl);
      });
    }
  
    if (backgroundEditButton && backgroundUpload) {
      backgroundEditButton.addEventListener('click', () => {
        backgroundUpload.click();
      });
  
      backgroundUpload.addEventListener('change', function() {
        const file = backgroundUpload.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            localStorage.setItem('meditationBackground', e.target.result);
            alert('Background uploaded successfully!');
          };
          reader.readAsDataURL(file);
        }
      });
    }
  
    if (backgroundDefaultButton) {
      backgroundDefaultButton.addEventListener('click', () => {
        localStorage.removeItem('meditationBackground');
        alert('Background reset to default!');
      });
    }
  
  
    ////////////////////////////////////////
    // MEDITATION PAGE FEATURES
    ////////////////////////////////////////
  
    const timerDisplay = document.getElementById('timer');
    const startStopBtn = document.getElementById('startStopBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressCircle = document.getElementById('progressCircle');
    const breathText = document.getElementById('breathText');
    const spotifyPlayer = document.getElementById('spotifyPlayer');
    const emojiPopup = document.getElementById('emojiPopup');
  
    let timer;
    let timeLeft = userTimer;
    let running = false;
    let startTime = null;
    let elapsedTime = 0;
    let breathInterval = null;
    let popupShown = false;
    let completedDuration = 0;
  
    if (spotifyPlayer) {
      const spotifyEmbedUrl = localStorage.getItem('spotifyEmbedUrl');
      if (spotifyEmbedUrl) {
        spotifyPlayer.src = spotifyEmbedUrl;
      }
    }
  
    if (startStopBtn && resetBtn) {
      startStopBtn.addEventListener('click', startStopTimer);
      resetBtn.addEventListener('click', resetTimer);
      updateDisplay();
      updateCircle();
    }
  
    function updateDisplay() {
      let seconds = Math.ceil(timeLeft);
      if (timerDisplay) timerDisplay.textContent = `${seconds}s`;
    }
  
    function updateCircle() {
      if (progressCircle) {
        const progress = timeLeft / userTimer;
        progressCircle.style.strokeDashoffset = 377 * progress;
      }
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
        return;
      }
  
      requestAnimationFrame(animateTimer);
    }
  
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

          console.log(`Current phase: ${currentPhase}, Duration: ${durations[currentBreathingPhase]}ms`);
      
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
  
    async function logMeditationSession(duration, type, mood = "Unknown") {
      try {
        const response = await fetch('/api/med-session', {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration, type, mood }),
        });
        if (!response.ok) throw new Error("Failed to log session.");
      } catch (error) {
        console.error("Error logging session: ", error);
      }
    }
  
    function handleMeditationComplete(duration, type) {
      if (popupShown) return;
      completedDuration = Math.round(duration);
      popupShown = true;
      showEmojiPopup();
      running = false;
      startStopBtn.textContent = "Start Timer";
    }
  
    function showEmojiPopup() {
      if (emojiPopup) {
        emojiPopup.classList.remove('hidden');
        emojiPopup.style.display = 'block';
      }
    }
  
    if (emojiPopup) {
      emojiPopup.addEventListener('click', (e) => {
        if (e.target.tagName === "BUTTON") {
          const feeling = e.target.getAttribute("data-feeling");
          logMeditationSession(completedDuration, "Breathing Exercise", feeling);
          emojiPopup.classList.add('hidden');
          emojiPopup.style.display = 'none';
          popupShown = false;
        }
      });
    }
  
  });