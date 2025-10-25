// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize princesses
    renderPrincesses(princesses);
    updateAuthUI();
    setupCodeInputs();
    
    // Mobile menu functionality
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuClose = document.getElementById('menu-close');
    const menuLinks = document.querySelectorAll('.menu-link');
    
    function openMenu() {
        mobileMenu.style.display = 'block';
        setTimeout(() => mobileMenu.classList.add('active'), 10);
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        mobileMenu.classList.remove('active');
        setTimeout(() => mobileMenu.style.display = 'none', 300);
        menuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    mobileMenuBtn.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
    menuLinks.forEach(link => link.addEventListener('click', closeMenu));
    
    // Authentication modals
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const verificationModal = document.getElementById('verification-modal');
    const closeLogin = document.getElementById('close-login');
    const closeSignup = document.getElementById('close-signup');
    const closeVerification = document.getElementById('close-verification');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    
    function openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    loginBtn.addEventListener('click', () => openModal(loginModal));
    signupBtn.addEventListener('click', () => openModal(signupModal));
    closeLogin.addEventListener('click', () => closeModal(loginModal));
    closeSignup.addEventListener('click', () => closeModal(signupModal));
    closeVerification.addEventListener('click', () => {
        closeModal(verificationModal);
        if (verificationTimer) clearInterval(verificationTimer);
    });
    
    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(signupModal);
    });
    
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signupModal);
        openModal(loginModal);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === signupModal) closeModal(signupModal);
        if (e.target === verificationModal) {
            closeModal(verificationModal);
            if (verificationTimer) clearInterval(verificationTimer);
        }
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        currentUser = null;
        localStorage.removeItem('iprincesses_current_user');
        updateAuthUI();
        showSuccessMessage('You have been logged out successfully.');
    });
    
    // Search functionality
    const searchIcon = document.getElementById('search-icon');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    
    searchIcon.addEventListener('click', function() {
        document.querySelector('.search-section').scrollIntoView({ behavior: 'smooth' });
        searchInput.focus();
    });
    
    searchInput.addEventListener('input', function() {
        searchPrincesses(this.value);
    });
    
    searchBtn.addEventListener('click', function() {
        searchPrincesses(searchInput.value);
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target) && !searchBtn.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const phone = document.getElementById('login-phone').value;
        const password = document.getElementById('login-password').value;
        
        const user = users.find(u => u.phone === phone && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
            updateAuthUI();
            closeModal(loginModal);
            showSuccessMessage(`Welcome back, ${user.name}!`);
        } else {
            alert('Invalid phone number or password. Please try again.');
        }
    });
    
    // Signup form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }
        
        if (users.find(u => u.phone === phone)) {
            alert('A user with this phone number already exists. Please use a different number or login.');
            return;
        }
        
        const userData = {
            id: users.length + 1,
            name: name,
            phone: phone,
            password: password,
            joinDate: new Date().toISOString(),
            verified: false
        };
        
        closeModal(signupModal);
        verifyPhoneNumber(userData);
    });
    
    // Verification form submission
    document.getElementById('verification-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const enteredCode = Array.from(document.querySelectorAll('.code-input'))
            .map(input => input.value)
            .join('');
        const expectedCode = document.getElementById('verification-code').value;
        const userData = JSON.parse(document.getElementById('verification-user-data').value);
        
        if (enteredCode === expectedCode) {
            users.push(userData);
            localStorage.setItem('iprincesses_users', JSON.stringify(users));
            
            currentUser = userData;
            localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
            
            updateAuthUI();
            closeModal(verificationModal);
            showSuccessMessage(`Welcome to iPrincesses, ${userData.name}! Your account has been verified.`);
            
            if (verificationTimer) clearInterval(verificationTimer);
        } else {
            alert('Invalid verification code. Please try again.');
        }
    });
    
    // Resend code functionality
    document.getElementById('resend-code').addEventListener('click', function(e) {
        e.preventDefault();
        if (countdownTime > 0) return;
        
        const userData = JSON.parse(document.getElementById('verification-user-data').value);
        verifyPhoneNumber(userData);
    });
    
    // Social login simulation
    document.getElementById('google-login').addEventListener('click', function() {
        const user = {
            id: 'google_' + Date.now(),
            name: 'Google User',
            phone: '+256700000000',
            joinDate: new Date().toISOString(),
            provider: 'google',
            verified: true
        };
        
        currentUser = user;
        localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal(loginModal);
        showSuccessMessage(`Welcome, ${user.name}!`);
    });
    
    document.getElementById('facebook-login').addEventListener('click', function() {
        const user = {
            id: 'fb_' + Date.now(),
            name: 'Facebook User',
            phone: '+256711111111',
            joinDate: new Date().toISOString(),
            provider: 'facebook',
            verified: true
        };
        
        currentUser = user;
        localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal(loginModal);
        showSuccessMessage(`Welcome, ${user.name}!`);
    });
    
    document.getElementById('google-signup').addEventListener('click', function() {
        const user = {
            id: 'google_' + Date.now(),
            name: 'Google User',
            phone: '+256700000000',
            joinDate: new Date().toISOString(),
            provider: 'google',
            verified: true
        };
        
        currentUser = user;
        localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal(signupModal);
        showSuccessMessage(`Welcome to iPrincesses, ${user.name}!`);
    });
    
    document.getElementById('facebook-signup').addEventListener('click', function() {
        const user = {
            id: 'fb_' + Date.now(),
            name: 'Facebook User',
            phone: '+256711111111',
            joinDate: new Date().toISOString(),
            provider: 'facebook',
            verified: true
        };
        
        currentUser = user;
        localStorage.setItem('iprincesses_current_user', JSON.stringify(currentUser));
        updateAuthUI();
        closeModal(signupModal);
        showSuccessMessage(`Welcome to iPrincesses, ${user.name}!`);
    });
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            filterPrincesses(this.getAttribute('data-filter'));
        });
    });
    
    // Browse princesses button
    document.getElementById('browse-princesses').addEventListener('click', function() {
        document.getElementById('princesses').scrollIntoView({ behavior: 'smooth' });
    });
});
