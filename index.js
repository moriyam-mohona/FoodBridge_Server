const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://food-bridge-96dfc.web.app"],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z3gfp8c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("FoodBridge");

    const featuredCollection = db.collection("FeaturedFoods");
    const requestedCollection = db.collection("RequestedFoods");

    app.get("/FeaturedFoods", async (req, res) => {
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/FeaturedFoods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await featuredCollection.findOne(query);
      res.send(result);
    });

    app.post("/FeaturedFoods", async (req, res) => {
      const addFood = req.body;
      const result = await featuredCollection.insertOne(addFood);
      res.send(result);
    });

    app.put("/FeaturedFoods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;

      try {
        // console.log("Updating food with ID:", id);
        // console.log("Updated food data:", updatedFood);

        const query = { _id: new ObjectId(id) };

        // Fetch existing food details
        const existingFood = await featuredCollection.findOne(query);

        // Merge updated fields into existing food details
        const mergedFood = { ...existingFood, ...updatedFood };

        // Update the document in the collection
        const result = await featuredCollection.replaceOne(query, mergedFood);

        console.log("Update result:", result);

        res.send(result);
      } catch (error) {
        console.error("Error updating food:", error);
        res.status(500).send("Failed to update food.");
      }
    });

    app.delete("/FeaturedFoods/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await featuredCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error deleting food:", error);
        res.status(500).send("Failed to delete food.");
      }
    });

    app.post("/requestedFoods", async (req, res) => {
      const requestData = req.body;

      try {
        const result = await requestedCollection.insertOne(requestData);

        const deleteResult = await featuredCollection.deleteOne({
          _id: new ObjectId(requestData._id),
        });

        res.send({ result, deleteResult });
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Failed to request food");
      }
    });

    // Get all requested foods
    app.get("/requestedFoods", async (req, res) => {
      const userEmail = req.query.userEmail;
      try {
        const cursor = requestedCollection.find({ userEmail });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching requested foods:", error);
        res.status(500).send("Failed to fetch requested foods.");
      }
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Food Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
