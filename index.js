const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

// mongodb

const uri =
  "mongodb+srv://houseHanter:U9PIJ7sIICogIL4s@cluster0.pkfik7i.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("houseHunterDB").collection("users");
    const propertyCollection = client
      .db("houseHunterDB")
      .collection("property");
    // Auth related work
    app.post("/jwt", async (req, res) => {
      const loginUser = req.body;
      const token = jwt.sign(loginUser, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // user sing up code
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user.password);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;

      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // user login code

    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.send({ success: false, message: "User not found" });
        }

        // console.log("Provided Password:", password);
        // console.log("Provided Password Hash:", await bcrypt.hash(password, 10));
        // console.log("Stored Password Hash:", user.password);
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password Match Result:", passwordMatch);

        if (passwordMatch) {
          res.send({ success: true, message: "Login successful" });
        } else {
          res.send({ success: false, message: "Incorrect password" });
        }
      } catch (error) {
        console.error("Error during login:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });
    // total user
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Middleware to check if the user is authenticated
    const isAuthenticated = (req, res, next) => {
      if (req.session.userId && loggedInUsers.includes(req.session.userId)) {
        return next();
      }
      res.status(401).json({ message: "Unauthorized" });
    };

    app.post("/logout", isAuthenticated, (req, res) => {
      const userId = req.session.userId;
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Internal Server Error" });
        }
        // Remove the user from the logged-in users array
        loggedInUsers = loggedInUsers.filter((user) => user !== userId);
        res.json({ success: true, message: "Logout successful" });
      });
    });

    // owner post data in mongodb
    app.post("/owner", async (req, res) => {
      const data = req.body;
      const result = await propertyCollection.insertOne(data);
      res.send(result);
    });

    // get the property details
    app.get("/owner", async (req, res) => {
      const result = await propertyCollection.find().toArray();
      res.send(result);
    });
    //for id get
    app.get("/owner/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.findOne(query);
      res.send(result);
    });
    // for edit
    app.patch("/owner/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDetails = req.body;
      const details = {
        $set: {
          name: updatedDetails.Name,
          address: address.address,
          city: updatedDetails.city,
          bedrooms: updatedDetails.bedrooms,
          bathrooms: updatedDetails.bathrooms,
          roomsize: updatedDetails.roomsize,
          dueDate: updatedDetails.dueDate,
          RFM: updatedDetails.RFM,
          number: updatedDetails.number,
          url: updatedDetails.url,
        },
      };
      const result = await propertyCollection.updateOne(filter, details);
      res.send(result);
    });
    // for delete
    app.delete("/owner/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await propertyCollection.deleteOne(filter);
      res.send(result);
    });

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongodb
app.get("/", (req, res) => {
  res.send("House Hunter!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
