let users
let sessions

class UsersDao {
    static async getCollectionHandle(client) {
        if (users && sessions) return
        try {
            users = await client.db('sample_mflix').collection('users')
            sessions = await client.db('sample_mflix').collection('sessions')
        } catch (e) {
            console.error(`undable to stablish collection handles in users.dao: ${e}`)
        }
    }

    static async addUser(userInfo) {
        try {
            await users.insertOne(userInfo)
            return { success: true, error: null }
        } catch (e) {
            if (String(e).startsWith('MongoError: E11000 duplicate key error')) {
                return { success: null, error: 'A user with the given email already exists.' }
            }
            console.error(`Error while adding a new user: ${e}`)
            return { success: null, error: e.message }
        }
    }

    static async getUser(email) {
        return await users.findOne({ email })
    }

    static async loginUser(email, jwt) {
        try {
            await sessions.updateOne({ user_id: email }, { $set: { jwt } }, { upsert: true })
            return { success: true, error: null }
        } catch (e) {
            console.error(`Error occured while logging in user: ${e}`)
            return { success: null, error: e.message }
        }
    }

    static async logoutUser(email) {
        try {
            await sessions.deleteOne({ user_id: email })
            return { success: true, error: null }
        } catch (e) {
            console.error(`Error occured while logging out user: ${e}`)
            return { success: null, error: e.message }
        }
    }
}

module.exports = UsersDao
