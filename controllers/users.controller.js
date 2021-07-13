const UsersDao = require('../dao/users.dao')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const hashPassword = async password => await bcrypt.hash(password, 12)

class User {
    constructor({ name, email, password, preferences = {} } = {}) {
        this.name = name
        this.email = email
        this.password = password
        this.preferences = preferences
    }
    toJson() {
        return {
            name: this.name,
            email: this.email,
            preferences: this.preferences,
        }
    }
    async comparePassword(plainText) {
        return await bcrypt.compare(plainText, this.password)
    }
    encode() {
        return jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
                ...this.toJson(),
            },
            process.env.AUTH_TOKEN_SECRET
        )
    }
    static decode(token) {
        return jwt.verify(token, process.env.AUTH_TOKEN_SECRET, (error, user) => {
            if (error) return { error }
            return new User(user)
        })
    }
}

class UsersController {
    static async register(req, res) {
        try {
            const userFromBody = req.body
            if (userFromBody && userFromBody.name.length < 3) {
                return res.status(400).json({ error: 'Name must be at least 3 characters' })
            }
            if (userFromBody && userFromBody.password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' })
            }

            const userInfo = {
                ...userFromBody,
                password: await hashPassword(userFromBody.password),
                preferences: {
                    favorite_cast: '',
                    preferred_language: '',
                },
            }
            const { error } = await UsersDao.addUser(userInfo)
            if (error) return res.status(400).json({ error })

            const userFromDB = await UsersDao.getUser(userFromBody.email)
            if (!userFromDB)
                return res.status(500).json({ error: 'Internal error, please try again.' })

            const user = new User(userFromDB)
            const loginResult = await UsersDao.loginUser(user.email, user.encode())
            if (loginResult.error) return res.status(500).json({ error: loginResult.error })

            res.json({
                auth_token: user.encode(),
                info: user.toJson(),
            })
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body
            if (!email || typeof email !== 'string')
                return res.status(400).json({ error: 'Bad email' })
            if (!password || typeof password !== 'string')
                return res.status(400).json({ error: 'Bad password' })

            const userFromDB = await UsersDao.getUser(email)
            if (!userFromDB)
                return res
                    .status(401)
                    .json({ error: 'Make sure your email and password is correct' })
            const user = new User(userFromDB)
            if (!(await user.comparePassword(password)))
                return res
                    .status(401)
                    .json({ error: 'Make sure your email and password is correct' })

            const { error } = await UsersDao.loginUser(user.email, user.encode())
            if (error) return res.status(500).json({ error })

            res.json({
                auth_token: user.encode(),
                info: user.toJson(),
            })
        } catch (e) {
            return res.status(500).json({ error: e.message })
        }
    }

    static async logout(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const userObj = User.decode(userJwt)
            if (userObj.error) return res.status(401).json({ error: userObj.error.message })

            const { success, error } = await UsersDao.logoutUser(userObj.email)
            if (error) return res.status(500).json({ error })
            res.json({ success })
        } catch (e) {
            return res.status(500).json({ error: e.message })
        }
    }

    static async validateUser(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const userClaim = User.decode(userJwt)
            const { error } = userClaim
            if (error) return res.status(401).json({ error: error.message })

            const userFromDB = await UsersDao.getUser(userClaim.email)
            if (!userFromDB) return res.status(401).json({ error: 'User not found.' })

            const user = new User(userFromDB)
            res.json({
                auth_token: user.encode(),
                info: user.toJson(),
            })
        } catch (e) {
            console.error(e)
            return res.status(500).json({ error: e.message })
        }
    }

    static async update(req, res, next) {
        try {
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const userObj = User.decode(userJwt)
            const { error } = userObj
            if (error) return res.status(401).json({ error: error.message })

            const updateResult = await UsersDao.updatePreferences(
                userObj.email,
                req.body.preferences
            )
            if (updateResult.error) return res.status(400).json({ error: updateResult.error })

            const userFromDB = await UsersDao.getUser(userObj.email)
            if (!userFromDB) return res.status(500).json({ error: 'Server Error.' })

            const updatedUser = new User(userFromDB)
            res.json({
                auth_token: updatedUser.encode(),
                info: updatedUser.toJson(),
            })
        } catch (e) {
            res.status(500).json({ error: e.message })
        }
    }

    static async delete(req, res, next) {
        try {
            const { password } = req.body
            if (!password || typeof password !== 'string') {
                return res.status(400).json({ error: 'Bad Password Format.' })
            }
            const userJwt = req.get('Authorization').slice('Bearer '.length)
            const userClaim = User.decode(userJwt)
            const { error } = userClaim
            if (error) return res.status(401).json({ error: error.message })

            const userFromDB = await UsersDao.getUser(userClaim.email)
            if (!userFromDB) return res.status(400).json({ error: 'User not found.' })

            const user = new User(userFromDB)
            if (!(await user.comparePassword(password)))
                return res.status(401).json({ error: "Password doesn't match our records." })

            const deleteResult = await UsersDao.deleteUser(userClaim.email)
            if (deleteResult.error) {
                return res.status(400).json({ error: deleteResult.error })
            }

            res.json(deleteResult)
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
}

module.exports = { UsersController, User }
