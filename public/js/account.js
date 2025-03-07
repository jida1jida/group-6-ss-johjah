document.addEventListener("DOMContentLoaded", async function () {
    const message = document.getElementById("message");

    // Fields
    const nameDisplay = document.getElementById("nameDisplay");
    const emailDisplay = document.getElementById("emailDisplay");

    const nameInput = document.getElementById("nameInput");
    const emailInput = document.getElementById("emailInput");

    const editButtons = document.querySelectorAll(".editButton");

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
        userData = await DataModel.getCurrentUser();
        if (userData) {
            nameDisplay.textContent = userData.name || "N/A";
            emailDisplay.textContent = userData.email || "N/A";
        } else {
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
        if (field === "name") {
            nameDisplay.style.display = "none";
            nameInput.style.display = "inline";
            nameInput.value = userData.name;
        } else if (field === "email") {
            emailDisplay.style.display = "none";
            emailInput.style.display = "inline";
            emailInput.value = userData.email;
        }
    }

    // Function to verify password (Mocked for now, replace with API call)
    async function verifyPassword(password) {
        try {
            const response = await fetch('/api/verify-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DataModel.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                return false;
            }

            return true; // Password is correct
        } catch (error) {
            console.error("Password verification failed:", error);
            return false;
        }
    }
});