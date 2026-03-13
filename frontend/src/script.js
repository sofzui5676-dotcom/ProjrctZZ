// Состояние приложения
let profile = null;
let habits = [
    { id: '1', name: 'Сон', completed: {} },
    { id: '2', name: 'Прогулка', completed: {} },
    { id: '3', name: 'Чтение', completed: {} },
    { id: '4', name: 'Медитация', completed: {} },
    { id: '5', name: 'Спорт', completed: {} }
];

// Загрузка данных из localStorage
function loadData() {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
        profile = JSON.parse(savedProfile);
        displayProfile();
    }

    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    }
    
    // Инициализация completed для новых привычек
    habits.forEach(habit => {
        if (!habit.completed) habit.completed = {};
    });
    
    renderHabits();
    updateStats();
}

// Сохранение данных в localStorage
function saveData() {
    if (profile) localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Переключение темы
document.getElementById('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
});

// Загрузка темы
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Переключение вкладок
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Профиль
document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    profile = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        photo: document.getElementById('profileImage').src || null
    };
    saveData();
    displayProfile();
    alert('Профиль сохранен!');
});

function displayProfile() {
    if (!profile) return;
    
    document.getElementById('displayName').textContent = profile.name;
    document.getElementById('displayAge').textContent = profile.age;
    
    const genderText = { male: 'Мужской', female: 'Женский', other: 'Другой' };
    document.getElementById('displayGender').textContent = genderText[profile.gender];
    
    if (profile.photo) {
        document.getElementById('displayPhoto').src = profile.photo;
        document.getElementById('displayPhoto').style.display = 'block';
    }
    
    document.getElementById('profileDisplay').classList.remove('hidden');
}

// Фото профиля
document.getElementById('photoUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profileImage').src = e.target.result;
            document.getElementById('profileImage').style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
            
            if (profile) {
                profile.photo = e.target.result;
                displayProfile();
                saveData();
            }
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removePhoto').addEventListener('click', () => {
    document.getElementById('profileImage').src = '';
    document.getElementById('profileImage').style.display = 'none';
    document.getElementById('photoPlaceholder').style.display = 'flex';
    document.getElementById('photoUpload').value = '';
    
    if (profile) {
        profile.photo = null;
        displayProfile();
        saveData();
    }
});

// Привычки
function renderHabits() {
    const list = document.getElementById('habitsList');
    const today = new Date().toISOString().split('T')[0];
    
    list.innerHTML = habits.map(habit => `
        <div class="habit-item" data-id="${habit.id}">
            <div class="habit-info">
                <input type="checkbox" class="habit-checkbox" 
                    ${habit.completed[today] ? 'checked' : ''}
                    onchange="toggleHabit('${habit.id}')">
                <span class="habit-name">${habit.name}</span>
            </div>
            <button class="habit-delete" onclick="deleteHabit('${habit.id}')">Удалить</button>
        </div>
    `).join('');
}

window.toggleHabit = (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    
    if (habit.completed[today]) {
        delete habit.completed[today];
    } else {
        habit.completed[today] = true;
    }
    
    saveData();
    renderHabits();
    updateStats();
};

window.deleteHabit = (habitId) => {
    if (confirm('Удалить привычку?')) {
        habits = habits.filter(h => h.id !== habitId);
        saveData();
        renderHabits();
        updateStats();
    }
};

document.getElementById('addHabit').addEventListener('click', () => {
    const nameInput = document.getElementById('newHabitName');
    const name = nameInput.value.trim();
    
    if (name) {
        const newHabit = {
            id: Date.now().toString(),
            name: name,
            completed: {}
        };
        habits.push(newHabit);
        saveData();
        renderHabits();
        updateStats();
        nameInput.value = '';
    }
});

// Установка сегодняшней даты по умолчанию
document.getElementById('selectedDate').valueAsDate = new Date();
document.getElementById('statsDate').valueAsDate = new Date();

// Статистика
function updateStats() {
    // Статистика за 7 дней
    const weeklyStats = document.getElementById('weeklyStats');
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    let weeklyHtml = '<ul>';
    last7Days.forEach(date => {
        const completedCount = habits.filter(h => h.completed[date]).length;
        const totalCount = habits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        weeklyHtml += `
            <li>
                <strong>${new Date(date).toLocaleDateString('ru-RU')}:</strong> 
                ${completedCount}/${totalCount} (${percentage}%)
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </li>
        `;
    });
    weeklyHtml += '</ul>';
    weeklyStats.innerHTML = weeklyHtml;

    // Прогресс привычек за 7 дней
    const habitProgress = document.getElementById('habitProgress');
    let progressHtml = '';
    
    habits.forEach(habit => {
        let completedDays = 0;
        last7Days.forEach(date => {
            if (habit.completed[date]) completedDays++;
        });
        const percentage = Math.round((completedDays / 7) * 100);
        
        progressHtml += `
            <div class="habit-progress">
                <strong>${habit.name}</strong>
                <div>Выполнено ${completedDays} из 7 дней (${percentage}%)</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    
    habitProgress.innerHTML = progressHtml || '<p>Нет привычек для отслеживания</p>';
    
    // Визуализация прогресса
    visualizeProgress(last7Days);
}

// Статистика за выбранный день
document.getElementById('showDayStats').addEventListener('click', () => {
    const selectedDate = document.getElementById('statsDate').value;
    if (!selectedDate) return;
    
    const dayStats = document.getElementById('dayStats');
    const completedCount = habits.filter(h => h.completed[selectedDate]).length;
    const totalCount = habits.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    let dayHtml = `
        <div class="stat-item">
            <strong>${new Date(selectedDate).toLocaleDateString('ru-RU')}</strong>
            <p>Выполнено привычек: ${completedCount}/${totalCount}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${percentage}%</span>
        </div>
        <h4>Детали:</h4>
        <ul>
    `;
    
    habits.forEach(habit => {
        const status = habit.completed[selectedDate] ? '✅' : '❌';
        dayHtml += `<li>${status} ${habit.name}</li>`;
    });
    
    dayHtml += '</ul>';
    dayStats.innerHTML = dayHtml;
});

// Визуализация прогресса
function visualizeProgress(last7Days) {
    const chart = document.getElementById('progressChart');
    
    let chartHtml = '<h4>Ежедневный прогресс</h4>';
    
    last7Days.forEach(date => {
        const completedCount = habits.filter(h => h.completed[date]).length;
        const totalCount = habits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        chartHtml += `
            <div class="stat-item">
                <strong>${new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' })}</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${percentage}%</span>
            </div>
        `;
    });
    
    chart.innerHTML = chartHtml;
}

// Инициализация
loadData();
