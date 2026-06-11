import express from 'express'
import cors from 'cors'
import contractsRouter from './routes/contracts.js'
import templatesRouter from './routes/templates.js'
import signingRouter from './routes/signing.js'
import remindersRouter from './routes/reminders.js'
import statsRouter from './routes/stats.js'

const app = express()
const PORT = 8428

app.use(cors())
app.use(express.json())

app.use('/api/contracts', contractsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/signing', signingRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/stats', statsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
