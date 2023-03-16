const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");

var db;
MongoClient.connect(
  "mongodb+srv://lsh6166:test@cluster0.pgp2mwc.mongodb.net/todoapp?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (err, client) {
    if (err) return console.log(err);
    db = client.db("todoapp");

    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/pet", function (req, res) {
  res.send("펫용품 쇼핑할 수 있는 페이지");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

app.post("/add", function (req, res) {
  res.send("전송완료");
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
      res.render("detail.ejs", { data: data });
    }
  );
});
