const express = require('express');
const Company = require('../models/Company');
const offerRoutes = express.Router();
const Offer = require('../models/Offer');
const mongoose = require('mongoose');
const {User} = require('../models/User');

//GET offer details
offerRoutes.get('/offer/:offerID', (req, res, next) => {
  const {offerID} = req.params

  Offer.findById(offerID).
  then(offerFromDB => {
    res.status(200).json(offerFromDB);
  })
  .catch(error => res.json(error));
});

//POST new offer

offerRoutes.post('/offer', (req, res, next) => {

  var publisher = req.session.passport.user;
  var newOffer = new Offer({publisher,...req.body})

  console.log(newOffer)

  Offer.create(newOffer)
  .then(createdOffer => {
    console.log('new offer id: ', createdOffer._id)
    console.log('publisher: ', createdOffer.publisher)
    return Company.findByIdAndUpdate(createdOffer.publisher, {
      $push: { offers: createdOffer._id }
    })
    .then(response => res.json(response))
    .catch(error => res.json(error)); //catch-companyFindByIdAndUpdate
  })
  .catch(error => res.json(error));//catch-Offer.create



});//offerRoutes.post

//PUT edit offer

offerRoutes.put('/offer/:offerID', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.offerID)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  Offer.findByIdAndUpdate(req.params.offerID, req.body)
  .then(() => {
    res.json({ message: `Offer ${req.params.offerID} updated` });
  })
  .catch(error => res.json(error))
});

//DELETE offer

offerRoutes.delete('/offer/:offerID', (req, res, next) => {
  
  if (!mongoose.Types.ObjectId.isValid(req.params.offerID)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  Offer.findByIdAndRemove(req.params.offerID)
  .then(() => {
    res.json({ message: `Offer ${req.params.id} deleted.` });
  })
  .catch(error => {
    res.json(error);
  });

});

//PUT apply to offer

offerRoutes.put('/offer/:offerID/apply', (req, res, next) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.offerID)) {
    res.status(400).json({ message: 'Specified id is not valid' });
    return;
  }

  var applicant = req.session.passport.user;
  var {offerID} = req.params;

  //Check that the User is a Seeker

  User.findById(applicant)
  .then(userFromDB => {
    if(userFromDB.kind !== 'Seeker') {
      res.status(400).json({message: 'Only seekers can apply to offers'});
      return;
    }
  })
  .catch(error => res.json(error));

  //Push the offerID into the appliedOffers array of the Seeker

  User.findByIdAndUpdate(applicant, {
    $push: {offers: offerID}
  })
  .then(response => {
    Offer.findByIdAndUpdate(offerID, {
      $push: {candidates: applicant}
    })
    .then(() => console.log('Succesfully applied to offer'))
    .catch(error => res.json(error))
    res.status(200).json(response)
  })
  .catch(theError => res.json(theError))

});


module.exports = offerRoutes;