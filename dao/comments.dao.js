const { ObjectID } = require('mongodb')

let comments

class CommentsDao {
    static async getCollectionHandle(client) {
        if (comments) return
        try {
            comments = await client.db('sample_mflix').collection('comments')
        } catch (e) {
            console.error(`undable to stablish collection handle in comments.dao: ${e}`)
        }
    }
}

module.exports = CommentsDao
