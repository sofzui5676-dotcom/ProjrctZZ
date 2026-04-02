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
    
    habits.forEach(habit => {
        if (!habit.completed) habit.completed = {};
    });
    
    renderHabits();
    updateStats();
}

// Сохранение данных
function saveData() {
    if (profile) localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Отображение профиля
function displayProfile() {
    if (!profile) return;
    
    document.getElementById('displayName').textContent = profile.name;
    
    const ageText = profile.age ? `${profile.age} лет` : '';
    const genderMap = { male: 'Мужской', female: 'Женский', other: 'Другой' };
    const genderText = genderMap[profile.gender] || '';
    document.getElementById('displayAgeGender').textContent = [ageText, genderText].filter(Boolean).join(', ');
    
    if (profile.photo) {
        document.getElementById('profileAvatarImg').src = profile.photo;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
    } else {
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('avatarPlaceholder').style.display = 'flex';
    }
}

// Заполнение формы редактирования
function fillEditForm() {
    if (profile) {
        document.getElementById('name').value = profile.name || '';
        document.getElementById('age').value = profile.age || '';
        document.getElementById('gender').value = profile.gender || '';
        
        if (profile.photo) {
            document.getElementById('profileImage').src = profile.photo;
            document.getElementById('profileImage').style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
            document.getElementById('removePhoto').classList.remove('hidden');
        }
    }
}

// Переключение темы
document.getElementById('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    const toggleBtn = document.getElementById('themeToggle');
    toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
});

// Загрузка темы
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
} else {
    document.getElementById('themeToggle').textContent = '🌙';
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

// Редактирование профиля
document.getElementById('editProfileBtn').addEventListener('click', () => {
    fillEditForm();
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('profileEdit').classList.remove('hidden');
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
});

// Сохранение профиля
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
    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
});

// Фото профиля
const photoPreview = document.getElementById('photoPreview');
const photoUpload = document.getElementById('photoUpload');
const profileImage = document.getElementById('profileImage');

photoPreview.addEventListener('click', () => {
    photoUpload.click();
});

photoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profileImage.src = e.target.result;
            profileImage.style.display = 'block';
            document.getElementById('removePhoto').classList.remove('hidden');
            photoPreview.querySelector('span').textContent = 'Фото выбрано';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('removePhoto').addEventListener('click', () => {
    profileImage.src = '';
    profileImage.style.display = 'none';
    photoUpload.value = '';
    document.getElementById('removePhoto').classList.add('hidden');
    photoPreview.querySelector('span').textContent = 'Загрузить фото';
    
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
    
    if (habits.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-light);">Нет привычек. Добавьте первую!</div>';
        return;
    }
    
    list.innerHTML = habits.map(habit => `
        <div class="habit-item" data-id="${habit.id}">
            <div class="habit-info">
                <input type="checkbox" class="habit-checkbox" 
                    ${habit.completed[today] ? 'checked' : ''}
                    onchange="toggleHabit('${habit.id}')">
                <span class="habit-name">${escapeHtml(habit.name)}</span>
            </div>
            <button class="habit-delete" onclick="deleteHabit('${habit.id}')">Удалить</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// Установка дат
const today = new Date().toISOString().split('T')[0];
document.getElementById('selectedDate').value = today;
document.getElementById('statsDate').value = today;

// Статистика
function updateStats() {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    // Недельная статистика
    const weeklyStats = document.getElementById('weeklyStats');
    let weeklyHtml = '<div>';
    last7Days.forEach(date => {
        const completedCount = habits.filter(h => h.completed[date]).length;
        const totalCount = habits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        weeklyHtml += `
            <div class="stat-item">
                <strong>${new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'numeric' })}</strong>
                <div>${completedCount} из ${totalCount}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${percentage}%</span>
            </div>
        `;
    });
    weeklyHtml += '</div>';
    weeklyStats.innerHTML = weeklyHtml;

    // Прогресс привычек
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
                <strong>${escapeHtml(habit.name)}</strong>
                <div>${completedDays} из 7 дней</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span>${percentage}%</span>
            </div>
        `;
    });
    
    habitProgress.innerHTML = progressHtml || '<p style="text-align: center; padding: 20px;">Нет привычек для отслеживания</p>';
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
            <strong>${new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <div>Выполнено: ${completedCount} из ${totalCount}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <span>${percentage}%</span>
        </div>
        <h4>Детали</h4>
        <ul>
    `;
    
    habits.forEach(habit => {
        const status = habit.completed[selectedDate] ? '✓' : '○';
        const statusClass = habit.completed[selectedDate] ? 'style="color: var(--success)"' : '';
        dayHtml += `<li ${statusClass}>${status} ${escapeHtml(habit.name)}</li>`;
    });
    
    dayHtml += '</ul>';
    dayStats.innerHTML = dayHtml;
});

// Инициализация
loadData();