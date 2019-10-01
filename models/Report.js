import mongoose from 'mongoose';


const ReportReasons = [
  'misleading',
  'vulgar',
  'faulty'
];

const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opinion: {
    type: Schema.Types.ObjectId,
    ref: 'Opinion',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: false
  },
});

const Report = mongoose.model('Report', ReportSchema);

export default Report;
export { ReportReasons };
