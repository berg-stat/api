import mongoose from 'mongoose';


const connectWithMongoose = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL_DEV, {useNewUrlParser: true});
  } catch (error) {
    console.log(error)
  }
};

export default connectWithMongoose
