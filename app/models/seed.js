// seed is going to be a script that we can run from the terminal
// to create a bunch of pets at once

// we need to be careful with our seed and when we run it 
// it will remove all the pets first and then add new ones

const mongoose = require('mongoose')
const Pet = require('./pet')

const db = require('../../config/db')

const startPets = [
    { name: 'Sparky', type: 'dog', age: 2, adoptable: true},
    { name: 'Leroy', type: 'dog', age: 10, adoptable: true},
    { name: 'Biscuits', type: 'cat', age: 3, adoptable: true},
    { name: 'Hulk Hogan', type: 'hamster', age: 1, adoptable: true}
]

// first we connect to the database via mongoose
mongoose.connect(db, {
	useNewUrlParser: true,
})
    .then(()=>{
        // then we remove all the pets
        Pet.deleteMany({ owner: null })
        .then(deletedPets => {
            console.log('deleted pets', deletedPets)
            // then we create using the startPets array
            // we'll use console logs to chekc if it's working or if there are erros
            // then we close our connection to the db
                Pet.create(startPets)
                    .then(newPets => {
                        console.log('the new pets', newPets)
                        mongoose.connection.close()
                    })
                    .catch( err => {
                        console.log(err)
                        mongoose.connection.close()
                    })
            })
            .catch(error => {
                console.log(error)
                mongoose.connection.close()
            })
    })
    .catch(error => {
        console.log(error)
        mongoose.connection.close()
    })