document.addEventListener("DOMContentLoaded", async function () {
    // Navigation buttons
    const logoutButton = document.getElementById('logoutButton');
    const homeButton = document.getElementById('homeButton');
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
    });
    homeButton.addEventListener('click', () => {
        window.location.href = '/mainmenu';
    });
    
    const message = document.getElementById("message");

    // Fields
    const nameDisplay = document.getElementById("nameDisplay");
    const emailDisplay = document.getElementById("emailDisplay");
    const passwordDisplay = document.getElementById("passwordDisplay")

    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");

    const editButtons = document.querySelectorAll(".editButton");
    const saveButton = document.getElementById("saveButton");
    const cancelButton = document.getElementById("cancelButton");
    cancelButton.addEventListener('click', () => { // return to home
        window.location.href = '/mainmenu';
    });

    // Password Modal
    const passwordModal = document.getElementById("passwordModal");
    const verifyPasswordInput = document.getElementById("verifyPassword");
    const confirmPasswordButton = document.getElementById("confirmPasswordButton");
    const cancelPasswordButton = document.getElementById("cancelPasswordButton");
    const passwordError = document.getElementById("passwordError");

    let currentEditingField = null;
    let userData = null;

    // Load user data
    async function loadUserData() {
        const token = localStorage.getItem('jwtToken');
        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch user data");
            }

            const data = await response.json();
            
            const email = JSON.parse(atob(token.split('.')[1])).email; // Decode JWT token
            const user = data.users.find(u => u.email === email);
            userData = user;

            nameDisplay.textContent = user.prefname || "N/A";
            emailDisplay.textContent = user.email || "N/A";
            passwordDisplay.textContent = "**********" // doesn't actually show password

        } catch (error) {
            console.error("Error fetching user data:", error);
            message.textContent = "Error loading user data.";
            message.style.color = "red";
        }
    }

    await loadUserData();

    // Handle edit button clicks
    editButtons.forEach(button => {
        button.addEventListener("click", function () {
            currentEditingField = this.dataset.field;
            passwordModal.style.display = "block"; // Show password prompt
        });
    });

    // Confirm password input
    confirmPasswordButton.addEventListener("click", async function () {
        const enteredPassword = verifyPasswordInput.value.trim();
        if (!enteredPassword) {
            passwordError.textContent = "Password cannot be empty.";
            return;
        }

        const isVerified = await verifyPassword(enteredPassword);
        if (isVerified) {
            passwordModal.style.display = "none"; // Close modal
            enableFieldEditing(currentEditingField);
        } else {
            passwordError.textContent = "Incorrect password. Try again.";
        }
    });

    // Cancel password prompt
    cancelPasswordButton.addEventListener("click", function () {
        passwordModal.style.display = "none";
        verifyPasswordInput.value = "";
        passwordError.textContent = "";
    });

    // Function to enable editing of the selected field
    function enableFieldEditing(field) {
        saveButton.style.display = "inline"; // enable save button
        cancelButton.style.display = "inline"; // enable cancel button
        if (field === "name") {
            nameDisplay.style.display = "none";
            nameInput.style.display = "inline";
            nameInput.value = userData.prefname;
        } else if (field === "email") {
            emailDisplay.style.display = "none";
            emailInput.style.display = "inline";
            emailInput.value = userData.email;
        } else if (field === "password") {
            passwordDisplay.style.display = "none";
            passwordInput.style.display = "inline";
        }
    }

    // Function to verify password
    async function verifyPassword(password) {
        const token = localStorage.getItem('jwtToken');
        
        try {
            const response = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();
            if (response.ok) {
                return true;
            } else {
                return false;
            }

        } catch (error) {
            console.error("Password verification failed:", error);
            return false;
        }
    }

    // Function to save any changes
    async function saveChanges(field, newValue) {
        
    }
});