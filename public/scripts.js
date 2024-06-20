let token = '';

function hideAllViews() {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('register-view').style.display = 'none';
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById('messages-view').style.display = 'none';
    document.getElementById('notification-view').style.display = 'none';
}

function showHome() {
    hideAllViews();
    document.getElementById('home-view').style.display = 'block';
}

function showLogin() {
    hideAllViews();
    document.getElementById('login-view').style.display = 'block';
}

function showRegister() {
    hideAllViews();
    document.getElementById('register-view').style.display = 'block';
}

function showMain() {
    hideAllViews();
    document.getElementById('main-view').style.display = 'block';
}

function showProfile() {
    hideAllViews();
    document.getElementById('profile-view').style.display = 'block';
}

function showMessages() {
    hideAllViews();
    document.getElementById('messages-view').style.display = 'block';
    fetchMessages();
}

function showNotification() {
    hideAllViews();
    document.getElementById('notification-view').style.display = 'block';
}

function logout() {
    token = '';
    showHome();
}

async function loginAnonymously() {
    const username = 'anonymous';
    const password = 'hereisthepassword123';

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        token = data.token;
        document.getElementById('username').textContent = username;
        showMain();
        adjustViewForAnonymousUser();
    } else {
        alert('Anonymous login failed');
    }
}

function adjustViewForAnonymousUser() {
    document.getElementById('edit-profile-button').style.display = 'none';
    document.getElementById('view-messages-button').style.display = 'none';
    document.getElementById('logout-button').style.display = 'none';
    document.getElementById('back-button').style.display = 'block';
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        token = data.token;
        document.getElementById('username').textContent = username;
        showMain();
    } else {
        alert('Login failed');
    }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'user' }),
    });

    if (response.ok) {
        alert('Registration successful, please log in');
        showLogin();
    } else {
        alert('Registration failed');
    }
});

document.getElementById('edit-profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('edit-username').value;
    const password = document.getElementById('edit-password').value;

    const response = await fetch('/edit', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        alert('Profile updated');
        showMain();
    } else {
        alert('Failed to update profile');
    }
});

async function sendMessage() {
    const message = document.getElementById('message-input').value;

    const response = await fetch('/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({ message }),
    });

    if (response.ok) {
        if (document.getElementById('username').textContent === 'anonymous') {
            showNotification();
        } else {
            showMessages();
        }
    } else {
        alert('Failed to send message');
    }
}

async function fetchMessages() {
    const response = await fetch('/messages', {
        headers: { 'Authorization': token },
    });

    if (response.ok) {
        const messages = await response.json();
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';
        messages.forEach(message => {
            const li = document.createElement('li');
            li.textContent = `${message.username}: ${message.message} (${message.status})`;
            messagesList.appendChild(li);
        });
    } else {
        alert('Failed to fetch messages');
    }
}

showHome();
