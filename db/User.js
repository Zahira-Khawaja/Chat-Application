require('dotenv').config();
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const url = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose.connect(url);

const userSchema = new mongoose.Schema({
    username:String,
    password:String,
    firstName:String,
    lastName:String,
    googleId:String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

module.exports = mongoose.model('User',userSchema);