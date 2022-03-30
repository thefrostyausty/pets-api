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

// POST -> create a toy
// post /toys/pet_id
router.post('/toys/:petId', (req, res, next) =>{
    // get our toy from req.body
    const toy = req.body.toy
    // get our petId from req.params.id
    const petId = req.params.petId
    // find the pet
    Pet.findById(petId)
        // handle what ahppens if no pet found
        .then(handle404)
        .then(pet => {
            console.log('this is the pet', pet)
            console.log('this is the toy', toy)
            // push the toy to the toys array
            pet.toys.push(toy)
            // save teh pet
            return pet.save()

        })
        // then we sent the pet as json
        .then(pet => res.status(201).json({ pet: pet }))
        // catch errors and send to the handler
        .catch(next)
    }) 

// PATCH -> update a toy
// patch -> /toys/pet_id/toy_id
router.patch('/toys/:petId:toyId', requireToken, removeBlanks, (req, res, next) => {
    const toyId = req.params.toyId
    const petId = req.params.petId

    Pet.findById(petId)
        .then(handle404)
        .then(pet => {
            const theToy = pet.toys.id(toyId)
            console.log('this is the original toy', theToy)
            requireOwnership(req, pet)
            theToy.set(req.body.toy)
            return pet.save()
        })
        // .then(data => {
        //     console.log('this is data in update', data)
        //     data.theToy.set({ toy: req.body.toy })

        //     return data.pet.save()
        // })
        .then(() => res.sendStatus(204))
        .catch(next)
})


// DELETE -> delete a toy
// delete -> /toys/pet_id/toy_id
router.delete('/toys/:petId:toyId', requireToken, (req, res, next) =>{
    // saving both ids to variables make it easier for reference
    const toyId = req.params.toyId
    const petId = req.params.petId
    // find the pet in teh database
    Pet.findById(petId)
        // if pet not found throw 404
        .then(handle404)
        .then(pet => {
            // get specific subdocument by its id
            const theToy = pet.toys.id(toyId)
            // require that the deleter is the owner of the pet
            requireOwnership(req, pet)
            // call remove ont he toy we got 
            theToy.remove()

            return pet.save()
        })
        .then(() => res.sendStatus(204))
        .catch(next)
})

module.exports = router