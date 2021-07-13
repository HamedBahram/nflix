const { ObjectID } = require('mongodb')

let movies
let nflix
const default_sort = [['tomatoes.viewer.numReviews', -1]]

class MoviesDao {
    static async getCollectionHandle(client) {
        if (movies) return
        try {
            nflix = await client.db('sample_mflix')
            movies = await nflix.collection('movies')
        } catch (e) {
            console.error(`undable to stablish collection handle in movies.dao: ${e}`)
        }
    }

    static textSearch(text) {
        const query = { $text: { $search: text } }
        const project = { score: { $meta: 'textScore' } }
        const sort = { score: { $meta: 'textScore' } }
        return { query, project, sort }
    }

    static castSearch(cast) {
        const search_cast = Array.isArray(cast) ? cast : cast.split(',')
        const query = { cast: { $in: search_cast } }
        const project = {}
        const sort = default_sort
        return { query, project, sort }
    }

    static countrySearch(country) {
        const country_list = Array.isArray(country) ? country : country.split(',')
        const query = { countries: { $in: country_list } }
        const project = {}
        const sort = default_sort
        return { query, project, sort }
    }

    static genreSearch(genre) {
        const search_genre = Array.isArray(genre) ? genre : genre.split(',')
        const query = { genres: { $in: search_genre } }
        const project = {}
        const sort = default_sort
        return { query, project, sort }
    }

    static async getMovies({ filters = null, page = 1, movies_per_page = 20 } = {}) {
        let query_parameters = {}
        if (filters) {
            if ('text' in filters) query_parameters = this.textSearch(filters['text'])
            else if ('cast' in filters) query_parameters = this.castSearch(filters['cast'])
            else if ('country' in filters) query_parameters = this.countrySearch(filters['country'])
            else if ('genre' in filters) query_parameters = this.genreSearch(filters['genre'])
        }

        let { query = {}, project = {}, sort = default_sort } = query_parameters
        let cursor
        try {
            cursor = await movies.find(query).project(project).sort(sort)
        } catch (e) {
            console.error(`Unable to find movies, ${e}`)
            return { moviesList: [], count: 0 }
        }

        try {
            const moviesList = await cursor
                .skip(page > 0 ? (page - 1) * movies_per_page : 0)
                .limit(movies_per_page)
                .toArray()
            const count = await movies.countDocuments(query)
            return { moviesList, count }
        } catch (e) {
            console.error(`Unable to convert cursor to array or counting, ${e}`)
            return { moviesList: [], count: 0 }
        }
    }

    static async facetedSearch({ filters = null, page = 1, movies_per_page = 20 } = {}) {
        const matchStage = { $match: filters }
        const sortStage = { $sort: { 'tomatoes.viewer.numReviews': -1 } }
        const countPipeline = [matchStage, sortStage, { $count: 'count' }]

        const skipStage = { $skip: (page - 1) * movies_per_page }
        const limitStage = { $limit: movies_per_page }
        const facetStage = {
            $facet: {
                runtime: [
                    {
                        $bucket: {
                            groupBy: '$runtime',
                            boundaries: [0, 60, 90, 120, 180],
                            default: 'other',
                        },
                    },
                ],
                rating: [
                    {
                        $bucket: {
                            groupBy: '$metacritic',
                            boundaries: [0, 20, 40, 60, 80, 100],
                            default: 'other',
                        },
                    },
                ],
                moviesList: [
                    {
                        $addFields: {
                            title: '$title',
                        },
                    },
                ],
            },
        }

        const queryPipeline = [matchStage, sortStage, skipStage, limitStage, facetStage]
        try {
            const result = await (await movies.aggregate(queryPipeline)).next()
            const count = await (await movies.aggregate(countPipeline)).next()
            return {
                ...result,
                ...count,
            }
        } catch (e) {
            return { error: 'Results too large' }
        }
    }

    static async getMovieById(id) {
        try {
            const pipeline = [
                {
                    $match: {
                        _id: ObjectID(id),
                    },
                },
                {
                    $lookup: {
                        from: 'comments',
                        let: { id: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$movie_id', '$$id'] },
                                },
                            },
                            {
                                $sort: {
                                    date: -1,
                                },
                            },
                        ],
                        as: 'comments',
                    },
                },
            ]
            const movie = await movies.aggregate(pipeline).next()
            return movie
        } catch (e) {
            console.error(`something went wrong in getMovieByID: ${e}`)
        }
    }
}

module.exports = MoviesDao
