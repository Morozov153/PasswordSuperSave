const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const { encrypt, decrypt } = require("./encryption");
const { hash, compare } = require("./hash_bcrypt");
const { hash256 } = require("./hash_sha256");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/check-master-key", async (req, res) => {
  try {
    const { userId, masterKey } = req.body;

    if (!userId || !masterKey) {
      return res.status(400).json({ message: "Нет данных" });
    }

    const result = await pool.query(
      "SELECT master_key_hash FROM users WHERE id_user = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const user = result.rows[0];

    const isMasterKeyCorrect = await compare(masterKey, user.master_key_hash);

    if (!isMasterKeyCorrect) {
      return res.status(401).json({ message: "Неверный мастер-ключ" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Ошибка /api/check-master-key:", err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post("/api/addrecord", async (req, res) => {
  try {
    const { userId, title, login, password, notes, needMasterKey } = req.body;

    if (!userId || !title || !password) {
      return res.status(400).json({ message: "Нет данных" });
    }

    const encryptedData = {
      title: encrypt(title || ""),
      login: encrypt(login || ""),
      password: encrypt(password || ""),
      notes: encrypt(notes || ""),
    };

    await pool.query(
      `INSERT INTO records 
       (id_user, title, login, password, description, need_a_master_key)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        encryptedData.title,
        encryptedData.login,
        encryptedData.password,
        encryptedData.notes,
        Boolean(needMasterKey),
      ]
    );

    return res.status(200).json({ message: "Запись успешно добавлена" });
  } catch (err) {
    console.error("Ошибка /api/addrecord:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/adduser", async (req, res) => {
  try {
    const { name, login, password, masterKey } = req.body;

    if (!name || !login || !password || !masterKey) {
      return res.status(400).json({ message: "Нет данных" });
    }

    const hashData = {
      login: await hash256(login),
      password: await hash(password),
      masterKey: await hash(masterKey),
    };

    await pool.query(
      `INSERT INTO users 
       (name, login_hash, password_hash, master_key_hash)
       VALUES ($1, $2, $3, $4)`,
      [name, hashData.login, hashData.password, hashData.masterKey]
    );

    return res.status(200).json({
      message: "Пользователь успешно добавлен",
    });
  } catch (err) {
    console.error("Ошибка /api/adduser:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/api/isthereuser/:login", async (req, res) => {
  try {
    const { login } = req.params;

    const loginUserHash = await hash256(login);

    const result = await pool.query(
      "SELECT * FROM users WHERE login_hash = $1",
      [loginUserHash]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    return res.status(200).json({ message: "Пользователь найден" });
  } catch (err) {
    console.error("Ошибка /api/isthereuser/:login:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/authuser", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Нет данных" });
    }

    const emailUserHash = await hash256(email);

    const result = await pool.query(
      "SELECT * FROM users WHERE login_hash = $1",
      [emailUserHash]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Ошибка авторизации" });
    }

    const user = result.rows[0];

    const isPasswordCorrect = await compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Ошибка авторизации" });
    }
    const token = jwt.sign(
    {
      id: user.id,
      email: user.login,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
    return res.status(200).json({
      message: "Авторизация успешна",
      user: {
        id: user.id_user,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Ошибка /api/authuser:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/api/records/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM records
       WHERE id_user = $1
       ORDER BY date_of_creation DESC`,
      [id]
    );

    const rows = result.rows.map((r) => ({
      id: r.id_record,
      id_record: r.id_record,
      id_user: r.id_user,

      title: decrypt(r.title),
      login: decrypt(r.login),
      password: decrypt(r.password),
      notes: decrypt(r.description || ""),

      need_master_key: r.need_a_master_key,
      updated_at: r.date_of_creation,
    }));

    return res.json(rows);
  } catch (err) {
    console.error("Ошибка /api/records/:id:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.delete("/api/record/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM records WHERE id_record = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    return res.json({ message: "Запись удалена" });
  } catch (err) {
    console.error("Ошибка /api/record/:id:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.put("/api/editrecord/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, login, password, notes, needMasterKey } = req.body;

    if (!title || !password) {
      return res.status(400).json({ message: "Нет данных" });
    }

    const encryptedData = {
      title: encrypt(title || ""),
      login: encrypt(login || ""),
      password: encrypt(password || ""),
      notes: encrypt(notes || ""),
    };

    const result = await pool.query(
      `UPDATE records
       SET title = $1,
           login = $2,
           password = $3,
           description = $4,
           need_a_master_key = $5,
           date_of_creation = NOW()
       WHERE id_record = $6
       RETURNING *`,
      [
        encryptedData.title,
        encryptedData.login,
        encryptedData.password,
        encryptedData.notes,
        Boolean(needMasterKey),
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    return res.json({ message: "Запись изменена" });
  } catch (err) {
    console.error("Ошибка /api/editrecord/:id:", err);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});