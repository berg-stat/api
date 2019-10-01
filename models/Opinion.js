import mongoose from 'mongoose';
import User from './User';
import Place from './Place';
import Tag from './Tag';
import Report from './Report';


const Schema = mongoose.Schema;

const OpinionSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  place: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  text: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  tags: {
    type: [Tag.schema]
  },
  likes: {
    type: [String],
    default: []
  },
  reports: {
    type: [Report.schema],
    default: []
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

const Opinion = mongoose.model('Opinion', OpinionSchema);

export default Opinion;
