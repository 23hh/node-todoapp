const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
const methodOverride = require("method-override");
require("dotenv").config();
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

app.use("/public", express.static("public"));

var db;
MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) return console.log(err);
    db = client.db("todoapp");

    app.listen(process.env.PORT, () => {
      console.log("listening on 8080");
    });
  }
);

app.get("/", (req, res) => {
  db.collection("post")
    .find()
    .toArray((err, data) => {
      console.log(data);
      res.render("index.ejs", { posts: data });
    });
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.post("/add", function (req, res) {
  db.collection("counter").findOne({ name: "게시물갯수" }, (err, data) => {
    console.log("test" + err);
    let totalPost = data.totalPost;

    db.collection("post").insertOne(
      { _id: totalPost + 1, 제목: req.body.title, 날짜: req.body.date },
      () => {
        console.log("저장완료");
        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          (err, data) => {
            if (err) {
              return console.log(err);
            }
          }
        );
      }
    );
    db.collection("post")
      .find()
      .toArray((err, data) => {
        console.log(data);
        res.render("list.ejs", { posts: data });
      });
  });
});

app.get("/list", (req, res) => {
  db.collection("post")
    .find()
    .toArray((err, data) => {
      console.log(data);
      res.render("list.ejs", { posts: data });
    });
});

app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(res.body, (err, data) => {
    console.log("삭제완료");
  });
  res.status(200).send({ message: "성공" });
});

app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, data) => {
      console.log(data);
      res.render("detail.ejs", { posts: data });
    }
  );
});

app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, data) => {
      console.log(req.params.id);
      res.render("edit.ejs", { post: data });
    }
  );
});

app.put("/edit", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    (err, data) => {
      console.log(err);
      res.redirect("./list");
    }
  );
});

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/mypage", loginCheck, (req, res) => {
  console.log(req.user);
  res.render("mypage.ejs", { user: req.user });
});

function loginCheck(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("login fail");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    (입력한아이디, 입력한비번, done) => {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne({ id: 입력한아이디 }, (err, data) => {
        if (err) return done(err);

        if (!data)
          return done(null, false, { message: "존재하지않는 아이디요" });
        if (입력한비번 == data.pw) {
          return done(null, data);
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

//로그인한 유저의 개인정보를 DB에서 찾는 역할
passport.deserializeUser((아이디, done) => {
  db.collection("login").findOne({ id: 아이디 }, (err, data) => {
    done(null, data);
  });
});

app.get("/fail", (req, res) => {
  res.render("fail");
});

//검색
app.get("/search", (req, res) => {
  let search = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: req.query.value,
          path: "제목", // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 10 },
    { $project: { 제목: 1, 날짜: 1, score: { $meta: "searchScore" } } },
  ];
  console.log(req.query);
  db.collection("post")
    .aggregate(search)
    .toArray((err, data) => {
      console.log(data);
      res.render("search.ejs", { posts: data });
    });
});
