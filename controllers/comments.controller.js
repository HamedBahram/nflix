const MoviesDao = require('../dao/movies.dao')
const CommentsDao = require('../dao/comments.dao')
const { User } = require('../controllers/users.controller')
const { ObjectId } = require('mongodb')

class CommentsController {
    static async addComment(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const user = User.decode(userJwt)
            if (user.error) return res.status(401).json({ error: user.error.message })

            const { id } = req.params
            const { text } = req.body
            const date = new Date()

            const { error } = await CommentsDao.addComment({
                movie_id: ObjectId(id),
                user,
                text,
                date,
            })
            if (error) throw new Error(error)
            const movie = await MoviesDao.getMovieById(id)
            if (!movie) throw new Error('Something went wrong!')
            res.status(201).json({
                success: true,
                movie,
            })
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }

    static async updateComment(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const user = User.decode(userJwt)
            if (user.error) return res.status(401).json({ error: user.error.message })

            const { id, commentId } = req.params
            const { text } = req.body
            const { error } = await CommentsDao.updateComment(commentId, text)
            if (error) throw new Error(error)

            const movie = await MoviesDao.getMovieById(id)
            if (!movie) throw new Error('Something went wrong!')

            res.status(200).json({ success: true, movie })
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }

    static async deleteComment(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const userClaim = User.decode(userJwt)
            if (userClaim.error) return res.status(401).json({ error: userClaim.error.message })

            const { id, commentId } = req.params
            const { error } = await CommentsDao.deleteComment(commentId)
            if (error) throw new Error(error)

            const movie = await MoviesDao.getMovieById(id)
            if (!movie) throw new Error('Something went wrong!')

            res.status(200).json({ success: true, movie })
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
}

module.exports = CommentsController
