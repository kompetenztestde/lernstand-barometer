if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const printRouter = require('./routes/print')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use('/api/print', printRouter)

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('frontend'));

    // Always serve index.html when no file is found for the path, to support Vue Router
    app.get(/.*/, (req, res) => {
        res.sendFile('index.html', { root: 'frontend' });
    });
}

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
})

