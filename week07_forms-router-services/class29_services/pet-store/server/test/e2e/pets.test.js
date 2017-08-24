const db = require('./_db');
const request = require('./_request');
const assert = require('chai').assert;

describe('pets api', () => {
    
    before(db.drop);

    let store = null;    
    before(() => {
        return request.post('/api/stores')
            .send({ name: 'downtown' })
            .then(res => res.body)
            .then(savedStore => store = savedStore);
    });
    
    it('initial /GET returns empty list', () => {
        return request.get('/api/pets')
            .then(req => {
                const pets = req.body;
                assert.deepEqual(pets, []);
            });
    });

    let tweety = {
        name: 'Tweety',
        legs: 2
    };

    let garfield = {
        name: 'Garfield',
        legs: 4
    };

    let nagini = {
        name: 'Nagini',
        legs: 0
    };

    function savePet(pet) {
        pet.store = store._id;
        return request  
            .post('/api/pets')
            .send(pet)
            .then(res => res.body);
    }

    it('roundtrips a new pet', () => {
        return savePet(tweety)
            .then(saved => {
                assert.ok(saved._id, 'saved has id');
                tweety = saved;
            })
            .then(() => {
                return request.get(`/api/pets/${tweety._id}`);
            })
            .then(res => res.body)
            .then(got => {
                got.store = got.store._id;
                assert.deepEqual(got, tweety);
            });
    });

    it('GET returns 404 for non-existent id', () => {
        const nonId = '589d04a8b6695bbdfd3106f1';
        return request.get(`/api/pets/${nonId}`)
            .then(
                () => { throw new Error('expected 404'); },
                res => {
                    assert.equal(res.status, 404);
                }  
            );
    });

    it('returns list of all pets', () => {
        return Promise.all([
            savePet(garfield),
            savePet(nagini)
        ])
            .then(savedPets => {
                garfield = savedPets[0];
                nagini = savedPets[1];
            })
            .then(() => request.get('/api/pets'))
            .then(res => res.body)
            .then(pets => {
                assert.equal(pets.length, 3);
                assert.ok(pets.find(p => p._id === tweety._id));
                assert.ok(pets.find(p => p._id === garfield._id));
                assert.ok(pets.find(p => p._id === nagini._id));
            });
    });

    it('updates pet', () => {
        // human transform! :)
        nagini.legs = 2;
        return request.put(`/api/pets/${nagini._id}`)
            .send(nagini)
            .then(res => res.body)
            .then(updated => {
                assert.equal(updated.legs, 2);
            });
    });

    it('deletes a pet', () => {
        return request.delete(`/api/pets/${garfield._id}`)
            .then(res => res.body)
            .then(result => {
                assert.isTrue(result.removed);
            })
            .then(() => request.get('/api/pets'))
            .then(res => res.body)
            .then(pets => {
                assert.equal(pets.length, 2);
            });
    });

    it('delete a non-existent pet is removed false', () => {
        return request.delete(`/api/pets/${garfield._id}`)
            .then(res => res.body)
            .then(result => {
                assert.isFalse(result.removed);
            });
    });

    it('errors on validation failure', () => {
        return savePet({})
            .then(
                () => { throw new Error('expected failure'); },
                () => { }  
            );
    });

});