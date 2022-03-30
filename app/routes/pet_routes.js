// import our dependecies, middleware and models 
const express = require('express')
const passport = require('passport')

// pull in our model
const Pet = require('../models/pet')

// helps us detect certain situations and send custom errors
const customErrors = require('../../lib/custom_errors')
// this function sends a 404 when non-existent document is requested
const handle404 = customErrors.handle404
// middleware that can send a 401 when a user tries to access something they do not own
const requireOwnership = customErrors.requireOwnership
// requireToken is passed as a second arg to router.<verb> 
// makes it so that a token MUST be passed for that route to be available --> also sets 'req.user'
const requireToken = passport.authenticate('bearer', { session: false })
// this middleware removes any blank fields from req.body
const removeBlanks = require('../../lib/remove_blank_fields')
const { handle } = require('express/lib/application')

// instantiate our router
const router = express.Router()

// ROUTES GO HERE

// INDEX
// get /pets
router.get('/pets', (req, res, next) => {
    // we will allow all users to view the pets by skipping 'require
    Pet.find()
        .populate('owner')
        .then(pets => {
            // pets will be an array of mongoose documents
            // we want to turn them into js objects
            // .map returns a new array
            return pets.map(pet => pet.toObject())
        })
        .then(pets=> res.status(200).json({ pets }))
        .catch(next)
})
// SHOW
// get /pets/:id
router.get('/pets/:id', (req,res,next) =>{
    // remember we ge the id from req.params.id => comes from :id
    Pet.findById(req.params.id)
        .populate('owner')
        .then(handle404)
        // if its sucessful, respond with an object as JSON
        // otherwise pass to error handler
        .then(pet => res.status(200). json({ pet: pet.toObject() }))
        .catch(next)
})

// CREATE
// Post /pets
router.post('/pets', requireToken, (req, res, next) => {
    // we brought in require token so we can have access to req.user
    req.body.pet.owner = req.user.id
    Pet.create(req.body.pet)
        .then(pet => {
            // send a successful response like so
            res.status(201).json({ pet: pet.toObject() })

        })
        // if an error occurs pass it to the error handler
        .catch(next)
})

// UPDATE
// patch /pets/:id
router.patch('/pets/:id', requireToken, removeBlanks, (req, res, next) => {
    // if the client attempts to change the owner of the pet
    // we can disallow it 
    delete req.body.owner
    // then we find the pet by the id
    Pet.findById(req.params.id)
    // handle our 404
        .then(handle404)
    // requireOwnership and update the pet
        .then(pet => {
            requireOwnership(req, pet)
            return pet.updateOne(req.body.pet)
        })
    // send a 204 no content if success
        .then(() => res.sendStatus(204))
    // pass tp teh error handler if not successful
        .catch(next)
})

// REMOVE(DELETE/DESTROY)
// delete /pets/:id
router.delete('/pets/:id', requireToken, (req, res, next) => {
    // then find the pet by id
    Pet.findById(req.params.id)
    // first handle the 404 if any 
    .then(handle404)
    // use requireOwnership middle to make sure the
    // right person is making the request
    .then(pet => {
        // requireOwnership needs two arguements
        // these are the req, and the document itself
        requireOwnership(req, pet)
        // delete is teh middleware doenst send an error
        pet.deleteOne()
    })
    // send back a 204 no content status
    .then(() => res.sendStatus(204))
    // if error occus pass to the handler
    .catch(next)
})

// ROUTES ABOVE HERE

// keep at bottom of file
module.exports = router