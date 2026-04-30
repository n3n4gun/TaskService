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
        login: "av.efimov"
    }
});

// Вспомогательные функции для форматирования вывода
const line = '\n' + '─'.repeat(70) + '\n';
const doubleLine = '\n' + '═'.repeat(70) + '\n';
const dottedLine = '\n' + '⋅'.repeat(70) + '\n';

function printHeader(title, icon = '📌') {
    console.log(doubleLine);
    console.log(`${icon} ${title}`);
    console.log(line);
}

function printFooter() {
    console.log(doubleLine);
}

socket.on("user_connection", (data) => {
    printHeader('ПОДКЛЮЧЕНИЕ К СЕРВЕРУ', '🔌');
    console.log("Полученные данные при подключении:");
    console.log(JSON.stringify(data, null, 2));
    
    // Вывод информации о пользователе
    if (data.user_tasks !== undefined) {
        console.log(`\n👤 Пользователь: av.efimov`);
        console.log(`📋 Количество задач пользователя: ${data.user_tasks?.length || 0}`);
    }
    
    if (data.active_tasks && data.active_tasks.active_tasks) {
        const taskCount = Object.keys(data.active_tasks.active_tasks).length;
        console.log(`📊 Доступно задач: ${taskCount}`);
    }
    
    printFooter();
});

socket.on("connect", () => {
    printHeader('СОЕДИНЕНИЕ УСТАНОВЛЕНО', '✅');
    console.log(`   Socket ID: ${socket.id}`);
    console.log(`   Пользователь: av.efimov`);
    console.log(`   Сервер: http://127.0.0.1:8888`);
    console.log(`   Статус: Активен`);
    printFooter();
});

socket.on("connect_error", (err) => {
    printHeader('ОШИБКА ПОДКЛЮЧЕНИЯ', '❌');
    console.log(`   Сообщение: ${err.message}`);
    console.log(`   Пользователь: av.efimov`);
    console.log(`   Время: ${new Date().toLocaleTimeString()}`);
    printFooter();
});

socket.on("disconnect", () => {
    printHeader('СОЕДИНЕНИЕ РАЗОРВАНО', '🔌');
    console.log(`   Пользователь: av.efimov`);
    console.log(`   Время: ${new Date().toLocaleTimeString()}`);
    printFooter();
});

socket.on("new_task", (response) => {
    printHeader('ОБНОВЛЕНИЕ СПИСКА ЗАДАЧ', '📦');
    
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
            
            // Статус с цветовым индикатором (текстовым)
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
    printHeader('СОЗДАНИЕ НОВОЙ ЗАДАЧИ', '📝');
    console.log(`   👤 Пользователь: av.efimov`);
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
    printHeader('ПРИНЯТИЕ ЗАДАЧИ В РАБОТУ', '🔧');
    console.log(`   👤 Пользователь: av.efimov`);
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
    
    // 🔍 Отладка: выводим полученные данные
    console.log('\n🔍 ОТЛАДКА: Полученные данные от сервера:');
    console.log('Тип данных:', Array.isArray(userTasks) ? 'Array' : typeof userTasks);
    console.log('Содержимое:', JSON.stringify(userTasks, null, 2));
    console.log('');
    
    let tasksArray = [];
    let taskCount = 0;
    
    // Преобразуем данные в единый формат
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
            // Безопасное получение полей задачи
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

// Дополнительная функция для просмотра всех задач
function showAllTasks() {
    printHeader('ЗАПРОС ВСЕХ ЗАДАЧ', '🔍');
    console.log(`👤 Пользователь: av.efimov`);
    console.log(`⏳ Запрос списка всех задач...`);
    socket.emit("get_all_tasks");
    printFooter();
}

// Функция для завершения задачи
function completeTask(taskId) {
    printHeader('ЗАВЕРШЕНИЕ ЗАДАЧИ', '🎯');
    console.log(`   👤 Пользователь: av.efimov`);
    console.log(`   🆔 ID задачи: ${taskId}`);
    console.log(`   📋 Действие: Завершить задачу`);
    console.log(line);
    console.log(`⏳ Отправка запроса на сервер...`);
    
    socket.emit("complete_task", { task_id: taskId });
    
    console.log(`✅ Запрос успешно отправлен!`);
    printFooter();
}

// Автоматическое создание задачи через 5 секунд
setTimeout(() => {
    createTask("Позвонить маме", "Узнать о здоровье");
}, 5000);

// Пример: создать несколько задач с интервалами (раскомментируйте при необходимости)
/*
setTimeout(() => {
    createTask("Купить продукты", "Молоко, хлеб, яйца");
}, 10000);

setTimeout(() => {
    createTask("Сделать зарядку", "Утренняя зарядка 15 минут");
}, 15000);
*/

// Принятие задачи (раскомментируйте для тестирования)

setTimeout(() => {
    takeTask("7ce7107bf798481eac2ce541dc858f35");
}, 30000);


// Информация о запуске клиента
console.log('\n' + '█'.repeat(70));
console.log('🚀 КЛИЕНТ ЗАПУЩЕН');
console.log('═'.repeat(70));
console.log(`👤 Пользователь: av.efimov`);
console.log(`🔗 Сервер: http://127.0.0.1:8888`);
console.log(`🆔 Socket ID: ${socket.id || 'ожидание подключения...'}`);
console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
console.log('█'.repeat(70) + '\n');

// Обработчик готовности к отправке команд
socket.on("connect", () => {
    console.log('\n💡 Доступные команды (вызовите в коде):');
    console.log('   createTask("название", "описание") - создать задачу');
    console.log('   takeTask("task_id") - принять задачу');
    console.log('   completeTask("task_id") - завершить задачу');
    console.log('   showAllTasks() - показать все задачи\n');
});