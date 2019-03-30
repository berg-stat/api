import express from 'express'
import 'babel-polyfill'
import dotenv from 'dotenv'
import usersRouter from './controllers/Users'
import connectWithMongoose from "./db";

dotenv.config();
connectWithMongoose();

const app = express();
app.use(express.json());
app.use(require('cors')());
app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || 'localhost');


const router = express.Router();
app.use('/api', router);

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome in BERG STAT api!',
  })
});

app.use('/users', usersRouter);


// 404 && 500
app.use((req, res) => {
  res.status(404).json({ message: '404 - Not Found' })
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '500 - Server Error' })
});

app.listen(app.get('port'), () => {
  console.log('Express started on http://' + app.get('host') + ':' +
    app.get('port') + '/api/; press Ctrl-C to terminate.')
});

export default app
