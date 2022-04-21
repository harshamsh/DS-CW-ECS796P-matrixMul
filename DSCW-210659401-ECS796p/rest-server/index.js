const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { performance } = require("perf_hooks");
const matrixMul = require("./matrixMultiplication");
const utils = require("../utiF/tools");
const app = express();

app.use(cors());
app.use(fileUpload());

//connects to the home page of client
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
//posts the multiply request 
//Error handling when the expected files are not uploaded
app.post("/multiply", async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "No files are uploaded" });
  }
//Error handling when both matrix files are not uploaded
  if (!req.files.hasOwnProperty("A")) {
    return res.status(400).json({ error: 'File A is Empty' });
  }
  if (!req.files.hasOwnProperty("B")) {
    return res.status(400).json({ error: 'File B is Empty' });
  }

  //seting a default deadline time (20ms)
  const deadline = parseInt(req.body.deadline);

  const fileA = req.files.A.data.toString().trim();
  const fileB = req.files.B.data.toString().trim();

  const matrixA = utils.textToMatrix(fileA);
  const matrixB = utils.textToMatrix(fileB);

  const dimension = matrixA.length;

  // Dimension Check
  if (matrixA.length !== matrixB.length) {
    return res
      .status(400)
      .json({ error: "dimension missmatch, enter matrixs of same size" });
  }

  // Error handling to make sure the input matrix is a square matrix
  if (!utils.powerOfTwo(dimension)) {
    return res.status(400).json({
      error: "Given Matrix is Not Square Matrix",
    });
  }

  try {
    const per1 = performance.now();
    const resultantM = await matrixMul(
      matrixA,
      matrixB,
      deadline
    );
    const per2 = performance.now();
    const totalTimeTaken = (per2 - per1) / 1000;

    console.log(
      "matrix size of " +
        resultantM[0].length +
        " has Returned. " +
        totalTimeTaken.toFixed(4) +
        " seconds with deadline: " +
        deadline+"ms"
    );
    res.json(resultantM).status(200);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("client is connected to the port " + port);
});
