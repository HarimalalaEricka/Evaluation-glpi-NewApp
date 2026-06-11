import express from 'express'
import sqlite3 from 'sqlite3'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

const sqlite = sqlite3.verbose()

const db = new sqlite.Database('./glpi.db', () => {
    db.run('PRAGMA encoding = "UTF-8"')
})

app.get('/status/:id', (req, res) => {
    const { id } = req.params
    db.get('SELECT * FROM status WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table status',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(row)
    })
})
app.get('/colors', (req, res) => {
    db.all('SELECT * FROM color', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table color',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(rows)
    })
})

app.get('/status', (req, res) => {
    db.all('SELECT * FROM status', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table status',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(rows)
    })
})

app.get('/langues', (req, res) => {
    db.all('SELECT * FROM langue', [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table langue',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(rows)
    })
})

app.get('/traductions/:langueId', (req, res) => {
    const { langueId } = req.params
    db.all('SELECT * FROM traduction WHERE idLangue = ?', [langueId], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table traduction',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(rows)
    })
})

app.patch('/traductions/:id', (req, res) => {
    const { id } = req.params
    const { traduction, idlangue, idStatus } = req.body

    const fields = []
    const values = []

    if (traduction) {
        fields.push('traduction = ?')
        values.push(traduction)
    }

    if (idlangue) {
        fields.push('idLangue = ?')
        values.push(idLangue)
    }

    if (idStatus) {
        fields.push('idStatus = ?')
        values.push(idStatus)
    }

    if (fields.length === 0) {
        return res.status(400).json({
            message: 'Aucun champ à mettre à jour'
        })
    }

    values.push(id)

    const sql = `UPDATE traduction SET ${fields.join(', ')} WHERE id = ?`

    db.run(sql, values, function (err) {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la mise à jour',
                code: err.code,
                errno: err.errno,
            })
        }

        if (this.changes === 0) {
            return res.status(404).json({
                message: `Aucune couleur trouvée avec l'id ${id}`
            })
        }

        res.json({
            message: 'traduction mise à jour',
            id: id,
            changes: this.changes
        })
    })

})

app.patch('/colors/:id', (req, res) => {
    const { id } = req.params
    const { color, background } = req.body

    const fields = []
    const values = []

    if (color) {
        fields.push('color = ?')
        values.push(color)
    }

    if (background) {
        fields.push('background = ?')
        values.push(background)
    }

    if (fields.length === 0) {
        return res.status(400).json({
            message: 'Aucun champ à mettre à jour'
        })
    }

    values.push(id)

    const sql = `UPDATE color SET ${fields.join(', ')} WHERE id = ?`

    db.run(sql, values, function (err) {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la mise à jour',
                code: err.code,
                errno: err.errno,
            })
        }

        if (this.changes === 0) {
            return res.status(404).json({
                message: `Aucune couleur trouvée avec l'id ${id}`
            })
        }

        res.json({
            message: 'Couleur mise à jour',
            id: id,
            changes: this.changes
        })
    })
})
app.post('/langues', (req, res) => {
    const { langue } = req.body

    if (!langue) {
        return res.status(400).json({ message: 'Le champ langue est requis' })
    }

    const sql = `INSERT INTO langue(langue) VALUES(?)`

    db.run(sql, [langue], function (err) {
        if (err) {
            return res.status(500).json({
                message: "Erreur lors de l'insertion",
                code: err.code,
                errno: err.errno,
            })
        }

        res.json({
            message: 'Langue créée',
            id: this.lastID,
            changes: this.changes
        })
    })
})

app.post('/traductions', (req, res) => {
    const { idLangue, idStatus } = req.body

    if (!idLangue || !idStatus) {
        return res.status(400).json({ message: 'Les champs idLangue et idStatus sont requis' })
    }

    const sql = `INSERT INTO traduction(idLangue, idStatus) VALUES(?, ?)`

    db.run(sql, [idLangue, idStatus], function (err) {
        if (err) {
            return res.status(500).json({
                message: "Erreur lors de l'insertion",
                code: err.code,
                errno: err.errno,
            })
        }

        res.json({
            message: 'Traduction créée',
            id: this.lastID,
            changes: this.changes
        })
    })
})

app.get('/traductions/:idLangue/:idStatus', (req, res) => {
    const { idLangue, idStatus } = req.params
    db.get('SELECT * FROM traduction WHERE idLangue = ? AND idStatus = ?', [idLangue, idStatus], (err, row) => {
        if (err) {
            return res.status(500).json({
                message: 'Erreur lors de la lecture de la table traduction',
                code: err.code,
                errno: err.errno,
            })
        }
        res.json(row)
    })
})

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000')
})