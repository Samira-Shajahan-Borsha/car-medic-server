const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {

        client.connect();
        
        const serviceCollection = client.db('carMedic').collection('services');

        const orderCollection = client.db('carMedic').collection('orders');

        //generating jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        });


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
        app.get('/orders', verifyJWT, async (req, res) => {
            // console.log(req.query.email);
            const decoded = req.decoded;
            console.log('inside orders api', decoded);
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized access' });
            }
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email };
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });

        //post an order
        app.post('/orders', verifyJWT, async (req, res) => {
            const order = req.body;
            console.log(order);

            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        //update an order
        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            console.log(id);

            const filter = { _id: new ObjectId(id) };
            const updatedOrder = {
                $set: {
                    status: status
                }
            };
            const result = await orderCollection.updateOne(filter, updatedOrder);
            res.send(result);
        })

        //delete an order
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            console.log(id);

            const query = { _id: new ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(error => console.log(error))


app.listen(port, () => {
    console.log(`Car Medic is running on port: ${port}`);
});