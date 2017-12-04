'use strict'

const express = require('express')
const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { sign, verify } = require('jsonwebtoken')
const { jwt, cookie } = require('config')


/*
const tryCatch = (fn, cb) => {
  let result, error
  try {
    result = fn()
  } catch (e) {
    error = e
  }
  cb(error, result)
}

passport.serializeUser((user, cb) => {
  const payload = {
    provider: user.provider,
    account: user.account,
  }
  tryCatch(() => sign(payload, jwt.secret), cb)
})

passport.deserializeUser((str, cb) => {
  tryCatch(() => verify(str, jwt.secret), cb)
})

// Use google auth to log in
// clientID & clientSecret → https://console.cloud.google.com/apis/credentials
passport.use(new GoogleStrategy(
  {
    clientID: google.clientId,
    clientSecret: google.clientSecret,
    callbackURL: google.callbackURL,
  },
  (accessToken, refreshToken, profile, cb) => {
    const email = profile.emails.find(e => e.type === 'account')
    if (!email) {
      return cb(new Error('No account email found'))
    }
    // TODO check valid user
    cb(null, { provider: profile.provider, account: email.value })
  }
))
*/


const app = express()

app.get('/', (req, res) => res.send('Coucou'))


module.exports = app
