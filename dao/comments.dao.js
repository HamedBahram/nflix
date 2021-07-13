const { ObjectId } = require('mongodb')

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

    static async addComment({ movie_id, user, text, date }) {
        try {
            const comment = {
                name: user.name,
                email: user.email,
                movie_id,
                text,
                date,
            }
            const insertedId = await comments.insertOne(comment)
            if (!insertedId) throw new Error('Failed to add comment')
            return { insertedId }
        } catch (error) {
            return { error: error.message }
        }
    }

    static async updateComment(commentId, text) {
        try {
            const updateResult = await comments.updateOne(
                { _id: ObjectId(commentId) },
                { $set: { text } }
            )
            if (updateResult.matchedCount === 0) return { error: 'Comment not found!' }
            return updateResult
        } catch (error) {
            console.error(error)
            return { error: error.message }
        }
    }

    static async deleteComment(commentId) {
        try {
            const { deletedCount } = await comments.deleteOne({ _id: ObjectId(commentId) })
            if (!deletedCount) throw new Error('Failed to delete comment.')
            return { success: true }
        } catch (error) {
            return { error: error.message }
        }
    }

    static async getComments(email) {
        try {
            return await comments.find({ email }).toArray()
        } catch (error) {
            console.error(error)
            return { error }
        }
    }

    static async deleteComments(email) {
        try {
            await comments.deleteMany({ email })
            if ((await this.getComments(email)).length) {
                return { error: 'Comments deletion unsuccessful.' }
            }
            return { success: true }
        } catch (error) {
            console.error(error)
            return { error }
        }
    }
}

module.exports = CommentsDao
