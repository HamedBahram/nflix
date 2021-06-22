const express = require('express')
const MoviesController = require('../controllers/movies.controller')

const router = express.Router()

router.get('/', MoviesController.getMovies)
router.get('/search', MoviesController.searchMovies)
router.get('/facet', MoviesController.facetedSearch)
router.get('/:id', MoviesController.getMovieById)

module.exports = router
