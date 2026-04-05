// Состояние приложения
let profile = null;
let habits = [];
let goals = [];
let moodEntries = [];
let currentPeriod = 'week';
let selectedMood = null;
let currentViewDate = new Date();

// Загрузка данных
function loadData() {
    const savedProfile = localStorage.getItem('habitflow_profile');
    if (savedProfile) {
        profile = JSON.parse(savedProfile);
        displayProfile();
    }
    
    const savedHabits = localStorage.getItem('habitflow_habits');
    if (savedHabits) {
        habits = JSON.parse(savedHabits);
    } else {
        habits = [
            { id: '1', name: 'Медитация', completed: {}, streak: 0 },
            { id: '2', name: 'Чтение', completed: {}, streak: 0 },
            { id: '3', name: 'Спорт', completed: {}, streak: 0 }
        ];
    }
    
    const savedGoals = localStorage.getItem('habitflow_goals');
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    } else {
        goals = [
            { id: '1', name: 'Выучить новый язык', completed: false },
            { id: '2', name: 'Прочитать 10 книг', completed: false }
        ];
    }
    
    const savedMoods = localStorage.getItem('habitflow_moods');
    if (savedMoods) {
        moodEntries = JSON.parse(savedMoods);
    } else {
        moodEntries = [];
    }
    
    habits.forEach(habit => {
        if (!habit.completed) habit.completed = {};
        if (!habit.streak) habit.streak = 0;
    });
    
    renderHabits();
    renderGoals();
    renderMoodCalendar();
    updateStats();
    updateMiniStats();
    updateMoodStats();
}

// Сохранение данных
function saveData() {
    if (profile) localStorage.setItem('habitflow_profile', JSON.stringify(profile));
    localStorage.setItem('habitflow_habits', JSON.stringify(habits));
    localStorage.setItem('habitflow_goals', JSON.stringify(goals));
    localStorage.setItem('habitflow_moods', JSON.stringify(moodEntries));
}

// Отображение профиля
function displayProfile() {
    if (!profile) return;
    
    document.getElementById('displayName').textContent = profile.name || 'Создайте профиль';
    
    const ageText = profile.age ? `${profile.age} лет` : '';
    const genderMap = { male: 'Мужской', female: 'Женский' };
    const genderText = genderMap[profile.gender] || '';
    document.getElementById('displayAgeGender').textContent = [ageText, genderText].filter(Boolean).join(', ');
    
    if (profile.joinDate) {
        document.getElementById('displayJoinDate').textContent = `с ${new Date(profile.joinDate).toLocaleDateString('ru-RU')}`;
    } else if (!profile.joinDate && profile.name) {
        profile.joinDate = new Date().toISOString();
        saveData();
        document.getElementById('displayJoinDate').textContent = `с ${new Date().toLocaleDateString('ru-RU')}`;
    }
    
    if (profile.photo) {
        document.getElementById('profileAvatarImg').src = profile.photo;
        document.getElementById('profileAvatarImg').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
    }
}

// Календарь настроения - компактная версия
function renderMoodCalendar() {
    const calendar = document.getElementById('moodCalendar');
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let calendarHtml = '<div class="calendar-weekdays">';
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    weekdays.forEach(day => {
        calendarHtml += `<div class="weekday">${day}</div>`;
    });
    calendarHtml += '</div><div class="mood-calendar">';
    
    // Пустые ячейки для начала месяца
    let startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < startOffset; i++) {
        calendarHtml += '<div class="calendar-day empty"></div>';
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const moodEntry = moodEntries.find(m => m.date === dateStr);
        const moodEmoji = getMoodEmoji(moodEntry?.mood);
        
        calendarHtml += `
            <div class="calendar-day ${moodEntry ? 'has-mood' : ''}" data-date="${dateStr}" onclick="viewMoodEntry('${dateStr}')">
                <span class="day-number">${day}</span>
                ${moodEmoji ? `<span class="day-emoji">${moodEmoji}</span>` : ''}
            </div>
        `;
    }
    
    calendarHtml += '</div>';
    
    // Навигация по месяцам - компактная
    calendarHtml += `
        <div class="month-nav">
            <button onclick="changeMonth(-1)">←</button>
            <span>${getMonthName(month)} ${year}</span>
            <button onclick="changeMonth(1)">→</button>
        </div>
    `;
    
    calendar.innerHTML = calendarHtml;
}

function getMonthName(month) {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    if (month < 0) return months[11];
    if (month > 11) return months[0];
    return months[month];
}

function changeMonth(delta) {
    currentViewDate.setMonth(currentViewDate.getMonth() + delta);
    renderMoodCalendar();
}

function getMoodEmoji(mood) {
    const emojis = {
        great: '😊',
        good: '🙂',
        neutral: '😐',
        bad: '😕',
        terrible: '😢'
    };
    return emojis[mood] || '';
}

function getMoodName(mood) {
    const names = {
        great: 'Отлично',
        good: 'Хорошо',
        neutral: 'Нормально',
        bad: 'Плохо',
        terrible: 'Ужасно'
    };
    return names[mood] || '';
}

// Модальное окно для добавления настроения
const modal = document.getElementById('moodModal');
let editingDate = null;

document.getElementById('addMoodBtn').addEventListener('click', () => {
    editingDate = null;
    document.getElementById('moodDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('moodNote').value = '';
    document.querySelectorAll('.mood-emoji').forEach(btn => btn.classList.remove('selected'));
    selectedMood = null;
    modal.classList.remove('hidden');
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.viewMoodEntry = (dateStr) => {
    editingDate = dateStr;
    const entry = moodEntries.find(m => m.date === dateStr);
    
    document.getElementById('moodDate').value = dateStr;
    document.getElementById('moodNote').value = entry?.note || '';
    
    document.querySelectorAll('.mood-emoji').forEach(btn => btn.classList.remove('selected'));
    if (entry?.mood) {
        document.querySelector(`.mood-emoji[data-mood="${entry.mood}"]`).classList.add('selected');
        selectedMood = entry.mood;
    } else {
        selectedMood = null;
    }
    
    modal.classList.remove('hidden');
};

// Выбор смайлика настроения
document.querySelectorAll('.mood-emoji').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-emoji').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.dataset.mood;
    });
});

document.getElementById('saveMoodBtn').addEventListener('click', () => {
    const date = document.getElementById('moodDate').value;
    const note = document.getElementById('moodNote').value;
    
    if (!selectedMood) {
        alert('Пожалуйста, выберите настроение');
        return;
    }
    
    const existingIndex = moodEntries.findIndex(m => m.date === date);
    const moodEntry = {
        date: date,
        mood: selectedMood,
        note: note,
        updatedAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
        moodEntries[existingIndex] = moodEntry;
    } else {
        moodEntries.push(moodEntry);
    }
    
    saveData();
    renderMoodCalendar();
    updateMoodStats();
    modal.classList.add('hidden');
    showNotification('Настроение сохранено!');
});

// Уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent);
        color: white;
        padding: 10px 20px;
        border-radius: 40px;
        font-size: 13px;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Статистика настроения
function updateMoodStats() {
    const moodStatsContainer = document.getElementById('moodStats');
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
    }
    
    const moodCounts = {
        great: 0,
        good: 0,
        neutral: 0,
        bad: 0,
        terrible: 0
    };
    
    last30Days.forEach(date => {
        const entry = moodEntries.find(m => m.date === date);
        if (entry && moodCounts[entry.mood] !== undefined) {
            moodCounts[entry.mood]++;
        }
    });
    
    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    
    const moodStatsHtml = `
        <div class="mood-stats-grid">
            <div class="mood-stat-card">
                <span class="mood-stat-emoji">😊</span>
                <span class="mood-stat-count">${moodCounts.great}</span>
                <span class="mood-stat-label">Отлично</span>
            </div>
            <div class="mood-stat-card">
                <span class="mood-stat-emoji">🙂</span>
                <span class="mood-stat-count">${moodCounts.good}</span>
                <span class="mood-stat-label">Хорошо</span>
            </div>
            <div class="mood-stat-card">
                <span class="mood-stat-emoji">😐</span>
                <span class="mood-stat-count">${moodCounts.neutral}</span>
                <span class="mood-stat-label">Нормально</span>
            </div>
            <div class="mood-stat-card">
                <span class="mood-stat-emoji">😕</span>
                <span class="mood-stat-count">${moodCounts.bad}</span>
                <span class="mood-stat-label">Плохо</span>
            </div>
            <div class="mood-stat-card">
                <span class="mood-stat-emoji">😢</span>
                <span class="mood-stat-count">${moodCounts.terrible}</span>
                <span class="mood-stat-label">Ужасно</span>
            </div>
        </div>
        <div style="margin-top: 12px; text-align: center; font-size: 12px; color: var(--text-secondary);">
            📝 Заполнено: ${total} из 30 дней
        </div>
    `;
    
    moodStatsContainer.innerHTML = moodStatsHtml;
}

// Остальные функции
function updateMiniStats() {
    document.getElementById('totalHabits').textContent = habits.length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = habits.filter(h => h.completed[today]).length;
    const total = habits.length;
    const rate = total > 0 ? Math.round((todayCompleted / total) * 100) : 0;
    document.getElementById('completionRate').textContent = `${rate}%`;
    
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 30; i++) {
        const date = checkDate.toISOString().split('T')[0];
        const completed = habits.filter(h => h.completed[date]).length;
        if (completed > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    document.getElementById('currentStreak').textContent = streak;
}

function renderHabits() {
    const list = document.getElementById('habitsList');
    const today = new Date().toISOString().split('T')[0];
    
    if (habits.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-light);">Добавьте первую привычку</div>';
        return;
    }
    
    list.innerHTML = habits.map(habit => {
        const isCompleted = habit.completed[today];
        const streak = habit.streak || 0;
        return `
            <div class="habit-item" data-id="${habit.id}">
                <div class="habit-info">
                    <input type="checkbox" class="habit-checkbox" 
                        ${isCompleted ? 'checked' : ''}
                        onchange="toggleHabit('${habit.id}')">
                    <span class="habit-name">${escapeHtml(habit.name)}</span>
                    ${streak > 0 ? `<span class="habit-streak">🔥 ${streak}</span>` : ''}
                </div>
                <button class="habit-delete" onclick="deleteHabit('${habit.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
    
    updateDailyProgress();
}

function updateDailyProgress() {
    const today = new Date().toISOString().split('T')[0];
    const completed = habits.filter(h => h.completed[today]).length;
    const total = habits.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    const fill = document.getElementById('dailyProgressFill');
    if (fill) fill.style.width = `${percentage}%`;
    const text = document.getElementById('dailyProgressText');
    if (text) text.textContent = `${completed}/${total}`;
}

window.toggleHabit = (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const habit = habits.find(h => h.id === habitId);
    
    if (habit.completed[today]) {
        delete habit.completed[today];
    } else {
        habit.completed[today] = true;
        
        let streak = 0;
        const checkDate = new Date();
        for (let i = 0; i < 30; i++) {
            const date = checkDate.toISOString().split('T')[0];
            if (habit.completed[date]) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        habit.streak = streak;
    }
    
    saveData();
    renderHabits();
    updateStats();
    updateMiniStats();
};

window.deleteHabit = (habitId) => {
    if (confirm('Удалить привычку?')) {
        habits = habits.filter(h => h.id !== habitId);
        saveData();
        renderHabits();
        updateStats();
        updateMiniStats();
    }
};

function renderGoals() {
    const list = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-light);">Добавьте первую цель</div>';
        return;
    }
    
    list.innerHTML = goals.map(goal => `
        <div class="goal-item">
            <div class="goal-info">
                <input type="checkbox" class="goal-checkbox" 
                    ${goal.completed ? 'checked' : ''}
                    onchange="toggleGoal('${goal.id}')">
                <span class="goal-name ${goal.completed ? 'completed' : ''}">${escapeHtml(goal.name)}</span>
            </div>
            <button class="goal-delete" onclick="deleteGoal('${goal.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}

window.toggleGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
        goal.completed = !goal.completed;
        saveData();
        renderGoals();
    }
};

window.deleteGoal = (goalId) => {
    if (confirm('Удалить цель?')) {
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        renderGoals();
    }
};

function updateStats() {
    const today = new Date();
    const days = currentPeriod === 'week' ? 7 : 30;
    const lastDays = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        lastDays.push(date.toISOString().split('T')[0]);
    }
    
    const weeklyStats = document.getElementById('weeklyStats');
    let weeklyHtml = '';
    
    lastDays.forEach(date => {
        const completedCount = habits.filter(h => h.completed[date]).length;
        const totalCount = habits.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        weeklyHtml += `
            <div class="stat-item">
                <strong>${new Date(date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })}</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span style="font-size: 11px;">${percentage}%</span>
            </div>
        `;
    });
    
    weeklyStats.innerHTML = weeklyHtml || '<p>Нет данных</p>';
    
    const topHabits = document.getElementById('topHabits');
    const habitStats = habits.map(habit => {
        let completed = 0;
        lastDays.forEach(date => {
            if (habit.completed[date]) completed++;
        });
        return { name: habit.name, completed, total: days, percentage: (completed / days) * 100 };
    });
    habitStats.sort((a, b) => b.percentage - a.percentage);
    
    topHabits.innerHTML = habitStats.slice(0, 3).map(h => `
        <div class="stat-item">
            <strong>${escapeHtml(h.name)}</strong>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${h.percentage}%"></div>
            </div>
            <span>${Math.round(h.percentage)}%</span>
        </div>
    `).join('');
}

// Переключение темы
document.getElementById('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeToggle').innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('habitflow_theme', newTheme);
});

const savedTheme = localStorage.getItem('habitflow_theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('themeToggle').innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
} else {
    document.getElementById('themeToggle').innerHTML = '🌙';
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

// Статистика фильтры
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = btn.dataset.period;
        updateStats();
    });
});

// Редактирование профиля
document.getElementById('editProfileBtn').addEventListener('click', () => {
    if (profile) {
        document.getElementById('name').value = profile.name || '';
        document.getElementById('age').value = profile.age || '';
        document.getElementById('gender').value = profile.gender || '';
        document.getElementById('bio').value = profile.bio || '';
    }
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('profileEdit').classList.remove('hidden');
});

document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
});

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    profile = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        bio: document.getElementById('bio').value,
        joinDate: profile?.joinDate || new Date().toISOString()
    };
    saveData();
    displayProfile();
    document.getElementById('profileView').classList.remove('hidden');
    document.getElementById('profileEdit').classList.add('hidden');
    showNotification('Профиль сохранен!');
});

// Добавление привычки
document.getElementById('addHabit').addEventListener('click', () => {
    const nameInput = document.getElementById('newHabitName');
    const name = nameInput.value.trim();
    if (name) {
        habits.push({
            id: Date.now().toString(),
            name: name,
            completed: {},
            streak: 0
        });
        saveData();
        renderHabits();
        updateStats();
        updateMiniStats();
        nameInput.value = '';
        showNotification('Привычка добавлена!');
    }
});

// Добавление цели
document.getElementById('addGoal').addEventListener('click', () => {
    const nameInput = document.getElementById('newGoalName');
    const name = nameInput.value.trim();
    if (name) {
        goals.push({
            id: Date.now().toString(),
            name: name,
            completed: false
        });
        saveData();
        renderGoals();
        nameInput.value = '';
        showNotification('Цель добавлена!');
    }
});

// Enter key handlers
document.getElementById('newHabitName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('addHabit').click();
});
document.getElementById('newGoalName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('addGoal').click();
});

// Установка дат
document.getElementById('selectedDate').valueAsDate = new Date();

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Закрытие модального окна по клику вне его
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Инициализация
loadData();
