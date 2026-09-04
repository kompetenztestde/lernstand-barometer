const express = require('express')
const puppeteer = require('puppeteer')

const router = express.Router()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const PAGE_ROUTES = {
    'result-tests': '/results/tests',
    'result-groups': '/results/groups',
    'conference': '/results/conference',
    'self-evaluation': '/results/self-evaluation',
    'student-self-evaluation': '/student/self-evaluation',
}

router.post('/', async (req, res) => {
    const { page: pageName, token, role, expiresAt, groupId, studentCode, studentCodes, studentNames, selfAssessmentLE, selfAssessmentRS } = req.body

    const route = PAGE_ROUTES[pageName]
    if (!route) return res.status(400).json({ error: 'Unknown page' })
    if (!token || !role) return res.status(400).json({ error: 'Missing auth data' })

    const launchOptions = {
        browser: 'firefox',
        headless: true,
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }),
    }

    let browser
    try {
        browser = await puppeteer.launch(launchOptions)
        const tab = await browser.newPage()

        tab.on('console', (msg) => console.log(`[PAGE ${msg.type()}]`, msg.text()))
        tab.on('requestfailed', (req) => console.log(`[REQ FAILED]`, req.url(), req.failure()?.errorText))

        await tab.evaluateOnNewDocument((data) => {
            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)
            if (data.expiresAt) localStorage.setItem('expires-at', String(data.expiresAt))
            if (data.groupId != null) localStorage.setItem('view-group-id', String(data.groupId))
            if (data.studentCode) localStorage.setItem('print-student-code', data.studentCode)
            if (data.studentCodes) localStorage.setItem('print-student-codes', data.studentCodes)
            if (data.studentNames) localStorage.setItem('student-names', data.studentNames)
            if (data.selfAssessmentLE) localStorage.setItem('print-self-assessment-le', data.selfAssessmentLE)
            if (data.selfAssessmentRS) localStorage.setItem('print-self-assessment-rs', data.selfAssessmentRS)
        }, {
            token, role, expiresAt, groupId,
            studentCode: studentCode ?? null,
            studentCodes: studentCodes ? JSON.stringify(studentCodes) : null,
            studentNames: studentNames ?? null,
            selfAssessmentLE: selfAssessmentLE ?? null,
            selfAssessmentRS: selfAssessmentRS ?? null,
        })

        const url = groupId != null ? `${FRONTEND_URL}${route}?group=${groupId}` : `${FRONTEND_URL}${route}`
        await tab.goto(url, { waitUntil: 'load', timeout: 30000 })

        await new Promise((resolve) => setTimeout(resolve, 800))

        const POLL_INTERVAL = 400
        const SPINNER_TIMEOUT = 120000
        const start = Date.now()
        let spinnerSeen = false
        while (true) {
            const hasSpinner = await tab.evaluate(() => !!document.querySelector('[role="status"]'))
            if (hasSpinner) {
                spinnerSeen = true
            } else if (spinnerSeen || Date.now() - start > 3000) {
                break
            }
            if (Date.now() - start > SPINNER_TIMEOUT) {
                await tab.screenshot({ path: '/tmp/puppeteer-debug.png' })
                throw new Error('Timed out waiting for page to finish loading')
            }
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
        }

        const pdf = await tab.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        })

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pageName}-${groupId}.pdf"`,
        })
        res.send(pdf)
    } catch (err) {
        console.error('PDF generation failed:', err)
        res.status(500).json({ error: 'PDF generation failed' })
    } finally {
        if (browser) await browser.close()
    }
})

module.exports = router
