const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Car Medic server is running');
});

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.d0roctp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('carMedic').collection('services');

        const orderCollection = client.db('carMedic').collection('orders');

        //get all services
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        //get a specific service
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //get all orders
        app.get('/orders', async (req, res) => {
            // console.log(req.query.email);

            let query = {};

            if (req.query.email) {
                query = { email: req.query.email };
            }

            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        //post an order
        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(order);

            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(error => console.log(error))


app.listen(port, () => {
    console.log(`Car Medic is running on port: ${port}`);
});