import express from 'express';
import 'babel-polyfill';
import dotenv from 'dotenv';
import boom from 'express-boom';

import connectWithMongo from './db';
import {
  adminRouter,
  opinionsRouter,
  placesRouter,
  tagsRouter,
  usersRouter,
} from './controllers';


dotenv.config();
connectWithMongo();

const app = express();
app.use(express.json());
app.use(require('cors')());
app.use(boom());
app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || 'localhost');


const requestLogger = (req, res, next) => {
  const separator = (count) => '-'.repeat(count);
  console.info(separator(35) + ' REQUEST ' + separator(36));
  console.info(req.method + ' ' + req.path);
  console.info('Authorization: ' + (req.headers['authorization'] || 'none'));
  console.info(req.body);
  console.info('\n');
  next();
};

const router = express.Router();
app.use('/api/v1', requestLogger, router);

router.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Welcome in Hello Mountains api!',
  })
});


app.use('/api/v1/users', usersRouter);
app.use('/api/v1/places', placesRouter);
app.use('/api/v1/opinions', opinionsRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/admin', adminRouter);


app.use((req, res) => {
  return res.boom.notFound();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.boom.badImplementation();
});

app.listen(app.get('port'), () => {
  console.log(`Express started on http://${app.get('host')}:${app.get('port')}/api/v1/; press Ctrl-C to terminate.`);
});

export default app;
