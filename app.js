const express = require("express");
const app = express();
const indexRouter = require("./routers/indexRouter.js");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.use("/", indexRouter);

const port = process.env.PORT;
app.listen(port || 3000, () => {
	console.log(`Listen on localhost:${port || 3000}`);
});
