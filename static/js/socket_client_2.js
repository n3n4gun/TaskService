const io = require("socket.io-client")

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function printSeparator(char = '=', length = 80) {
    console.log('\n' + char.repeat(length) + '\n');
}

function printHeader(title, char = '=') {
    console.log('\n' + char.repeat(10) + ' ' + title + ' ' + char.repeat(10));
}

function printSuccess(message) {
    console.log(`✅ ${message}`);
}

function printError(message) {
    console.log(`❌ ${message}`);
}

function printInfo(message) {
    console.log(`📌 ${message}`);
}

function printData(label, data) {
    console.log(`${label}:`);
    console.log(JSON.stringify(data, null, 2));
}

const socket = io('http://127.0.0.1:8888', {
    auth: {
        login: "fp.naboyshchikov"
    }
});

const line = '\n' + '─'.repeat(70) + '\n';
const doubleLine = '\n' + '═'.repeat(70) + '\n';
const dottedLine = '\n' + '⋅'.repeat(70) + '\n';

function printHeaderWithIcon(title, icon = '📌') {
    console.log(doubleLine);
    console.log(`${icon} ${title}`);
    console.log(line);
}

function printFooter() {
    console.log(doubleLine);
}

socket.on("user_connection", (data) => {
    printHeaderWithIcon('ПОДКЛЮЧЕНИЕ К СЕРВЕРУ', '🔌');
    console.log("Полученные данные при подключении:");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.user_tasks !== undefined) {
        console.log(`\n👤 Пользователь: fp.naboyshchikov`);
        console.log(`📋 Количество задач пользователя: ${data.user_tasks?.length || 0}`);
    }
    
    if (data.active_tasks && data.active_tasks.active_tasks) {
        const taskCount = Object.keys(data.active_tasks.active_tasks).length;
        console.log(`📊 Доступно задач: ${taskCount}`);
    }
    
    printFooter();
});

socket.on("connect", () => {
    printHeaderWithIcon('СОЕДИНЕНИЕ УСТАНОВЛЕНО', '✅');
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Пользователь: fp.naboyshchikov`);
    console.log(`   Сервер: http://127.0.0.1:8888`);
    console.log(`   Статус: Активен`);
    printFooter();
});

socket.on("connect_error", (err) => {
    printHeaderWithIcon('ОШИБКА ПОДКЛЮЧЕНИЯ', '❌');
    console.log(`   Сообщение: ${err.message}`);
    console.log(`   Пользователь: fp.naboyshchikov`);
    console.log(`   Время: ${new Date().toLocaleTimeString()}`);
    printFooter();
});

socket.on("disconnect", () => {
    printHeaderWithIcon('СОЕДИНЕНИЕ РАЗОРВАНО', '🔌');
    console.log(`   Пользователь: fp.naboyshchikov`);
    console.log(`   Время: ${new Date().toLocaleTimeString()}`);
    printFooter();
});

// === НОВЫЙ ОБРАБОТЧИК ДЛЯ ОБНОВЛЕНИЯ СОСТОЯНИЯ ЗАДАЧ ===
socket.on("tasks_states_update", (response) => {
    printSeparator('🔄');
    printHeader('ОБНОВЛЕНИЕ СОСТОЯНИЯ ЗАДАЧ', '🔄');
    
    console.log(`📢 Получено обновление от сервера!`);
    console.log(`⏰ Время обновления: ${new Date().toLocaleTimeString()}`);
    console.log(`👤 Получено пользователем: fp.naboyshchikov`);
    
    const taskObject = response.active_tasks || response;
    const taskCount = Object.keys(taskObject).length;
    
    console.log(`📊 Всего задач в системе: ${taskCount}`);
    
    if (taskCount > 0) {
        console.log('\n📋 ТЕКУЩЕЕ СОСТОЯНИЕ ЗАДАЧ:');
        console.log(dottedLine);
        
        // Находим задачи, которые были приняты (имеют исполнителя)
        const takenTasks = Object.entries(taskObject).filter(([_, task]) => 
            task.task_state === 'accepted' && task.executor_id
        );
        
        if (takenTasks.length > 0) {
            console.log('\n🔧 ЗАДАЧИ В РАБОТЕ:');
            takenTasks.forEach(([id, task], idx) => {
                console.log(`   ${idx + 1}. 📌 ${task.task_name}`);
                console.log(`      👤 Исполнитель: ${task.executor_id}`);
                console.log(`      🆔 ID: ${id.substring(0, 8)}...`);
            });
        }
        
        console.log('\n📋 ПОЛНЫЙ СПИСОК ЗАДАЧ:');
        Object.entries(taskObject).forEach(([id, task], index) => {
            const statusIcon = task.task_state === 'accepted' ? '✓' : '○';
            const statusText = task.task_state === 'accepted' ? 'В работе' : 'Ожидает';
            const executorInfo = task.executor_id || 'не назначен';
            
            console.log(`\n${index + 1}. 📌 ${task.task_name}`);
            console.log(`   🆔 ID: ${id.substring(0, 8)}...${id.substring(id.length - 4)}`);
            console.log(`   📝 Описание: ${task.task_description}`);
            console.log(`   🔄 Статус: ${statusIcon} ${statusText}`);
            console.log(`   👤 Исполнитель: ${executorInfo}`);
            
            if (index < taskCount - 1) {
                console.log(dottedLine);
            }
        });
        
        console.log('\n' + dottedLine);
        
        // Статистика
        const acceptedCount = Object.values(taskObject).filter(t => t.task_state === 'accepted').length;
        const notAcceptedCount = taskCount - acceptedCount;
        
        console.log(`📊 СТАТИСТИКА:`);
        console.log(`   ✓ В работе: ${acceptedCount}`);
        console.log(`   ○ Ожидают: ${notAcceptedCount}`);
        
        if (acceptedCount > 0) {
            console.log(`\n💡 Совет: Чтобы увидеть свои задачи, используйте команду showAllTasks()`);
        }
    } else {
        console.log('\n   📭 Нет активных задач в системе');
    }
    
    printFooter();
    printSeparator('🔄');
});

socket.on("new_task", (response) => {
    printHeaderWithIcon('ОБНОВЛЕНИЕ СПИСКА ЗАДАЧ', '📦');
    
    const taskObject = response.active_tasks || response;
    const taskCount = Object.keys(taskObject).length;
    
    console.log(`✅ Получен обновленный список задач`);
    console.log(`📊 Всего активных задач: ${taskCount}`);
    
    if (taskCount > 0) {
        console.log('\n📋 Детальный список задач:');
        console.log(dottedLine);
        
        Object.entries(taskObject).forEach(([id, task], index) => {
            console.log(`\n${index + 1}. 📌 ${task.task_name}`);
            console.log(`   🆔 ID: ${id.substring(0, 8)}...${id.substring(id.length - 4)}`);
            console.log(`   📝 Описание: ${task.task_description}`);
            
            const statusIcon = task.task_state === 'accepted' ? '✓' : '○';
            const statusText = task.task_state === 'accepted' ? 'В работе' : 'Ожидает';
            console.log(`   🔄 Статус: ${statusIcon} ${statusText}`);
            
            const executorInfo = task.executor_id || 'не назначен';
            console.log(`   👤 Исполнитель: ${executorInfo}`);
            
            if (index < taskCount - 1) {
                console.log(dottedLine);
            }
        });
        
        console.log('\n' + dottedLine);
        console.log(`📈 ИТОГО: ${taskCount} активных задач`);
    } else {
        console.log('\n   📭 Нет активных задач в системе');
    }
    
    printFooter();
});

function createTask(taskName, taskDescription) {
    printHeaderWithIcon('СОЗДАНИЕ НОВОЙ ЗАДАЧИ', '📝');
    console.log(`   👤 Пользователь: fp.naboyshchikov`);
    console.log(`   📌 Название: ${taskName}`);
    console.log(`   📝 Описание: ${taskDescription}`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    const taskData = {
        name: taskName,
        description: taskDescription
    };
    
    socket.emit("create_task", taskData);
    console.log(`✅ Запрос успешно отправлен!`);
    console.log(`⏰ Время отправки: ${new Date().toLocaleTimeString()}`);
    printFooter();
}

function takeTask(taskId) {
    printHeaderWithIcon('ПРИНЯТИЕ ЗАДАЧИ В РАБОТУ', '🔧');
    console.log(`   👤 Пользователь: fp.naboyshchikov`);
    console.log(`   🆔 ID задачи: ${taskId}`);
    console.log(`   📋 Действие: Принять в работу`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    socket.emit("take_task", {
        task_id: taskId
    });
    
    console.log(`✅ Запрос успешно отправлен!`);
    console.log(`⏰ Время отправки: ${new Date().toLocaleTimeString()}`);
    printFooter();
}

socket.on("take_new_task", (userTasks) => {
    printSeparator('+');
    printHeader('ЗАДАЧА ПРИНЯТА В РАБОТУ', '+');
    
    console.log('\n🔍 ОТЛАДКА: Полученные данные от сервера:');
    console.log('Тип данных:', Array.isArray(userTasks) ? 'Array' : typeof userTasks);
    console.log('Содержимое:', JSON.stringify(userTasks, null, 2));
    console.log('');
    
    let tasksArray = [];
    let taskCount = 0;
    
    if (Array.isArray(userTasks)) {
        tasksArray = userTasks;
        taskCount = tasksArray.length;
        printInfo(`Получен массив из ${taskCount} задач(и)`);
    } 
    else if (typeof userTasks === 'object' && userTasks !== null) {
        tasksArray = Object.values(userTasks);
        taskCount = tasksArray.length;
        printInfo(`Получен объект с ${taskCount} задачами(и)`);
    }
    else {
        printError(`Неизвестный формат данных: ${typeof userTasks}`);
        printSeparator('+');
        return;
    }
    
    if (taskCount > 0) {
        printSuccess(`✅ Задача успешно принята!`);
        printInfo(`📊 Всего задач в работе: ${taskCount}`);
        
        console.log('\n📋 Мои задачи:');
        console.log('─'.repeat(50));
        
        tasksArray.forEach((task, index) => {
            const taskId = task.task_id || task.id || `task_${index}`;
            const taskName = task.task_name || task.name || task.title || `Задача ${index + 1}`;
            const taskDescription = task.task_description || task.description || 'Нет описания';
            const taskState = task.task_state || task.state || 'not_accepted';
            const executorId = task.executor_id || task.executor || 'не назначен';
            
            console.log(`\n  ${index + 1}. 📌 ${taskName}`);
            console.log(`     🆔 ID: ${taskId}`);
            console.log(`     📝 Описание: ${taskDescription}`);
            console.log(`     🔄 Статус: ${taskState === 'accepted' ? '✓ В работе' : '○ Ожидает'}`);
            console.log(`     👤 Исполнитель: ${executorId}`);
        });
        
        console.log('\n' + '─'.repeat(50));
        console.log(`📈 ИТОГО: ${taskCount} задач в работе`);
    } else {
        printInfo(`📭 Нет задач в работе`);
    }
    
    printSeparator('+');
});

// Обработчик получения обновленного списка после возврата задачи
socket.on("user_return_task", (response) => {
    printSeparator('↩️');
    printHeader('ЗАДАЧА ВОЗВРАЩЕНА', '↩️');
    
    console.log(`📢 Задача возвращена в общий пул!`);
    console.log(`⏰ Время обновления: ${new Date().toLocaleTimeString()}`);
    console.log(`👤 Получено пользователем: fp.naboyshchikov`);
    
    const taskObject = response.active_tasks || response;
    const taskCount = Object.keys(taskObject).length;
    
    console.log(`📊 Всего задач в системе: ${taskCount}`);
    
    if (taskCount > 0) {
        console.log('\n📋 ОБНОВЛЕННЫЙ СПИСОК ЗАДАЧ:');
        console.log(dottedLine);
        
        // Находим задачи, которые были возвращены (исполнитель null)
        const returnedTasks = Object.entries(taskObject).filter(([_, task]) => 
            task.task_state !== 'accepted' && !task.executor_id
        );
        
        if (returnedTasks.length > 0) {
            console.log('\n🔄 ДОСТУПНЫЕ ДЛЯ ВЗЯТИЯ ЗАДАЧИ:');
            returnedTasks.forEach(([id, task], idx) => {
                console.log(`   ${idx + 1}. 📌 ${task.task_name}`);
                console.log(`      🆔 ID: ${id.substring(0, 8)}...`);
                console.log(`      📝 Описание: ${task.task_description.substring(0, 50)}...`);
            });
        }
        
        console.log('\n📋 ПОЛНЫЙ СПИСОК ЗАДАЧ:');
        Object.entries(taskObject).forEach(([id, task], index) => {
            const statusIcon = task.task_state === 'accepted' ? '✓' : '○';
            const statusText = task.task_state === 'accepted' ? 'В работе' : 'Ожидает';
            const executorInfo = task.executor_id || 'не назначен';
            
            // Подсвечиваем возвращенные задачи
            const isReturned = !task.executor_id && task.task_state !== 'accepted';
            const returnedIndicator = isReturned ? ' 🔄 ВОЗВРАЩЕНА' : '';
            
            console.log(`\n${index + 1}. 📌 ${task.task_name}${returnedIndicator}`);
            console.log(`   🆔 ID: ${id.substring(0, 8)}...${id.substring(id.length - 4)}`);
            console.log(`   📝 Описание: ${task.task_description}`);
            console.log(`   🔄 Статус: ${statusIcon} ${statusText}`);
            console.log(`   👤 Исполнитель: ${executorInfo}`);
            
            if (index < taskCount - 1) {
                console.log(dottedLine);
            }
        });
        
        console.log('\n' + dottedLine);
        
        // Статистика
        const acceptedCount = Object.values(taskObject).filter(t => t.task_state === 'accepted').length;
        const notAcceptedCount = taskCount - acceptedCount;
        
        console.log(`📊 СТАТИСТИКА:`);
        console.log(`   ✓ В работе: ${acceptedCount}`);
        console.log(`   ○ Ожидают: ${notAcceptedCount}`);
        
        if (notAcceptedCount > 0) {
            console.log(`\n💡 Чтобы взять задачу: takeTask("ID_ЗАДАЧИ")`);
        }
    } else {
        console.log('\n   📭 Нет активных задач в системе');
    }
    
    printFooter();
    printSeparator('↩️');
});

function showAllTasks() {
    printHeaderWithIcon('ЗАПРОС ВСЕХ ЗАДАЧ', '🔍');
    console.log(`👤 Пользователь: fp.naboyshchikov`);
    console.log(`⏳ Запрос списка всех задач...`);
    socket.emit("get_all_tasks");
    printFooter();
}

function completeTask(taskId) {
    printHeaderWithIcon('ЗАВЕРШЕНИЕ ЗАДАЧИ', '🎯');
    console.log(`   👤 Пользователь: fp.naboyshchikov`);
    console.log(`   🆔 ID задачи: ${taskId}`);
    console.log(`   📋 Действие: Завершить задачу`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    socket.emit("complete_task", { task_id: taskId });
    
    console.log(`✅ Запрос успешно отправлен!`);
    printFooter();
}

function completeTask(taskId) {
    printHeaderWithIcon('ЗАВЕРШЕНИЕ ЗАДАЧИ', '🎯');
    console.log(`   👤 Пользователь: fp.naboyshchikov`);
    console.log(`   🆔 ID задачи: ${taskId}`);
    console.log(`   📋 Действие: Завершить задачу`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    socket.emit("complete_task", { task_id: taskId });
    
    console.log(`✅ Запрос на завершение задачи отправлен!`);
    console.log(`⏰ Время отправки: ${new Date().toLocaleTimeString()}`);
    console.log(`💡 Ожидайте обновление списка задач через событие "tasks_states_update"`);
    printFooter();
}

function returnTask(taskId) {
    printHeaderWithIcon('ВОЗВРАТ ЗАДАЧИ', '↩️');
    console.log(`   👤 Пользователь: fp.naboyshchikov`);
    console.log(`   🆔 ID задачи: ${taskId}`);
    console.log(`   📋 Действие: Вернуть задачу (не могу выполнить)`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    socket.emit("return_task", { task_id: taskId });
    
    console.log(`✅ Запрос на возврат задачи отправлен!`);
    console.log(`⏰ Время отправки: ${new Date().toLocaleTimeString()}`);
    console.log(`💡 Задача будет возвращена в общий пул`);
    console.log(`🔄 Ожидайте обновление списка задач через событие "user_return_task"`);
    printFooter();
}

// Дополнительный обработчик для подтверждения завершения задачи (опционально)
socket.on("task_completed", (data) => {
    printSeparator('🏆');
    printHeader('ЗАДАЧА ЗАВЕРШЕНА', '🏆');
    
    console.log(`✅ Задача успешно завершена!`);
    if (data && data.task_id) {
        console.log(`   🆔 ID завершенной задачи: ${data.task_id}`);
    }
    if (data && data.message) {
        console.log(`   📝 Сообщение: ${data.message}`);
    }
    console.log(`⏰ Время завершения: ${new Date().toLocaleTimeString()}`);
    console.log(`🔄 Список задач будет обновлен автоматически`);
    
    printFooter();
    printSeparator('🏆');
});

// Обработчик ошибок при завершении задачи
socket.on("complete_task_error", (error) => {
    printSeparator('❌');
    printHeader('ОШИБКА ЗАВЕРШЕНИЯ ЗАДАЧИ', '❌');
    
    console.log(`❌ Не удалось завершить задачу:`);
    console.log(`   ${error.message || error}`);
    console.log(`💡 Совет: Проверьте правильность ID задачи и наличие прав`);
    
    printFooter();
    printSeparator('❌');
});

// Обработчик ошибки при возврате задачи
socket.on("return_task_error", (error) => {
    printSeparator('❌');
    printHeader('ОШИБКА ВОЗВРАТА ЗАДАЧИ', '❌');
    
    console.log(`❌ Не удалось вернуть задачу:`);
    console.log(`   ${error.message || error}`);
    console.log(`💡 Возможные причины:`);
    console.log(`   - Задача не закреплена за вами`);
    console.log(`   - Задача уже возвращена или завершена`);
    console.log(`   - Неверный ID задачи`);
    
    printFooter();
    printSeparator('❌');
});

setTimeout(() => {
    createTask("Купить продукты", "Молоко, хлеб, яйца");
}, 10000);



setTimeout(() => {
    takeTask("7e7f34fe796b4444b7c630eec995b963");
}, 30000);

/*
setTimeout(() => {
    completeTask("e6511c6958954ccdbd7fbc64df20f86a");
}, 60000);
*/

setTimeout(() => {
    returnTask("7e7f34fe796b4444b7c630eec995b963");
}, 60000);


console.log('\n' + '█'.repeat(70));
console.log('🚀 КЛИЕНТ ЗАПУЩЕН');
console.log('═'.repeat(70));
console.log(`👤 Пользователь: fp.naboyshchikov`);
console.log(`🔗 Сервер: http://127.0.0.1:8888`);
console.log(`🆔 Socket ID: ${socket.id || 'ожидание подключения...'}`);
console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
console.log('█'.repeat(70) + '\n');

socket.on("connect", () => {
    console.log('\n💡 Доступные команды:');
    console.log('   createTask("название", "описание") - создать задачу');
    console.log('   takeTask("task_id") - принять задачу');
    console.log('   completeTask("task_id") - завершить задачу');
    console.log('   showAllTasks() - показать все задачи\n');
});