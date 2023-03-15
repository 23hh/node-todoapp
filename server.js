const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require("mongodb").MongoClient;

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
  db.collection("post").insertOne(
    { 제목: req.body.title, 날짜: req.body.date },
    function () {
      console.log("저장완료");
    }
  );
});
