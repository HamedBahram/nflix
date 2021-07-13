const MoviesDao = require('../dao/movies.dao')

class MoviesController {
    static async getMovies(req, res, next) {
        try {
            const movies_per_page = 20
            const { moviesList, count } = await MoviesDao.getMovies()
            let response = {
                moviesList,
                page: 0,
                filters: {},
                movies_per_page,
                count,
            }
            res.json(response)
        } catch (e) {
            console.error(e)
        }
    }

    static async getMovieById(req, res, next) {
        try {
            const { id } = req.params
            const movie = await MoviesDao.getMovieById(id)
            if (!movie)
                return res.status(404).json({ error: 'Unable to fetch the movie by that id' })
            res.json(movie)
        } catch (e) {
            console.error(`Get movies by ID controller, ${e}`)
            res.status(500).json({ error: e.message })
        }
    }

    static async searchMovies(req, res, next) {
        const movies_per_page = 20
        let page
        try {
            page = req.query.page ? parseInt(req.query.page, 10) : 1
        } catch (e) {
            console.error(`Got bad value for page: ${e}`)
            page = 1
        }

        let searchType
        try {
            searchType = Object.keys(req.query)[0]
        } catch (e) {
            console.error(`No search keys specified: ${e}`)
        }

        let filters = {}
        switch (searchType) {
            case 'genre':
                if (req.query.genre !== '') filters.genre = req.query.genre
                break
            case 'cast':
                if (req.query.cast !== '') filters.cast = req.query.cast
                break
            case 'country':
                if (req.query.country !== '') filters.country = req.query.country
                break
            case 'text':
                if (req.query.text !== '') filters.text = req.query.text
                break
            default:
                break
        }

        const { moviesList, count } = await MoviesDao.getMovies({ filters, page, movies_per_page })
        const response = {
            moviesList,
            page,
            filters,
            movies_per_page,
            count,
        }
        res.json(response)
    }

    static async facetedSearch(req, res, next) {
        const movies_per_page = 20
        let page
        try {
            page = req.query.page ? parseInt(req.query.page, 10) : 1
        } catch (e) {
            console.error(`Got bad value for page: ${e}`)
            page = 1
        }

        let searchType
        try {
            searchType = Object.keys(req.query)[0]
        } catch (e) {
            console.error(`No search type specified: ${e}`)
        }

        let filters = {}
        switch (searchType) {
            case 'genre':
                if (req.query.genre !== '') filters.genres = req.query.genre
                break
            case 'cast':
                if (req.query.cast !== '') filters.cast = req.query.cast
                break
            case 'country':
                if (req.query.country !== '') filters.countries = req.query.country
                break
            default:
                filters.cast = 'Tom Hanks'
                break
        }

        const { moviesList, rating, runtime, count } = await MoviesDao.facetedSearch({
            filters,
            page,
            movies_per_page,
        })

        const response = {
            moviesList,
            rating,
            runtime,
            count,
            page,
            filters,
            movies_per_page,
        }
        res.json(response)
    }
}

module.exports = MoviesController
