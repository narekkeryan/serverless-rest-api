'use strict';

require('dotenv').config({path: './variables.env'});

const connectToDatabase = require('./database');
const cities = require('cities.json');
const zipcodes = require('zipcodes');
const Country = require('./models/Country');
const City = require('./models/City');

module.exports.createCountry = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    let body = JSON.parse(event.body);

    let data = [];
    for (let bodyItem of body) {
        data.push({ name: bodyItem.name, code: bodyItem.alpha2Code });
    }

    connectToDatabase()
        .then(() => Country.create(data))
        .then(countries => callback(null, {
            statusCode: 200,
            body: JSON.stringify(countries)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCountries = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    connectToDatabase()
        .then(() => Country.find())
        .then(countries => callback(null, {
            statusCode: 200,
            body: JSON.stringify(countries)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.createCity = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    connectToDatabase()
        .then(() => Country.find({}, { code: 1 }))
        .then(countries => {
            let formatedCountries = {};
            countries.forEach(country => {
                formatedCountries[country.code] = country._id;
            });

            let data = [], cityNames = [];
            for (let city of cities) {
                if (cityNames.includes(city.name)) {
                    continue;
                }
                cityNames.push(city.name);
                let zips = zipcodes.lookupByName(city.name, city.country);
                if (zips.length) {
                    let postalCode = zips[0].zip;
                    if (postalCode) {
                        data.push({ name: city.name, postalCode: postalCode, country: formatedCountries[city.country] });
                    }
                }
            }
            City.create(data)
                .then(cities => callback(null, {
                    statusCode: 200,
                    body: JSON.stringify(cities)
                }))
                .catch(err => callback(null, {
                    statusCode: err.statusCode || 500,
                    headers: { 'Content-Type': 'text/plain' },
                    body: err.message
                }));
        })
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCities = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    connectToDatabase()
        .then(() => City.find().populate('country').exec())
        .then(cities => callback(null, {
            statusCode: 200,
            body: JSON.stringify(cities)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCountriesByName = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    let name = event.pathParameters.name.replace(/%20/g, " ");

    connectToDatabase()
        .then(() => Country.find({ name: { $regex: '.*' + name + '.*' } }))
        .then(countries => callback(null, {
            statusCode: 200,
            body: JSON.stringify(countries)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCitiesByName = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    let name = event.pathParameters.name.replace(/%20/g, " ");

    connectToDatabase()
        .then(() => City.find({ name: { $regex: '.*' + name + '.*' } }).populate('country').exec())
        .then(cities => callback(null, {
            statusCode: 200,
            body: JSON.stringify(cities)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCitiesByCountryName = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    let name = event.pathParameters.name.replace(/%20/g, " ");

    connectToDatabase()
        .then(() => Country.find({ name: { $regex: '.*' + name + '.*' } }, { _id: 1 }))
        .then(countries => {
            let ids = countries.map(country => country._id);
            return City.find({ country: { $in: ids } }).populate('country').exec();
        })
        .then(cities => callback(null, {
            statusCode: 200,
            body: JSON.stringify(cities)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};

module.exports.getCityByPostal = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    let zip = event.pathParameters.zip.replace(/%20/g, " ");

    connectToDatabase()
        .then(() => City.find({ postalCode: zip }).populate('country').exec())
        .then(city => callback(null, {
            statusCode: 200,
            body: JSON.stringify(city)
        }))
        .catch(err => callback(null, {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: err.message
        }));
};