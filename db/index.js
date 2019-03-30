import dotenv from 'dotenv'

dotenv.config();
const mongoose = require('mongoose');

const connectWithMongoose = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/berg-stat', {useNewUrlParser: true});
    const db = mongoose.connection;
  } catch (error) {
    console.log(error)
  }
}

export default connectWithMongoose