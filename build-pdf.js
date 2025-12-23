import { render } from "resumed"
import * as fs from "node:fs/promises"
import * as theme from "jsonresume-theme-even"
import * as path from "node:path"
import { exit } from "node:process"
import puppeteer from 'puppeteer'

/* 
 * Renders JSONResume to pdf.
*/
async function main(targetResume, targetPath) {
    // Create target dir if not exist
    const targetDir = path.dirname(targetPath)
    try {
        !await fs.access(targetDir)
    } catch {
        await fs.mkdir(targetDir, {recursive: true})
    }

    // Render html
    const resume = JSON.parse(await fs.readFile(targetResume, "utf-8"))
    let html = await render(resume, theme)
    console.log("rendered resume to html string")

    // Export to PDF
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.pdf({ path: targetPath, format: 'a4', printBackground: true })
    await browser.close()
}

main("resume.json", "build/resume.pdf")
    .then(() => console.log("built resume pdf successfully!"))
    .catch(
        (err) => {
            console.error(err)
            exit(1)
        }
    )
