import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const TagSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Tag = mongoose.model('Tag', TagSchema);

export default Tag;
