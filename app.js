const express = require('express');
const path = require('path');

const {open} = require('sqlite');
const sqlite3 = require('sqlite3');

const databasePath = path.join(__dirname, 'todoApplication.db');
const app = express();
app.use(express.json());

let database = null;

const initiltizeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/');
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initiltizeDbAndServer();

/*
  Created a Table with name todo in the todoApplication.db file using the CLI.
 * 
    ^Cnxtwave@NJSCPRHNKY:~/nodejs/coding-practices/coding-practice-8a$ sqlite3 todoApplication.db
    SQLite version 3.27.2 2019-02-25 16:06:06
    Enter ".help" for usage hints.
    sqlite> .tables
    sqlite> CREATE TABLE todo(id INTEGER, todo TEXT, priority TEXT, status TEXT);
    sqlite> INSERT INTO todo(id, todo, priority, status)
      ...> VALUES (1, "Watch Movie", "LOW", "TO DO"),
      ...> (2, "Learn JavaScript", "HIGH", "DONE"),
      ...> (3, "Learn Node JS", "HIGH", "IN PROGRESS"),
      ...> (4, "Play volleyball", "MEDIUM", "DONE"),
      ...> (5, "Learn HTML", "HIGH", "TO DO"),
      ...> (6, "Learn CSS", "LOW", "DONE"),
      ...> (7, "Buy a Car", "MEDIUM", "TO DO"),
      ...> (8, "Clean the garden", "LOW", "TO DO"),
      ...> (9, "Play video games", "MEDIUM", "DONE");
    sqlite> SELECT * FROM todo;
    1|Watch Movie|LOW|TO DO
    2|Learn JavaScript|HIGH|DONE
    3|Learn Node JS|HIGH|IN PROGRESS
    4|Play volleyball|MEDIUM|DONE
    5|Learn HTML|HIGH|TO DO
    6|Learn CSS|LOW|DONE
    7|Buy a Car|MEDIUM|TO DO
    8|Clean the garden|LOW|TO DO
    9|Play video games|MEDIUM|DONE
    sqlite> .exit
  *
*/

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
};

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
};

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
};

// API 1:
app.get('/todos/', async (request, response) => {
  let data = null;
  let getTodosQuery = '';
  const {search_q = '', priority, status} = request.query;

  /* Switch Case */
  switch (true) {
    // Scenario 1:Returns a list of all todos whose status is 'TO DO'
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';
      `;
      break;
    // Scenario 2:Returns a list of all todos whose priority is 'HIGH'
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';
      `;
      break;
    // Scenario 3:Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS'
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}'
          AND status = '${status}';
      `;
      break;
    //Scenario 4:Returns a list of all todos whose todo contains 'Play' text
    default:
      getTodosQuery = `
        SELECT 
          *
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%';
      `;
  };
  data = await database.all(getTodosQuery);
  response.send(data);
});

// API 2: Returns a specific todo based on the todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM 
      todo
    WHERE 
      id = ${todoId};
  `;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

//  API 3: Create a todo in the todo table
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body;
  const createTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status)
    VALUES 
      (
        ${id}, 
        '${todo}', 
        '${priority}', 
        '${status}'
      );
  `;
  const createdTodo = await database.run(createTodoQuery);
  // console.log(createdTodo);
  response.send('Todo Successfully Added');
});

// API 4: Updates the details of a specific todo based on the todo ID
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  // console.log(todoId);
  const requestBody = request.body;
  let updateColumn = '';

  /* Switch Case */
  switch (true) {
    // Scenario 1: "status": "DONE"
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break;
    // Scenario 2: "priority": "HIGH"
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break;
    // Scenario 3: "todo": "Some task"
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
  };

  const lastTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE 
      id = ${todoId};
  `;
  const lastTodo = await database.get(lastTodoQuery);

  const {
    status = lastTodo.status,
    priority = lastTodo.priority,
    todo = lastTodo.todo,
  } = request.body;

  const updateTodoQuery = `
    UPDATE 
      todo
    SET 
      status = '${status}',
      priority = '${priority}',
      todo = '${todo}'
    WHERE 
      id = ${todoId};    
  `;
  const updatedTodo = await database.run(updateTodoQuery);
  // console.log(updatedTodo);
  response.send(`${updateColumn} Updated`);
});

// API 5: Deletes a todo from the todo table based on the todo ID
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE 
      id = ${todoId};
  `;
  const deletedTodo = await database.run(deleteTodoQuery)
  // console.log(deletedTodo);
  response.send('Todo Deleted');
});

module.exports = app;