document.addEventListener('DOMContentLoaded', function() {
    let users = JSON.parse(localStorage.getItem('users')) || [
        { username: 'admin', password: 'admin', role: 'admin' },
        { username: 'inspector', password: 'inspector', role: 'inspector' }
    ];

    // Убедимся, что у всех пользователей есть массив fines и balance
    users.forEach(user => {
        if (user.role === 'driver') {
            if (!user.fines) {
                user.fines = [];
            }
            if (user.balance === undefined) {
                user.balance = 0;
            }
            if (user.hourlySalary === undefined) {
                user.hourlySalary = 0;
            }
        }
    });

    const loginButton = document.getElementById('login-button');
    const logoutButtons = document.querySelectorAll('#logout');
    const driverSelect = document.getElementById('driver-select');
    const userSelect = document.getElementById('user-select');
    const fineUserSelect = document.getElementById('fine-user-select');
    const addFineButton = document.getElementById('add-fine');
    const ruleViolationInput = document.getElementById('rule-violation');
    const fineAmountInput = document.getElementById('fine-amount');
    const payFineButton = document.getElementById('pay-fine');
    const balanceElement = document.getElementById('balance');
    const finesList = document.getElementById('fines-list');
    const adminFinesList = document.getElementById('admin-fines-list');
    const addSalaryButton = document.getElementById('add-salary');
    const clearFinesButton = document.getElementById('clear-fines');
    const addDriverButton = document.getElementById('add-driver');
    const driversList = document.getElementById('drivers-list');
    const deleteUserButton = document.getElementById('delete-user-button');
    const salarySuccessMessage = document.getElementById('salary-success-message');
    const fineSuccessMessage = document.getElementById('fine-success-message');

    // Обработчик кнопки "Войти"
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const user = users.find(user => user.username === username && user.password === password);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                switch (user.role) {
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    case 'inspector':
                        window.location.href = 'inspector.html';
                        break;
                    case 'driver':
                        window.location.href = 'driver.html';
                        break;
                    default:
                        alert('Неизвестная роль пользователя');
                }
            } else {
                alert('Неверный логин или пароль');
            }
        });
    }

    // Обработчик кнопки "Выйти"
    if (logoutButtons) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', function() {
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        });
    }

    // Обработчик кнопки "Оплатить штраф"
    if (payFineButton) {
        payFineButton.addEventListener('click', function() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'driver') {
                const user = users.find(user => user.username === currentUser.username);
                if (user && user.fines) {
                    const unpaidFine = user.fines.find(fine => !fine.paid);
                    if (unpaidFine && user.balance >= unpaidFine.fineAmount) {
                        unpaidFine.paid = true;
                        user.balance -= unpaidFine.fineAmount;
                        updateBalance(user.balance);
                        saveData();
                        alert('Штраф успешно оплачен');
                        setTimeout(() => {
                            user.fines = user.fines.filter(fine => !fine.paid);
                            updateFinesList(user.fines);
                            saveData();
                        }, 5000); // Удаление оплаченных штрафов через 5 секунд
                    } else {
                        alert('Недостаточно средств для оплаты штрафа или все штрафы уже оплачены');
                    }
                }
            } else {
                alert('Ошибка: текущий пользователь не найден или не является водителем');
            }
        });
    }

    // Обработчик кнопки "Начислить зарплату"
    if (addSalaryButton) {
        addSalaryButton.addEventListener('click', function() {
            const selectedUserUsername = userSelect.value;
            const salaryAmount = parseFloat(document.getElementById('salary-amount').value);

            if (selectedUserUsername && salaryAmount) {
                const user = users.find(user => user.username === selectedUserUsername);
                if (user) {
                    user.balance = (user.balance || 0) + salaryAmount;
                    localStorage.setItem('users', JSON.stringify(users));
                    updateBalance(user.balance);
                    salarySuccessMessage.style.display = 'block';
                    setTimeout(() => {
                        salarySuccessMessage.style.display = 'none';
                    }, 3000);
                } else {
                    alert('Пользователь не найден');
                }
            } else {
                alert('Введите корректную сумму зарплаты и выберите пользователя');
            }
        });
    }

    // Обработчик кнопки "Очистить штрафы"
    if (clearFinesButton) {
        clearFinesButton.addEventListener('click', function() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser && currentUser.role === 'driver') {
                const user = users.find(user => user.username === currentUser.username);
                user.fines = user.fines.filter(fine => !fine.paid);
                updateFinesList(user.fines);
                saveData();
                alert('Штрафы успешно очищены');
            } else {
                alert('Ошибка: текущий пользователь не найден или не является водителем');
            }
        });
    }

    // Обработчик кнопки "Добавить водителя"
    if (addDriverButton) {
        addDriverButton.addEventListener('click', function() {
            const username = document.getElementById('driver-username').value;
            const password = document.getElementById('driver-password').value;
            const name = document.getElementById('driver-name').value;
            const hourlySalary = parseFloat(document.getElementById('driver-salary').value);

            if (username && password && name && hourlySalary) {
                users.push({ username, password, name, hourlySalary, role: 'driver', fines: [], balance: 0 });
                localStorage.setItem('users', JSON.stringify(users));
                alert('Водитель успешно добавлен');
                updateDriversList();
                populateUserSelect();
                populateFineUserSelect();
            } else {
                alert('Введите все данные для добавления водителя');
            }
        });
    }

    // Обработчик кнопки "Удалить пользователя"
    if (deleteUserButton) {
        deleteUserButton.addEventListener('click', function() {
            const usernameToDelete = document.getElementById('username-to-delete').value;
            const indexToDelete = users.findIndex(user => user.username === usernameToDelete);

            if (indexToDelete !== -1) {
                users.splice(indexToDelete, 1);
                localStorage.setItem('users', JSON.stringify(users));
                alert('Пользователь успешно удален');
                updateDriversList();
                populateUserSelect();
                populateFineUserSelect();
            } else {
                alert('Пользователь с таким логином не найден');
            }
        });
    }

    // Обработчик кнопки "Добавить штраф"
    if (addFineButton) {
        addFineButton.addEventListener('click', function() {
            const selectedDriverUsername = driverSelect.value;
            const ruleViolation = ruleViolationInput.value;
            const fineAmount = parseFloat(fineAmountInput.value);

            if (selectedDriverUsername && ruleViolation && fineAmount) {
                const user = users.find(user => user.username === selectedDriverUsername);
                user.fines.push({ ruleViolation, fineAmount, paid: false });
                saveData();
                updateFinesList(user.fines);
                fineSuccessMessage.style.display = 'block';
                setTimeout(() => {
                    fineSuccessMessage.style.display = 'none';
                }, 3000);
            } else {
                alert('Введите все данные для добавления штрафа');
            }
        });
    }

    // Обновление списка водителей
    function updateDriversList() {
        if (driversList) {
            driversList.innerHTML = '';
            users.filter(user => user.role === 'driver').forEach(driver => {
                const driverElement = document.createElement('li');
                driverElement.textContent = `Логин: ${driver.username}, Имя: ${driver.name}, Ежечасная зарплата: ${driver.hourlySalary}`;
                driversList.appendChild(driverElement);
            });
        }
    }

    // Обновление списка штрафов
    function updateFinesList(fines) {
        if (finesList) {
            finesList.innerHTML = '';
            fines.forEach(fine => {
                const fineElement = document.createElement('li');
                fineElement.textContent = `Нарушение: ${fine.ruleViolation}, Штраф: ${fine.fineAmount}, Оплачен: ${fine.paid ? 'Да' : 'Нет'}`;
                finesList.appendChild(fineElement);
            });
        }
    }

    // Обновление списка штрафов для администратора
    function updateAdminFinesList(fines) {
        if (adminFinesList) {
            adminFinesList.innerHTML = '';
            fines.forEach(fine => {
                const fineElement = document.createElement('li');
                fineElement.textContent = `Нарушение: ${fine.ruleViolation}, Штраф: ${fine.fineAmount}, Оплачен: ${fine.paid ? 'Да' : 'Нет'}`;
                adminFinesList.appendChild(fineElement);
            });
        }
    }

    // Обновление баланса на странице
    function updateBalance(balance) {
        if (balanceElement) {
            balanceElement.textContent = balance;
        }
    }

    // Сохранение данных в localStorage
    function saveData() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Заполнение выпадающего меню пользователями
    function populateUserSelect() {
        if (userSelect) {
            userSelect.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.textContent = user.username;
                option.value = user.username;
                userSelect.appendChild(option);
            });
        }
    }

    // Заполнение выпадающего меню пользователей для просмотра штрафов
    function populateFineUserSelect() {
        if (fineUserSelect) {
            fineUserSelect.innerHTML = '';
            users.filter(user => user.role === 'driver').forEach(driver => {
                const option = document.createElement('option');
                option.textContent = driver.username;
                option.value = driver.username;
                fineUserSelect.appendChild(option);
            });
        }

        fineUserSelect.addEventListener('change', function() {
            const selectedUserUsername = fineUserSelect.value;
            const user = users.find(user => user.username === selectedUserUsername);
            if (user) {
                updateAdminFinesList(user.fines);
            } else {
                adminFinesList.innerHTML = '';
            }
        });
    }

    // Заполнение списка водителей в выпадающем меню для инспектора
    function populateDriverSelect() {
        if (driverSelect) {
            driverSelect.innerHTML = '';
            users.filter(user => user.role === 'driver').forEach(driver => {
                const option = document.createElement('option');
                option.textContent = driver.name;
                option.value = driver.username;
                driverSelect.appendChild(option);
            });
        }
    }

    // Инициализация страницы администратора
    function initAdminPage() {
        updateDriversList();
        populateUserSelect();
        populateFineUserSelect();
    }

    // Инициализация страницы водителя
    function initDriverPage() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const user = users.find(user => user.username === currentUser.username);
            updateBalance(user.balance); // Обновим баланс
            updateFinesList(user.fines);
        }
    }

    // Инициализация страницы инспектора
    function initInspectorPage() {
        populateDriverSelect();
    }

    // Определение текущей страницы и инициализация соответствующих функций
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'admin.html') {
        initAdminPage();
    } else if (currentPage === 'driver.html') {
        initDriverPage();
    } else if (currentPage === 'inspector.html') {
        initInspectorPage();
    }

    // Функция для начисления ежечасной зарплаты
    function payHourlySalary() {
        users.forEach(user => {
            if (user.role === 'driver' && user.hourlySalary > 0) {
                user.balance += user.hourlySalary;
            }
        });
        saveData();
    }

    // Начисление зарплаты каждые 10 минут
    setInterval(payHourlySalary, 600000); // 600000 мс = 10 минут
});
