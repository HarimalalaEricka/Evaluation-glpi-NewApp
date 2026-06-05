import express from 'express'
import sqlite3 from 'sqlite3'
import cors from 'cors'

const app = express()

app.use(cors())

const sqlite = sqlite3.verbose()
const db = new sqlite.Database('glpi.db')

app.get('/utilisateurs', (req, res) => {
    db.all('SELECT * FROM glpi_users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table glpi_users',
                code: err.code,
                errno: err.errno,
            })
        }

        res.json(rows)
    })
})

app.listen(3000, () => {
    console.log('Serveur démarré')
})