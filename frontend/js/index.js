// Verifica se o usuário está logado
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "login.html";
}

// Mostra nome do usuário
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser) {
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) userNameSpan.textContent = `Olá, ${currentUser.name}`;
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = "login.html";
});

// Função para mostrar seções
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
