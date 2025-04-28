document.addEventListener("DOMContentLoaded", async function () {

    const logoutButton = document.getElementById('logoutButton');
    const accountButton = document.getElementById('accountButton');
    const meditationButton = document.getElementById('meditationButton');
    const meditationCustomizeButton = document.getElementById('meditationCustomizeButton');
    const ResourceButton = document.getElementById('resourceButton');
    const DonateButton = document.getElementById('donateButton');

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
    if (meditationButton) { // Check if the button exists
        meditationButton.addEventListener('click', () => {
            window.location.href = '/meditation'; // Adjust the path if necessar
        });
    }
    

    if (accountButton) { // Check if the button exists
        accountButton.addEventListener('click', () => {
            console.log('CLICK');
            window.location.href = '/account';
        });
    }

    meditationCustomizeButton.addEventListener('click', () => {
        window.location.href = '/customize';
    });

    ResourceButton.addEventListener('click', () => {
        window.location.href = '/resources';
    });

    DonateButton.addEventListener('click', () => {
        window.open('https://www.paypal.com/us/home');
    });

});