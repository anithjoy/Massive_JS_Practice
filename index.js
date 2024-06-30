const express = require("express");
const massive = require("massive");
const path = require("path");
const fs = require("fs").promises;

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to the database
const connectionString = "postgres://postgres:******@localhost/Stevens";

async function runInitScript(db) {
  try {
    const initScript = await fs.readFile(
      path.join(__dirname, "db", "init.sql"),
      "utf8"
    );
    await db.query(initScript);
    console.log("Initialization script executed successfully");
  } catch (err) {
    console.error("Error running initialization script:", err);
  }
}

massive({
  connectionString,
  scripts: path.join(__dirname, "db"),
})
  .then(async (db) => {
    app.set("db", db);
    console.log("Connected to the database");

    // to populate the database with some initial data
    // await runInitScript(db);
  })
  .catch((err) => console.log(err));

//   Routes
app.get("/users", async (req, res) => {
  const db = req.app.get("db");
  try {
    const users = await db.users.find();
    console.log(users);
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/users", async (req, res) => {
  const db = req.app.get("db");
  const { user, email } = req.body;
  try {
    const newUser = await db.users.insert({ name: user, email: email });
    return res.status(200).json(newUser);
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users/:id", async (req, res) => {
  const db = req.app.get("db");
  const { id } = req.params;
  try {
    const user = await db.users.findOne({ id });
    if (user) {
      console.log(user);
      return res.status(200).json(user);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/users/:id", async (req, res) => {
  const db = req.app.get("db");
  const { id } = req.params;
  const { user, email } = req.body;
  try {
    const updatedUser = await db.users.update(
      { id },
      { name: user, email: email }
    );
    if (updatedUser) {
      console.log(updatedUser);
      return res.status(200).json(updatedUser);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/users/:id", async (req, res) => {
  const db = req.app.get("db");
  const id = req.params.id;
  try {
    const deletedUser = await db.users.destroy({ id });
    console.log(deletedUser);
    if (deletedUser) {
      return res.status(200).json({ message: "User deleted successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
