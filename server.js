const express = require('express');
const path = require('path')
const url = require('url')
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { exec } = require('child_process')

const app = express();
const port = process.env.PORT || 8000;
var connected_users = []

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true)

var db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});

db.serialize(function() {
  db.run(`CREATE TABLE IF NOT EXISTS users
          (
            id INTEGER PRIMARY KEY,
            name TEXT,
            company TEXT,
            password TEXT,
            email TEXT,
            phone TEXT
          );`,
        (err) => {
          if(err) {
            console.log('Error: ', err)
          }
        })
})

db.serialize(function() {
  db.run(`CREATE TABLE IF NOT EXISTS library
          (
            id INTEGER PRIMARY KEY,
            user INTEGER,
            name TEXT,
            company TEXT,
            email TEXT,
            phone TEXT,
            FOREIGN KEY (user) REFERENCES users (id)
          );`,
        (err) => {
          if(err) {
            console.log('Error: ', err)
          }
        })
})

app.get("/epitech-logo", (req, res) => {
  res.sendFile(path.join(__dirname+"/Epitech.png"));
});

app.get("/", (req, res) => {
  let is_loged = 0;
  for(i=0; i<connected_users.length; i++) {
    if(connected_users[i].ip == req.ip) { is_loged = 1;}
  }

  if(is_loged == 0) {
    res.sendFile(path.join(__dirname+"/login.html"));
  } else {
    res.sendFile(path.join(__dirname+"/user_recap.html"));
  }
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname+"/index.html"));
});

app.get("/library", (req, res) => {
  res.sendFile(path.join(__dirname+"/add_library.html"));
});

app.get("/list_library", (req, res) => {
  res.sendFile(path.join(__dirname+"/list_library.html"));
});

app.post("/login", (req, res) => {
  let user = req.body.username;
  let pass = req.body.password;
  db.all("SELECT * FROM users WHERE name = ? and password = ?", [user, pass], function(err, rows) {
    if(rows.length != 0) {
      connected_users.push({"name":user, "id":rows[0].id, "ip":req.ip, "time":Date.now()})
      console.log(connected_users)
    }
    res.redirect("/");
  })
});

app.post("/logout", (req, res) => {
  connected_users = connected_users.filter(function(value, index, arr){
    return value.ip != req.ip;
  })
  return res.redirect("/");
});

app.post("/adduser", (req, res) => {
  let name_ = req.body.name;
  let company_ = req.body.company;
  let pass_ = req.body.password;
  let email_ = req.body.email;
  let phone_ = req.body.phone
  db.run("INSERT INTO 'users' ('name', 'company', 'email', 'password', 'phone') VALUES (?, ?, ?, ?, ?)", [name_, company_, email_, pass_, phone_ ], (err) => {
    if (err) {
      console.log("Error: ", err)
    }
  })
  res.redirect("/");
});

app.post("/deluser", (req, res) => {
  let name_ = req.body.name;

  db.run("DELETE FROM users where name = ? ", name_, (err) => {
    if (err) {
      console.log("Error: ", err)
    }
  })

  connected_users = connected_users.filter(function(value, index, arr){
    return value.name != name_;
  })

  res.redirect("/");
});

app.post("/get_users", (req, res) => {
  if(req.body.mode == '0') {
    db.all("SELECT * FROM users", function(err, rows) {
      res.json(rows);
    })
  } else {
    res.json(connected_users)
  }

})

app.post("/addlibrary", (req, res) => {
  let name_ = req.body.name;
  let company_ = req.body.company;
  let email_ = req.body.email;
  let phone_ = req.body.phone;
  let user_;

  for(i=0; i<connected_users.length; i++) {
    if(connected_users[i].ip == req.ip) { user_ = connected_users[i].id;}
  }

  db.run("INSERT INTO 'library' ('name', 'company', 'email', 'phone', 'user') VALUES (?, ?, ?, ?, ?)", [name_, company_, email_, phone_, user_ ], (err) => {
  if (err) {
    console.log("Error: ", err)
  }
  })
  res.redirect("/");
});

app.post("/dellibrary", (req, res) => {
  let name_=req.body.name;
  let user_=req.body.usrd

  console.log("userdid: " + req.body.userd)

  db.run("DELETE FROM library where name = ? AND user = ? ", [name_, user_], (err) => {
    if (err) {
      console.log("Error: ", err)
    }
  })

  res.redirect("/library")
});

app.post("/get_library", (req, res) => {
  let user_;

  for(i=0; i<connected_users.length; i++) {
    if(connected_users[i].ip == req.ip) { user_ = connected_users[i].id;}
  }

  db.all("SELECT * FROM library WHERE user = ?", [user_], function(err, rows) {
    res.json(rows);
  })
})

app.use((req, res) => {
              res.status(404);
              res.send("Page not found!");
          });

var server = app.listen(port, "127.0.0.1", () => {
    var host = server.address().address;
    console.log('Server Running t http://' + host + ':' + port);
});
