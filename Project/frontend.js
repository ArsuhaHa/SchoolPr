



async function postData(url = '', data = {}) {
    // Опции запроса
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // Отправка запроса и обработка ответа
    try {
        const response = await fetch(url, requestOptions);
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    }
}

async function putData(url = '', data = {}) {
    // Опции запроса
    const requestOptions = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    // Отправка запроса и обработка ответа
    try {
        console.log("Привет");
        const response = await fetch(url, requestOptions);
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    }
}




function printError(flag) {
    const errorText = document.querySelector('.errorRegText'); // Выбираем элемент по классу

    if (errorText) {
        // Элемент найден, устанавливаем сообщение об ошибке и стили
        switch (flag) {
            case 1:
                errorText.innerHTML = "Заполните все данные в соответствующих полях";
                break;
            case 2:
                errorText.innerHTML = "Введена некорректная почта";
                break;
            case 3:
                errorText.innerHTML = "Пароли не совпадают";
                break;
            case 4:
                errorText.innerHTML = "Ошибка при регистрации";
                break;
            case 5:
                errorText.innerHTML = "Данный пользователь не найден";
                break;
            default:
                errorText.innerHTML = "Неизвестная ошибка";
        }
        errorText.style.color = "red"; // Устанавливаем цвет текста
    } else {
        console.error("Элемент с классом 'errorRegText' не найден");
    }
}

function clearError() {
    const errorText = document.querySelector('.errorRegText'); // Выбираем элемент по классу
    if (errorText) {
        errorText.innerHTML = "";
    } else {
        console.log("Элемент с классом 'errorRegText' не найден")
    }
}


/* ДЛЯ РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ  */



async function registerUser() {
    const email = document.getElementById('emailReg').value;
    const fullName = document.getElementById('nameReg').value;
    const password = document.getElementById('passReg').value;
    const conPassword = document.getElementById('passConReg').value;

    // localStorage.removeItem('token');
    // localStorage.removeItem('id_student');

    if (email && fullName && password && conPassword) {
        if (email.includes('@')) {
            if (password !== conPassword) {
                console.log("Пароли не совпадают");
                printError(3);
            } else {
                const data = { email, fullName, password };

                try {
                    const response = await postData('/register', data);
                    console.log(response);
                    console.log('Регистрация успешна, токен:', response.token);

                    clearError();

                    localStorage.setItem('token', response.token);
                    localStorage.setItem('id_student', response.id_student);

                    window.location.href = "Start.html";


                } catch (error) {
                    console.error('Ошибка при регистрации:', error);
                    printError(4);
                }
            }
        }
        else {
            console.log('Некоректная почта');
            printError(2);
        }
    } else {
        console.log("Не все данные заполнены");
        printError(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('registerBtn');

    registerBtn.addEventListener('click', async (event) => {
        event.preventDefault();

        await registerUser();
    });
});





// АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ
async function loginUser() {
    const email = document.getElementById('emailLogin').value;
    const password = document.getElementById('passwordLogin').value;
    console.log(email);

    localStorage.removeItem('token');
    localStorage.removeItem('id_student');
    // const email = "ars@mail.ru";
    // const password = "123";

    if (email && password) {
        if (email.includes('@')) {
            const data = { email, password };

            try {
                const response = await postData('/login', data);
                if (response.error == 404) {
                    console.log("Такого пользователя не существует");
                    printError(5);
                }
                else {
                    console.log('Авторизация успешна, токен:', response);

                    clearError();

                    localStorage.setItem('token', response.token);
                    localStorage.setItem('id_student', response.id_student);

                    window.location.href = "Start.html";
                }

            } catch (error) {
                console.error('Ошибка при авторизации:', error);
                printError(4);
            }
        } else {
            console.log("Неккоректный email");
            printError(2);
        }
    }
    else {
        console.log("Данные не спарсились");
        printError(1);
    }
}
// loginUser();

// Дожидаемся полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('signBtn');
    // Назначаем обработчик события клика на кнопку регистрации
    loginBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Предотвращаем стандартное действие кнопки (отправку формы)

        // Вызываем функцию регистрации
        await loginUser();
    });
});

let isRequestPending = false; // Флаг для отслеживания состояния активного запроса


// ИЗМЕНЕНИЕ ПРОФИЛЯ СТУДЕНТА
async function changeProfile() {
    if (isRequestPending) {
        console.log('Запрос уже выполняется, подождите...');
        return;
    }


    const token = localStorage.getItem('token');

    

    if (!token) {
        console.error('Токен не найден в localStorage');
        return;
    }


    // const idStudents = "1";
    const firstName = document.getElementById('changeFirstname').value;
    const secondName = document.getElementById('changeSecondname').value;
    const thirdName = document.getElementById('changeThirdname').value;
    const schoolName = document.getElementById('changeShoolName').value;
    const schoolClass = document.getElementById('changeClass').value;
    const schoolLetter = document.getElementById('changeLetterClass').value;
    const country = document.getElementById('changeCountry').value;
    const city = document.getElementById('changeCity').value;

    const data = { token, firstName, secondName, thirdName, schoolName, schoolClass, schoolLetter, country, city };

    try {
        isRequestPending = true;
        const response = await putData('/students/me', data);
        console.log('Данные успешно обновлены:', response);

        localStorage.setItem('profileData', JSON.stringify(response));

        window.location.href = "Profile.html";

    } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        // Ваш код для обработки ошибки
    } finally {
        isRequestPending = false;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const saveChangeBtn = document.getElementById('savingChange');
    // Назначаем обработчик события клика на кнопку регистрации
    saveChangeBtn.addEventListener('click', async (event) => {
        event.preventDefault(); // Предотвращаем стандартное действие кнопки (отправку формы)

        // Вызываем функцию регистрации
        await changeProfile();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Получаем данные из localStorage
    const profileData = JSON.parse(localStorage.getItem('profileData'));

    if (profileData) {
        // Обновляем контент на странице
        const changeStudentProfile = document.getElementById('studentNameProfile');
        const changeSchoolProfile = document.getElementById('schoolNameProfile');
        const classNameProfile = document.getElementById('classNameProfile');
        const countryAndCityProfile = document.getElementById('countryCityProfile');

        changeStudentProfile.innerHTML = `${profileData.first_name} ${profileData.second_name} ${profileData.third_name}`;
        changeSchoolProfile.innerHTML = `${profileData.school_name}`;
        classNameProfile.innerHTML = `${profileData.school_class}${profileData.school_letter}`;
        countryAndCityProfile.innerHTML = `${profileData.country} - ${profileData.city}`;

        // Очищаем данные из localStorage после использования, если нужно
        localStorage.removeItem('profileData');
    } else {
        console.error('Данные профиля не найдены в localStorage');
    }
});







async function getProfileData() {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('Токен не найден в localStorage');
        return;
    }

    try {
        const response = await fetch('/students/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        const STUDENT_DATA = data.DATA;
        const FIRST_NAME = STUDENT_DATA.first_name.charAt(0).toUpperCase() + STUDENT_DATA.first_name.slice(1);
        const SECOND_NAME = STUDENT_DATA.last_name.charAt(0).toUpperCase() + STUDENT_DATA.last_name.slice(1);
        const THIRD_NAME = STUDENT_DATA.third_name.charAt(0).toUpperCase() + STUDENT_DATA.third_name.slice(1);
        const NAME_SCHOOL = STUDENT_DATA.name_school;
        const CLASS = STUDENT_DATA.class;
        const city = STUDENT_DATA.city;
        const country = STUDENT_DATA.country;



        let nameOfStudent = document.getElementById('studentNameProfile');
        nameOfStudent.innerHTML = `${FIRST_NAME} ${SECOND_NAME} ${THIRD_NAME}`;

        let schoolNameProfile = document.getElementById('schoolNameProfile');
        let classNameProfile = document.getElementById('classNameProfile');
        let countryCityProfile = document.getElementById('countryCityProfile');


        schoolNameProfile.innerHTML = `${NAME_SCHOOL}`;
        classNameProfile.innerHTML = `${CLASS}`;
        if (city == 'Не указано!!' || country == 'Не указано!!') { 
            countryCityProfile.innerHTML = "Не указано!!"
        }
        else {
            countryCityProfile.innerHTML = `${country} - ${city}`;
        }


    } catch (error) {
        console.error('Error:', error.message);
    }
}
// getProfileData();
document.addEventListener('DOMContentLoaded', () => {
    getProfileData();
});




// СОЗДАНИЕ ПРОЕКТА
async function createProject() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg"; // Замените на ваш токен доступа
    const idStudent = "1";
    const url = '/projects';

    const project = {
        projectName: "Проект Семёна",
        text: {
            1: "as",
            2: "ds",
            3: "123",
            4: "3",
            5: "4"
        }
    };

    const DATA = { token, idStudent, project };
    console.log(DATA);

    try {
        const response = await postData(url, DATA);

        console.log(response);

        // console.log('ID созданного проекта:', response.projectId);
        console.log("Проект успешно создан");
    } catch (error) {
        console.error('Error:', error.message);
    }
}
// createProject();





// ОБНОВЛЕНИЕ ПРОЕКТА
async function updateProject() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg'; // Замените на ваш токен доступа
    const projectId = '2';
    const studentId = '1';
    const project = {
        projectName: "Да, меняется",
        text: {
            1: "всё",
            2: "ок",
            3: "работает",
            4: "норм",
            5: "4"
        }
    };

    const UpdateData = { token, projectId, studentId, project };

    const url = `/projects/${projectId}`;


    try {
        const response = await putData(url, UpdateData);

        console.log("Проект успешно изменен", response.project);
    } catch (error) {
        console.error('Error:', error.message);
    }
}
// updateProject();



// ПОЛУЧЕНИЕ ПРОЕКТА СТУДЕНТА ПО ЕГО ID
async function getProjectData() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg'; // Замените на ваш токен доступа
    const projectId = '1';
    const url = `/projects/${projectId}`;


    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const projectData = await response.json();
        console.log("Данные проекта:", projectData);
        // Обработка полученных данных, если необходимо
    } catch (error) {
        console.error('Error:', error.message);
    }
}
// getProjectData();


// ПОЛУЧЕНИЕ ВСЕХ ПРОЕКТОВ СТУДЕНТА
async function getStudentProjects() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg'; // Замените на ваш токен доступа
    // const idStudent = "1";
    const url = '/projects'; // Укажите правильный URL для получения проектов студента

    const params = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(url, params);

        const studentProjects = await response.json();
        console.log('Список проектов студента:', studentProjects);
        // Обработка полученных данных, если необходимо
    } catch (error) {
        console.error('Error:', error.message);
    }
}
// getStudentProjects();



// const token = 'YOUR_ACCESS_TOKEN'; // Замените на ваш токен доступа
// const projectId = 'YOUR_PROJECT_ID'; // Замените на идентификатор проекта, который вы хотите удалить
// const url = `/students/me/projects/${projectId}`;

async function deleteProject() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg'; // Замените на ваш токен доступа
    const projectId = '1';
    const url = `/projects/${projectId}`; // Укажите правильный URL для получения проектов студента
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });



        console.log('Проект успешно удален');
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}
// deleteProject();


async function downloadProject() {
    const projectId = '2';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFyc2VuYXZ0b3JAbWFpbC5ydSIsIklEX1NUVURFTlQiOjEsImlhdCI6MTcxMjIyNzI5MCwiZXhwIjoxNzEyMjMwODkwfQ.G591gDwL_Nw9yHJHufzlUzulWEYaQYNK6k9mnsXahLg'; // Замените на ваш токен доступа
    const url = `/projects/${projectId}/download`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });


        // Получение данных о проекте для скачивания
        const projectData = await response.json();
        console.log('Данные о проекте для скачивания:', projectData);
        // Обработка полученных данных, если необходимо
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}
// downloadProject();












// // Login user - пон надатию на кнопку выполняется функция loginUser();
// document.addEventListener('DOMContentLoaded', function () {
//     const signBtn = document.getElementById('signBtn');
//     if (signBtn) {
//         signBtn.addEventListener('click', function (event) {
//             event.preventDefault(); // Предотвращаем стандартное действие кнопки submit
//             console.log("login");
//             loginUser();
//         });
//     }
// });


// // Register User - по нажатию на кнопку выполняется функция resterUser();
// document.addEventListener('DOMContentLoaded', function () {
//     const registerBtn = document.getElementById('registerBtn');
//     if (registerBtn) {
//         registerBtn.addEventListener('click', function (event) {
//             event.preventDefault(); // Предотвращаем стандартное действие кнопки submit
//             console.log("reg");
//             registerUser();
//         });
//     }
// });


// // Change user - обновление данных по нажатию на кнопку изменить
// document.addEventListener('DOMContentLoaded', function () {
//     const savinBtn = document.getElementById('savingChange');
//     if (savinBtn) {
//         savinBtn.addEventListener('click', function (event) {
//             event.preventDefault(); // Предотвращаем стандартное действие кнопки submit
//             console.log("change info");
//             changeProfile();
//         });
//     }
// });