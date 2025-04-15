const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

console.log("JWT_SECRET:", process.env.JWT_SECRET);

app.use(
  cors({
    origin: ["http://localhost:4200"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Błąd połączenia z MySQL:", err);
    return;
  }
  console.log("Połączono z MySQL");
});

// Middleware do weryfikacji tokena JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("Brak tokena w żądaniu"); // Dodaj log
    return res.status(401).json({error: "Brak tokena"});
  }

  console.log("Token otrzymany:", token); // Dodaj log
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Błąd weryfikacji tokena:", err.message); // Dodaj log
      return res.status(403).json({error: "Nieprawidłowy token"});
    }
    console.log("Zweryfikowany użytkownik:", user); // Dodaj log
    req.user = user;
    next();
  });
};

// Rejestracja (Sign Up)
app.post("/signup", async (req, res) => {
  const {name, lastname, email, nickname, password, confirmPassword} = req.body;

  if (
    !name ||
    !lastname ||
    !email ||
    !nickname ||
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({error: "Wszystkie pola są wymagane"});
  }

  if (password !== confirmPassword) {
    return res.status(400).json({error: "Hasła nie są identyczne"});
  }

  try {
    db.query(
      "SELECT email, nickname FROM users WHERE email = ? OR nickname = ?",
      [email, nickname],
      async (err, results) => {
        if (err) {
          console.error("Błąd zapytania SQL (SELECT):", err);
          return res.status(500).json({error: "Błąd serwera"});
        }
        if (results.length > 0) {
          if (results.some((user) => user.email === email)) {
            return res.status(400).json({error: "Email już istnieje"});
          }
          if (results.some((user) => user.nickname === nickname)) {
            return res.status(400).json({error: "Nickname już istnieje"});
          }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (name, lastname, email, nickname, password) VALUES (?, ?, ?, ?, ?)",
          [name, lastname, email, nickname, hashedPassword],
          (err) => {
            if (err) {
              console.error("Błąd zapytania SQL (INSERT):", err);
              return res.status(500).json({
                error: "Błąd podczas rejestracji",
                details: err.message,
              });
            }
            res.status(201).json({message: "Użytkownik zarejestrowany"});
          }
        );
      }
    );
  } catch (error) {
    console.error("Błąd ogólny:", error);
    res.status(500).json({error: "Błąd serwera", details: error.message});
  }
});

// Logowanie (Sign In)
app.post("/signin", (req, res) => {
  const {identifier, password} = req.body;

  if (!identifier || !password) {
    return res.status(400).json({error: "Identyfikator i hasło są wymagane"});
  }

  db.query(
    "SELECT * FROM users WHERE email = ? OR nickname = ?",
    [identifier, identifier],
    async (err, results) => {
      if (err) {
        console.error("Błąd zapytania SQL (SELECT):", err);
        return res.status(500).json({error: "Błąd serwera"});
      }
      if (results.length === 0) {
        return res
          .status(400)
          .json({error: "Nieprawidłowy identyfikator lub hasło"});
      }

      const user = results[0];

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res
          .status(400)
          .json({error: "Nieprawidłowy identyfikator lub hasło"});
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          lastname: user.lastname,
        },
        process.env.JWT_SECRET,
        {expiresIn: "1h"}
      );
      res.json({token, message: "Zalogowano pomyślnie"});
    }
  );
});

// Pobierz wszystkich użytkowników
app.get("/users", authenticateToken, (req, res) => {
  db.query("SELECT id, name, lastname FROM users", (err, results) => {
    if (err) {
      console.error("Błąd zapytania SQL (SELECT users):", err);
      return res.status(500).json({error: "Błąd serwera"});
    }
    res.json(results);
  });
});

// Pobierz wszystkie listy zadań
app.get("/task-lists", authenticateToken, (req, res) => {
  db.query(
    "SELECT * FROM task_lists WHERE created_by = ?",
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error("Błąd zapytania SQL (SELECT task_lists):", err);
        return res.status(500).json({error: "Błąd serwera"});
      }
      res.json(results);
    }
  );
});

// Dodaj nową listę zadań
app.post("/task-lists", authenticateToken, (req, res) => {
  const {name} = req.body;
  const created_by = req.user.id;

  if (!name) {
    return res.status(400).json({error: "Nazwa listy jest wymagana"});
  }

  db.query(
    "INSERT INTO task_lists (name, created_by) VALUES (?, ?)",
    [name, created_by],
    (err) => {
      if (err) {
        console.error("Błąd zapytania SQL (INSERT task_list):", err);
        return res.status(500).json({error: "Błąd podczas dodawania listy"});
      }
      res.status(201).json({message: "Lista dodana"});
    }
  );
});

// Edytuj nazwę listy
app.put("/task-lists/:id", authenticateToken, (req, res) => {
  const listId = req.params.id;
  const {name} = req.body;

  if (!name) {
    return res.status(400).json({error: "Nazwa listy jest wymagana"});
  }

  db.query(
    "UPDATE task_lists SET name = ? WHERE id = ? AND created_by = ?",
    [name, listId, req.user.id],
    (err) => {
      if (err) {
        console.error("Błąd zapytania SQL (UPDATE task_list):", err);
        return res.status(500).json({error: "Błąd podczas edycji listy"});
      }
      res.json({message: "Nazwa listy zaktualizowana"});
    }
  );
});

// Usuń listę i powiązane zadania
app.delete("/task-lists/:id", authenticateToken, (req, res) => {
  const listId = req.params.id;

  // Najpierw usuń wszystkie zadania powiązane z listą
  db.query("DELETE FROM tasks WHERE list_id = ?", [listId], (err) => {
    if (err) {
      console.error("Błąd zapytania SQL (DELETE tasks):", err);
      return res.status(500).json({error: "Błąd podczas usuwania zadań"});
    }

    // Następnie usuń samą listę
    db.query(
      "DELETE FROM task_lists WHERE id = ? AND created_by = ?",
      [listId, req.user.id],
      (err) => {
        if (err) {
          console.error("Błąd zapytania SQL (DELETE task_list):", err);
          return res.status(500).json({error: "Błąd podczas usuwania listy"});
        }
        res.json({message: "Lista usunięta"});
      }
    );
  });
});

// Pobierz wszystkie zadania dla danej listy
app.get("/tasks/:listId", authenticateToken, (req, res) => {
  const listId = req.params.listId;

  db.query(
    "SELECT t.*, u1.name AS created_by_name, u1.lastname AS created_by_lastname, u2.name AS assigned_to_name, u2.lastname AS assigned_to_lastname " +
      "FROM tasks t " +
      "JOIN users u1 ON t.created_by = u1.id " +
      "JOIN users u2 ON t.assigned_to = u2.id " +
      "WHERE t.list_id = ?",
    [listId],
    (err, results) => {
      if (err) {
        console.error("Błąd zapytania SQL (SELECT tasks):", err);
        return res.status(500).json({error: "Błąd serwera"});
      }
      res.json(results);
    }
  );
});

// Dodaj nowe zadanie
app.post("/tasks", authenticateToken, (req, res) => {
  const {title, description, assigned_to, list_id} = req.body;
  const created_by = req.user.id;

  if (!title || !assigned_to || !list_id) {
    return res
      .status(400)
      .json({error: "Tytuł, przypisany użytkownik i ID listy są wymagane"});
  }

  db.query(
    "INSERT INTO tasks (title, description, assigned_to, created_by, list_id) VALUES (?, ?, ?, ?, ?)",
    [title, description, assigned_to, created_by, list_id],
    (err) => {
      if (err) {
        console.error("Błąd zapytania SQL (INSERT task):", err);
        return res.status(500).json({error: "Błąd podczas dodawania zadania"});
      }
      res.status(201).json({message: "Zadanie dodane"});
    }
  );
});

// Aktualizuj zadanie
app.put("/tasks/:id", authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const {title, description, status, assigned_to} = req.body;

  db.query(
    "UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?",
    [title, description, status, assigned_to, taskId],
    (err) => {
      if (err) {
        console.error("Błąd zapytania SQL (UPDATE task):", err);
        return res
          .status(500)
          .json({error: "Błąd podczas aktualizacji zadania"});
      }
      res.json({message: "Zadanie zaktualizowane"});
    }
  );
});

// Usuń zadanie
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const taskId = req.params.id;

  db.query("DELETE FROM tasks WHERE id = ?", [taskId], (err) => {
    if (err) {
      console.error("Błąd zapytania SQL (DELETE task):", err);
      return res.status(500).json({error: "Błąd podczas usuwania zadania"});
    }
    res.json({message: "Zadanie usunięte"});
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
