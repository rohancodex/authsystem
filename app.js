require("dotenv").config();
require("./config/database.js").connect();

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const User = require("./model/user");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth")
const cookieParser = require("cookie-parser")

//swagger docs
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

app.use(cookieParser())

//use inbuilt body parser of express
app.use(express.json());

// use swagger docs api
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => res.send("<h1>Hello World!</h1>"));

app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!(email && password && firstname && lastname)) {
      return res.status(400).send("All fields are required");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(401).send("User already exits");
    }

    const myEncPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email: email.toLowerCase(),
      password: myEncPassword,
    });

    //token creation
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.SECRET_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;
    user.password = undefined;

    //success registeration
    // res.status(201).json(user);
    const options = {
      expires: new Date(Date.now()+2*60*60*1000),
      httpOnly: true,
    };
    res.status(200).cookie("token",token,options).json({
      success:true,
      token,
      user
    })
  } catch (error) {
    console.error(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("Email or password is not entered");
    }

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.SECRET_KEY,
        {
          expiresIn: "2h",
        }
      );
      user.token = token;
      user.password = undefined;
      res.status(200).json(user);
    }

    res.status(400).send("Email or password is incorrect");
  } catch (error) {
    console.error(error);
  }
});

app.get("/dashboard",auth,async(req,res)=>{
  res.status(200).send("Secret info");
})

module.exports = app;
