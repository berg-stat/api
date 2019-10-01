import mongoose from 'mongoose';


const mongoUrls = {
  development: 'DATABASE_URL_DEV',
  test: 'DATABASE_URL_TEST'
};

const connectWithMongo = async () => {
  try {
    const url = process.env[mongoUrls[process.env.NODE_ENV]];
    await mongoose.connect(url, { useNewUrlParser: true });
  } catch (error) {
    console.error(error);
    process.exit();
  }
};

export default connectWithMongo;
