const express = require('express');
const path = require('path');
const { threadId } = require('worker_threads');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Подключаем middleware для разбора данных формы и JSON
app.use(express.json());

// Указываем путь к папке, содержащей статические HTML файлы
app.use(express.static(path.join(__dirname, 'Project')));

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'db',
    database: 'postgres',
    password: '123',
    port: 5432,
});

async function generateId() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT MAX(id_student) FROM students');
        client.release();

        if (result.rows[0].max !== null) {
            return parseInt(result.rows[0].max) + 1;

        } else {
            return 1;
        }
    } catch (error) {
        console.error('Ошибка при генерации id:', error);
        throw error;
    }
}

async function generateProjectId() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT MAX(id_project) FROM projects');
        client.release();

        if (result.rows[0].max !== null) {
            return parseInt(result.rows[0].max) + 1;

        } else {
            return 1;
        }
    } catch (error) {
        console.error('Ошибка при генерации id:', error);
        throw error;
    }
}

// Проверка подключения к базе данных +
pool.connect((err, client, release) => {
    if (err) {
        console.log(err);
        return console.error('Ошибка подключения к базе данных', err.stack);
    }

    console.log('Успешное подключение к базе данных PostgreSQL');
    client.release(); // Важно освободить клиента обратно в пул соединений
});


//АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ: +
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // console.log(email)
    // console.log(password);


    try {
        const client = await pool.connect();
        const user = await client.query('SELECT * FROM students WHERE email = $1', [email]);

        // console.log(user.rows);


        if (user.rows.length === 1) {
            const storedPassword = user.rows[0].password;
            const idStudent = user.rows[0].id_student;


            if (await bcrypt.compare(password, storedPassword)) {

                const tokenResult = await client.query('SELECT token FROM token_student WHERE id_student = $1', [idStudent]);


                if (tokenResult.rows.length === 1) {
                    const token = tokenResult.rows[0].token;
                    res.status(200).json({ token, idStudent });
                    client.release();
                    return;
                }
            }
        }

        res.status(404).json({ message: "Пользователь не найден или пароль неверен", error: 404 });
        client.release();
    } catch (error) {
        console.error('Ошибка при авторизации пользователя:', error);
        res.status(500).json({ message: 'Ошибка при авторизации пользователя' });
    }
});


// РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ: +
app.post('/register', async (req, res) => {
    const { email, fullName, password } = req.body;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM students WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            client.release();
            return res.status(400).json({ message: 'Пользователь с таким email уже зарегистрирован' });
        }

        const ID_STUDENT = await generateId();

        const hashedPassword = await bcrypt.hash(password, 10);

        const parts = fullName.split(/\s+/).filter(part => part.trim() !== '');
        const {0: p1 = "", 1: p2 = "", 2: p3 = ""} = parts;
        const lastName = p1.toLowerCase();
        const firstName = p2.toLowerCase();
        const patronymic = p3.toLowerCase();

        await client.query('INSERT INTO students (id_student, last_name, first_name, patronymic, email, name_school, class, password, city, country) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [ID_STUDENT, lastName, firstName, patronymic, email, null, null, hashedPassword, null, null]);

        const TOKEN = jwt.sign({ email, ID_STUDENT }, "q45!L1zJlE&w3n$rzT8A@f2D*pB9Y!sQ", { expiresIn: '1h' });

        await client.query('INSERT INTO token_student (token, id_student) VALUES ($1, $2)', [TOKEN, ID_STUDENT]);

        client.release();

        // Возвращаем токен и id_student вместе с полным именем пользователя
        res.status(200).json({ token: TOKEN, id_student: ID_STUDENT });
    } catch (error) {
        console.error('Ошибка при регистрации пользователя:', error);
        res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
    }
});


// ИЗМЕНЕНИЕ ДАННЫХ О СТУДЕНТЕ: +
app.put('/students/me', async (req, res) => {
    const { token, firstName, secondName, thirdName, schoolName, schoolClass, schoolLetter, country, city } = req.body;
    let newData = {};
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [token]);
        const idStudent = await result.rows[0].id_student;
        const class_student = schoolClass + schoolLetter;



        if (result.rows.length === 1 && token === result.rows[0].token) {
            await client.query(`
        UPDATE students
        SET 
            last_name = $1,
            first_name = $2,
            patronymic = $3,
            name_school = $4,
            class = $5,
            city = $6,
            country = $7
        WHERE
            id_student = $8`,
                [secondName, firstName, thirdName, schoolName, class_student, city, country, idStudent]
            );
            const CHANGE_FIRST_NAME    = firstName;
            const CHANGE_SECOND_NAME   = secondName;
            const CHANGE_THIRD_NAME    = thirdName;
            const CHANGE_SCHOOL_NAME   = schoolName;
            const CHANGE_SCHOOL_CLASS  = schoolClass;
            const CHANGE_SCHOOL_LETTER = schoolLetter;
            const CHANGE_COUNTRY       = country;
            const CHANGE_CITY          = city;
            newData = {
                first_name: CHANGE_FIRST_NAME,
                second_name: CHANGE_SECOND_NAME,
                third_name: CHANGE_THIRD_NAME,
                school_name: CHANGE_SCHOOL_NAME,
                school_class: CHANGE_SCHOOL_CLASS,
                school_letter: CHANGE_SCHOOL_LETTER,
                country: CHANGE_COUNTRY,
                city: CHANGE_CITY
            };

            res.status(200).json(newData);
        }
        else {
            console.log("данные не изменились");
            res.status(500).json({ message: 'Данные не изменились' });
        }
    } catch (error) {
        console.log("Не получилось вставить данные");
        console.log(error);
        res.status(500).json({ message: 'гг' });
    }
});


app.get('/students/me', async (req, res) => {
    const TOKEN = req.headers.authorization.split(' ')[1];

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);

        let DATA = {};
        if (result.rows.length === 1 && result.rows[0].token == TOKEN) {
            const ID_STUDENT = result.rows[0].id_student;
            const STUDENT_DATA = await client.query('SELECT last_name, first_name, patronymic, name_school, class, city, country FROM students WHERE id_student = $1', [ID_STUDENT]);
            const FIRST_NAME = STUDENT_DATA.rows[0].first_name;
            const LAST_NAME = STUDENT_DATA.rows[0].last_name
            const THIRD_NAME = STUDENT_DATA.rows[0].patronymic;
            let CLASS = STUDENT_DATA.rows[0].class;
            let NAME_SCHOOL = STUDENT_DATA.rows[0].name_school;
            let city = STUDENT_DATA.rows[0].city;
            let country = STUDENT_DATA.rows[0].country;

            if (!NAME_SCHOOL) {
                NAME_SCHOOL = "Не указано!!";
            }
            // console.log(NAME_SCHOOL);
            if (!city) {
                city = "Не указано!!";
            }

            if (!country) {
                country = "Не указано!!";
            }

            if (!CLASS) {
                CLASS = "Не указано";
            }





            DATA = { first_name: FIRST_NAME, last_name: LAST_NAME, third_name: THIRD_NAME, name_school: NAME_SCHOOL, city: city, country: country, class: CLASS};
            // console.log(DATA);
            res.status(200).json({ message: "Получение данных для скачивания проекта", DATA });
        } else {
            console.log("Ошибка получения данных");
        }
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: error });
    }
});

//СОЗДАЁТ ПРОЕКТ СТУДЕНТУ: +
app.post('/projects', async (req, res) => {
    const DATA = req.body;


    const TOKEN = DATA.token;
    const IDSTUDENT = DATA.idStudent;
    const NAME_PROJECT = DATA.project.projectName;
    const PROJECT_TEXT = DATA.project.text;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE id_student = $1', [IDSTUDENT]);


        if (result.rows.length === 1 && TOKEN === result.rows[0].token && IDSTUDENT == result.rows[0].id_student) {

            const ID_PROJECT = await generateProjectId();


            await client.query('INSERT INTO projects (id_project, project_name, create_date, id_student) VALUES ($1, $2, $3, $4)', [ID_PROJECT, NAME_PROJECT, null, IDSTUDENT]);

            const textInsertValues = Object.entries(PROJECT_TEXT).map(([stepNumber, stepText]) => {
                return [ID_PROJECT, stepNumber, stepText];
            });

            await Promise.all(textInsertValues.map(async (values) => {
                await client.query(
                    'INSERT INTO textproject (id_project, step_number, step_inner) VALUES ($1, $2, $3)',
                    values
                );
            }));

            client.release();

            res.status(200).json({ message: 'Проект успешно создан', projectId: ID_PROJECT });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера. Что-то пошло не так.' });
    }
});

// ВОЗВРАЩАЕТ ВСЕ ПРОЕКТЫ СТДЕНТА: +
app.get('/projects', async (req, res) => {
    const TOKEN = req.headers.authorization.split(' ')[1];

    console.log(TOKEN); // Выводим токен в консоль (может быть полезно для отладки


    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);

        if (result.rows.length === 1 && result.rows[0].token === TOKEN) {
            const ID_STUDENT = result.rows[0].id_student;
            const PROJECTS = [];

            const PROJECTS_INFO = await client.query('SELECT * FROM projects WHERE id_student = $1', [ID_STUDENT]);
            for (const project of PROJECTS_INFO.rows) {
                // console.log(project);
                const PROJECT_ID = project.id_project;
                const PROJECT_NAME = project.project_name;
                const TEXT_PROJECT = await client.query('SELECT * FROM textproject WHERE id_project = $1', [PROJECT_ID]);
                const TEXT = {};
                for (const textStep of TEXT_PROJECT.rows) {
                    TEXT[textStep.step_number] = textStep.step_inner;
                }
                PROJECTS.push({ PROJECT_ID, projects_name: PROJECT_NAME, TEXT });

            }

            client.release();

            const DATA = { ID_STUDENT, PROJECTS }

            res.status(200).json({ message: "Все проекты студента", info: DATA });
            console.log("Проекты студента отправлены");

        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
});

// ИЗМЕНЕНИЕ ПРОЕКТА СТУДЕНТА ПО ID: +
app.put('/projects/:projectId', async (req, res) => {
    const TOKEN = req.body.token;
    const PROJECT = req.body.project;
    const STUDENT_ID = req.body.studentId;
    const PROJECT_ID = req.params.projectId;
    // console.log(TOKEN);
    // console.log(PROJECT);
    // console.log(STUDENT_ID);
    // console.log(PROJECT_ID);

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);

        if (result.rows.length === 1 && result.rows[0].token === TOKEN && result.rows[0].id_student == STUDENT_ID) {
            await client.query('UPDATE projects SET project_name = $1 WHERE id_project = $2', [PROJECT.projectName, PROJECT_ID]);

            await client.query('DELETE FROM textproject WHERE id_project = $1', [PROJECT_ID]);
            const PROJECT_TEXT = PROJECT.text;
            const textInsertValues = Object.entries(PROJECT_TEXT).map(([stepNumber, stepText]) => {
                return [PROJECT_ID, stepNumber, stepText];
            });

            // console.log(textInsertValues);

            await Promise.all(textInsertValues.map(async (values) => {
                await client.query(
                    'INSERT INTO textproject (id_project, step_number, step_inner) VALUES ($1, $2, $3)',
                    values
                );
            }));
            client.release();
            console.log(PROJECT);
            res.status(200).json({ message: 'Проект успешно изменен', project: PROJECT });
        } else {
            res.status(400).json({ message: "не авторизован" });
        }



    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Ошибка сервера. Что-то пошло не так.' });
    }
});

//ПОЛУЧЕНИЕ ПРОЕКТА ПО ID: +
app.get('/projects/:projectId', async (req, res) => {

    const TOKEN = req.headers.authorization.split(' ')[1];
    const PROJECT_ID = req.params.projectId;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);

        if (result.rows.length === 1 && result.rows[0].token === TOKEN) {

            const PROJECT_INFO = await client.query('SELECT * FROM projects WHERE id_project = $1', [PROJECT_ID]);
            const PROJECT_INNER = await client.query('SELECT * FROM textproject WHERE id_project = $1', [PROJECT_ID]);


            const PROJECT = PROJECT_INFO.rows[0];
            const TEXT = {};
            for (const textStep of PROJECT_INNER.rows) {
                TEXT[textStep.step_number] = textStep.step_inner;
            }

            const DATA = { PROJECT, TEXT };

            client.release();

            res.status(200).json({ message: "Все проекты студента", info: DATA });
            console.log("Проекты студента отправлены");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
});


// УДАЛЕНИЕ ПРОЕКТА ПО ID: +
app.delete('/projects/:projectId', async (req, res) => {
    const TOKEN = req.headers.authorization.split(' ')[1];
    const PROJECT_ID = req.params.projectId;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);

        if (result.rows.length === 1 && result.rows[0].token === TOKEN) {
            await client.query('DELETE FROM textproject WHERE id_project = $1', [PROJECT_ID]);

            await client.query('DELETE FROM projects WHERE id_project = $1', [PROJECT_ID]);
        } else {
            console.log("Ошибка авторизации (метод DELETE PROJECT)");
        }
        client.release();
        res.status(200).json({ message: "Успешное удаление проекта" });

    } catch (error) {
        console.log(error);
    }
});

// ПОЛУЧЕНИЕ ДАННЫХ ПРОЕКТА ДЛЯ СКАЧИВАНИЯ: +
app.get('/projects/:projectId/download', async (req, res) => {
    const TOKEN = req.headers.authorization.split(' ')[1];
    const PROJECT_ID = req.params.projectId;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT token, id_student FROM token_student WHERE token = $1', [TOKEN]);
        const ID_STUDENT = result.rows[0].id_student;

        let DATA = {};

        if (result.rows.length === 1 && result.rows[0].token === TOKEN) {
            const PROJECT_INFO = await client.query('SELECT * FROM projects WHERE id_project = $1', [PROJECT_ID]);
            const PROJECT_INNER = await client.query('SELECT * FROM textproject WHERE id_project = $1', [PROJECT_ID]);
            const STUDENT = await client.query('SELECT * FROM students WHERE id_student = $1', [ID_STUDENT]);

            const FIRST_NAME = STUDENT.rows[0].first_name;
            const SECOND_NAME = STUDENT.rows[0].last_name;
            const THIRD_NAME = STUDENT.rows[0].patronymic;
            const NAME_SCHOOL = STUDENT.rows[0].name_school;
            const CLASS = STUDENT.rows[0].class;
            const CITY = STUDENT.rows[0].city;
            const COUNTRY = STUDENT.rows[0].country;

            const PROJECT_NAME = PROJECT_INFO.rows[0].project_name;
            const CREATE_DATE = PROJECT_INFO.rows[0].create_date;

            const TEXT = {};
            for (const textStep of PROJECT_INNER.rows) {
                TEXT[textStep.step_number] = textStep.step_inner;
            }

            const STUDENT_DATA = {
                id_student: ID_STUDENT,
                first_name: FIRST_NAME,
                second_name: SECOND_NAME,
                third_name: THIRD_NAME,
                name_school: NAME_SCHOOL,
                class: CLASS, city: CITY,
                country: COUNTRY
            };

            const PROJECT_DATA = {
                project_id: PROJECT_ID,
                project_name: PROJECT_NAME,
                create_data: CREATE_DATE,
                text: TEXT
            };

            DATA = { student_data: STUDENT_DATA, project_data: PROJECT_DATA };

            res.status(200).json({ message: "Получение данных для скачивания проекта", DATA });
        } else {
            console.log("Ошибка авторизации в методе (PROJECT DOWNLOAD)");
            res.status(500).json({ message: "Ошибка авторизации в (PROJECT DOWNLOAD)" })
        }

    } catch (error) {
        console.log(error);
        res.status(501).json({ message: error });
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});


