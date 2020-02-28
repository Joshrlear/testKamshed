const express = require('express')
const app = express()
const { faceDetect, faceVerify } = require('./faceApi')
const { ocr } = require('./textDetect')



/* ------------for firebase Auth-------------- */
const admin = require("firebase-admin");
const serviceAccount = require("./testkamshed-firebase-adminsdk-qbo7n-87c14b367b.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://testkamshed.firebaseio.com"
});




/* ------------for request-------------- */
const { multer } = require('./middleware')




let userInfo = {} // object that holds important response data


/* ------------request start-------------- */
app.post('/upload', multer.any(), async (req, res, next) => {

  if (!req.files || !req.body.userId) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const { userId } = req.body
  userInfo.userId = userId

  const [ idImage, userImage ] = req.files
  const unverifiedImages = [idImage.buffer, userImage.buffer]

  let faceIds = []
  
  const test = Promise.all([
      unverifiedImages.map(image => {
      Promise.all([
        faceDetect(image, faceIds)
        .then(result => {
          if (result) {
            const p = Promise.resolve(faceVerify(result))
            p.then(response => {
              userInfo.faceVerification = response
              res.send(userInfo)
            })
          }
        })
      ])
    }),
    userInfo.idText = await ocr(idImage.buffer)
  ])
  //test.then(() => res.send(userInfo))
}, () => {
  console.log(userInfo)
  return userInfo
})

module.exports = {
  app
}