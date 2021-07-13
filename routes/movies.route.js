const express = require('express')
const CommentsController = require('../controllers/comments.controller')
const MoviesController = require('../controllers/movies.controller')

const router = express.Router()

router.get('/', MoviesController.getMovies)
router.get('/search', MoviesController.searchMovies)
router.get('/facet', MoviesController.facetedSearch)
router.get('/:id', MoviesController.getMovieById)

router.post('/:id/comments', CommentsController.addComment)
router.patch('/:id/comments/:commentId', CommentsController.updateComment)
router.delete('/:id/comments/:commentId', CommentsController.deleteComment)

module.exports = router
