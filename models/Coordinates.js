import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const CoordinatesSchema = new Schema({
  latitude: {
    type: Number,
    min: -90,
    max: 90,
    required: true
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180,
    required: true
  },
  elevation: {
    type: Number,
    min: 0,
    required: true
  }
});

export default CoordinatesSchema;
