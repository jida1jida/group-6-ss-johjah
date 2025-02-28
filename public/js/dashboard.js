////////////////////////////////////////////////////////////////
//DASHBOARD.JS
//THIS IS YOUR "CONTROLLER", IT ACTS AS THE MIDDLEMAN
// BETWEEN THE MODEL (datamodel.js) AND THE VIEW (dashboard.html)
////////////////////////////////////////////////////////////////


//ADD ALL EVENT LISTENERS INSIDE DOMCONTENTLOADED
//AT THE BOTTOM OF DOMCONTENTLOADED, ADD ANY CODE THAT NEEDS TO RUN IMMEDIATELY
document.addEventListener('DOMContentLoaded', () => {
    
    //////////////////////////////////////////
    //ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////
    const logoutButton = document.getElementById('logoutButton');
    const refreshButton = document.getElementById('refreshButton');
    //////////////////////////////////////////
    //END ELEMENTS TO ATTACH EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////
    //EVENT LISTENERS
    //////////////////////////////////////////
    // Log out and redirect to login
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        window.location.href = '/';
    });

    // Refresh list when the button is clicked
    refreshButton.addEventListener('click', async () => {
        renderUserList();
    });
    //////////////////////////////////////////
    //END EVENT LISTENERS
    //////////////////////////////////////////


    //////////////////////////////////////////////////////
    //CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////////////////
    // Initial check for the token
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        window.location.href = '/';
    } else {
        DataModel.setToken(token);
        renderUserList();
    }
    //////////////////////////////////////////
    //END CODE THAT NEEDS TO RUN IMMEDIATELY AFTER PAGE LOADS
    //////////////////////////////////////////
});
//END OF DOMCONTENTLOADED


//////////////////////////////////////////
//FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////
async function renderUserList() {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '<div class="loading-message">Loading user list...</div>';
    const users = await DataModel.getUsers(); 
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        userItem.textContent = user;
        userListElement.appendChild(userItem);
    });
}
//////////////////////////////////////////
//END FUNCTIONS TO MANIPULATE THE DOM
//////////////////////////////////////////