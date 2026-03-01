// const express = require("express");
// const path = require("path");
// const mysql = require("mysql2/promise");

// const app = express();
// const PORT = process.env.PORT || 8080;

// const dbConfig = {
//   host: process.env.DB_HOST || "db",
//   port: Number(process.env.DB_PORT || 3306),
//   user: process.env.DB_USER || "appuser",
//   password: process.env.DB_PASSWORD || "apppass",
//   database: process.env.DB_NAME || "myapp"
// };

// let pool;

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function initDb() {
//   for (let i = 1; i <= 20; i++) {
//     try {
//       pool = mysql.createPool({
//         ...dbConfig,
//         waitForConnections: true,
//         connectionLimit: 10
//       });

//       const conn = await pool.getConnection();

//       await conn.query(`
//         CREATE TABLE IF NOT EXISTS page_visits (
//           id INT PRIMARY KEY,
//           visits INT NOT NULL DEFAULT 0
//         )
//       `);

//       await conn.query(`
//         INSERT INTO page_visits (id, visits)
//         VALUES (1, 0)
//         ON DUPLICATE KEY UPDATE id = id
//       `);

//       conn.release();
//       console.log("MySQL connected successfully.");
//       return;
//     } catch (err) {
//       console.log(`DB not ready yet (${i}/20): ${err.message}`);
//       await sleep(3000);
//     }
//   }

//   throw new Error("Could not connect to MySQL after multiple attempts.");
// }

// // ملفات الموقع
// app.use(express.static(path.join(__dirname, "public")));

// // فحص صحة التطبيق
// app.get("/health", (req, res) => {
//   res.status(200).send("ok");
// });

// // فحص الاتصال بقاعدة البيانات
// app.get("/db-check", async (req, res) => {
//   try {
//     const [rows] = await pool.query("SELECT NOW() AS db_time");
//     res.json({
//       ok: true,
//       db_time: rows[0].db_time
//     });
//   } catch (err) {
//     res.status(500).json({
//       ok: false,
//       error: err.message
//     });
//   }
// });

// // عداد زيارات مخزن في MySQL
// app.get("/visit", async (req, res) => {
//   try {
//     await pool.query("UPDATE page_visits SET visits = visits + 1 WHERE id = 1");
//     const [rows] = await pool.query("SELECT visits FROM page_visits WHERE id = 1");

//     res.json({
//       visits: rows[0].visits
//     });
//   } catch (err) {
//     res.status(500).json({
//       error: err.message
//     });
//   }
// });

// // 404
// app.use((req, res) => {
//   res.status(404).send("Not Found");
// });

// initDb()
//   .then(() => {
//     app.listen(PORT, "0.0.0.0", () => {
//       console.log(`Server running on http://0.0.0.0:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("App startup failed:", err.message);
//     process.exit(1);
//   });

const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 8080;

// لكي يستطيع Express قراءة بيانات الفورم
app.use(express.urlencoded({ extended: true }));

// لكي يقدّم ملفات الموقع الثابتة
app.use(express.static(path.join(__dirname, "public")));

const dbConfig = {
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppass",
  database: process.env.DB_NAME || "myapp"
};

let pool;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initDb() {
  for (let i = 1; i <= 20; i++) {
    try {
      pool = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10
      });

      const conn = await pool.getConnection();

      await conn.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          content VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      conn.release();
      // console.log("MySQL connected successfully.");
         console.log("MySQL connected successfully. DdhshdsdjsdhdEV MODE");
      return;
    } catch (err) {
      console.log(`DB not ready yet (${i}/20): ${err.message}`);
      await sleep(3000);
    }
  }

  throw new Error("Could not connect to MySQL after multiple attempts.");
}

// health check
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.get("/test", (req, res) => {
  res.send("nodemon works");
});
// جلب كل الملاحظات
app.get("/api/notes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, content, created_at FROM notes ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة ملاحظة جديدة
app.post("/api/notes", async (req, res) => {
  try {
    const content = (req.body.content || "").trim();

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    await pool.query("INSERT INTO notes (content) VALUES (?)", [content]);
    res.status(201).json({ message: "Note created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف ملاحظة
app.post("/api/notes/:id/delete", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM notes WHERE id = ?", [id]);
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/db-check", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS db_time");
    res.json({
      ok: true,
      db_time: rows[0].db_time
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("App startup failed:", err.message);
    process.exit(1);
  });