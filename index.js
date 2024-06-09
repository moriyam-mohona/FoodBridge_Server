const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z3gfp8c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    const db = client.db("FoodBridge");
    const featuredCollection = db.collection("FeaturedFoods");
    const requestedCollection = db.collection("RequestedFoods");

    // Get all featured foods
    app.get("/FeaturedFoods", async (req, res) => {
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get a specific featured food by ID
    app.get("/FeaturedFoods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await featuredCollection.findOne(query);
      res.send(result);
    });

    // Add a new featured food
    app.post("/FeaturedFoods", async (req, res) => {
      const addFood = req.body;
      const result = await featuredCollection.insertOne(addFood);
      res.send(result);
    });

    // Update a featured food by ID
    app.put("/FeaturedFoods/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await featuredCollection.replaceOne(query, updatedFood);
        res.send(result);
      } catch (error) {
        console.error("Error updating food:", error);
        res.status(500).send("Failed to update food.");
      }
    });

    // Delete a featured food by ID
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

    // Add a requested food
    app.post("/requestedFoods", async (req, res) => {
      const requestData = req.body;
      const { foodId } = requestData;

      // Add to requested collection
      const result = await requestedCollection.insertOne(requestData);

      // Remove from featured collection
      const deleteResult = await featuredCollection.deleteOne({
        _id: new ObjectId(foodId),
      });

      res.send({ result, deleteResult });
    });

    // Get all requested foods
    app.get("/requestedFoods", async (req, res) => {
      const cursor = requestedCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

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

app.get("/", (req, res) => {
  res.send("Food Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
