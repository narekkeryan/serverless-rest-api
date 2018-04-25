const mongoose = require('mongoose');
const CitySchema = new mongoose.Schema({
    name: String,
    postalCode: String,
    country: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Country' }]
});
module.exports = mongoose.model('City', CitySchema);