import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const UserSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', UserSchema);

export default User;
