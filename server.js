process.env.NODE_ENV !== 'production' && require('dotenv').config()
const express = require('express')
const path = require('path')
const morgan = require('morgan')
const { MongoClient } = require('mongodb')
const MoviesDao = require('./dao/movies.dao')
const UsersDao = require('./dao/users.dao')
const CommentsDao = require('./dao/comments.dao')
const movies = require('./routes/movies.route')
const users = require('./routes/users.route')

// app config
const port = process.env.PORT || 8000
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'build')))
process.env.NODE_ENV !== 'production' && app.use(morgan('dev'))

// register routes
app.use('/api/v1/movies', movies)
app.use('/api/v1/users', users)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')))
// app.use('*', (req, res) => res.status(404).json({ error: 'page not found' }))

// start server
MongoClient.connect(process.env.NFLIX_DB_URI, { useUnifiedTopology: true })
    .then(async client => {
        await MoviesDao.getCollectionHandle(client)
        await UsersDao.getCollectionHandle(client)
        await CommentsDao.getCollectionHandle(client)
        app.listen(port, () => console.log(`listening on port ${port}`))
    })
    .catch()
