import mongoose from 'mongoose';

import CoordinatesSchema from './Coordinates';


const Schema = mongoose.Schema;

const PlaceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  coordinates: {
    type: CoordinatesSchema,
    required: true
  }
});

const Place = mongoose.model('Place', PlaceSchema);

export default Place;
