document.addEventListener('DOMContentLoaded', () => {

// check for token, and redirect if it doesn't exist
const token = localStorage.getItem('jwtToken');
if (!token) {
    window.location.href = '/';
};

});