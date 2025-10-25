// Authentication System
let users = JSON.parse(localStorage.getItem('iprincesses_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('iprincesses_current_user')) || null;
let verificationTimer = null;
let countdownTime = 60;

// Function to generate random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to simulate sending SMS
function sendVerificationCode(phoneNumber, code) {
    console.log(`SMS sent to ${phoneNumber}: Your iPrincesses verification code is ${code}`);
    // For demo purposes, we'll store the code
    localStorage.setItem('last_verification_code', code);
    localStorage.setItem('last_verification_phone', phoneNumber);
    
    return Promise.resolve({ success: true });
}

// Function to start verification countdown
function startVerificationCountdown() {
    const countdownElement = document.getElementById('countdown');
    const resendLink = document.getElementById('resend-code');
    countdownTime = 60;
    
    resendLink.style.pointerEvents = 'none';
    resendLink.style.opacity = '0.5';
    
    verificationTimer = setInterval(() => {
        countdownTime--;
        countdownElement.textContent = `(${countdownTime}s)`;
        
        if (countdownTime <= 0) {
            clearInterval(verificationTimer);
            resendLink.style.pointerEvents = 'auto';
            resendLink.style.opacity = '1';
            countdownElement.textContent = '';
        }
    }, 1000);
}

// Function to verify phone number
function verifyPhoneNumber(userData) {
    const verificationCode = generateVerificationCode();
    const phoneNumber = userData.phone;
    
    const verificationModal = document.getElementById('verification-modal');
    const verificationPhone = document.getElementById('verification-phone');
    
    verificationPhone.textContent = phoneNumber;
    document.getElementById('verification-user-data').value = JSON.stringify(userData);
    document.getElementById('verification-code').value = verificationCode;
    
    // Clear previous inputs
    document.querySelectorAll('.code-input').forEach(input => input.value = '');
    
    // Show modal
    verificationModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Start countdown
    startVerificationCountdown();
    
    // Send verification code
    sendVerificationCode(phoneNumber, verificationCode);
}

// Function to setup code inputs
function setupCodeInputs() {
    const codeInputs = document.querySelectorAll('.code-input');
    
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });
}

// Function to update authentication UI
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (currentUser) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        userName.textContent = currentUser.name;
    } else {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
    }
}

// Function to show success message
function showSuccessMessage(message) {
    const successMessage = document.getElementById('success-message');
    successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}
