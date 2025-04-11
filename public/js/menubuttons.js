document.addEventListener("DOMContentLoaded", async function () {

    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    const meditationButton = document.getElementById('meditationButton');
    const meditationCustomizeButton = document.getElementById('meditationCustomizeButton');

    // Dropdown menu
    function toggleDropdown() {
        var menu = document.getElementById("dropdown-menu");
        menu.classList.toggle("show");
    }
    
    window.onclick = function(event) {
        if (!event.target.matches('.dropdown-button')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            for (var i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains("show")) {
                    openDropdown.classList.remove("show");
                }
            }
        }
    }

    const dropdownButton = document.querySelector(".dropdown-button");
    dropdownButton.addEventListener("click", toggleDropdown)


    // Log out and redirect to login
    if (logoutButton) { // Check if the button exists
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('jwtToken');
            window.location.href = './logon'; // Redirect to login page
        });
    }

    // Redirect to the meditation page when the Meditation button is clicked
    meditationButton.addEventListener('click', () => {
        window.location.href = '/meditation'; // Adjust the path if necessar
    });

    accountButton.addEventListener('click', () => {
        window.location.href = '/account';
    });

    meditationCustomizeButton.addEventListener('click', () => {
        window.location.href = '/customize';
    });
    
});