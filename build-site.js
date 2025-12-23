import { render } from "resumed"
import * as fs from "node:fs/promises"
import * as theme from "jsonresume-theme-even"
import * as path from "node:path"
import { exit } from "node:process"

/* 
 * Renders JSONResume to html, adds additional elements and copies static
 * content to build dir.
*/
async function main(targetResume, targetDir, staticDir) {
    // Create target dir if not exist
    try {
        !await fs.access(targetDir)
    } catch {
        await fs.mkdir(targetDir, {recursive: true})
    }

    // Empty target dir
    for await (const child of fs.glob(path.join(targetDir, "*"))) {
        fs.rm(child, {recursive: true})
    }
    console.log(`prepped target dir ${targetDir}`)

    // Render html
    const resume = JSON.parse(await fs.readFile(targetResume, "utf-8"))
    let html = await render(resume, theme)
    console.log("rendered resume to html string")

    // Add favicon <link> to <head>
    // Extract <head> innerHTML
    const headerRe = new RegExp('<head>([^]*)<\/head>', "gm")
    const headerMatch = headerRe.exec(html)
    if (headerMatch.length != 2) {
        throw new Error("header match should be length of 2")
    }
    const headerContent = headerMatch[1]

    // Rebuild <head> with favicon tag
    const newHeader = `<head>${headerContent}\n<link rel="shortcut icon" type="image/svg+xml" href="favicon.svg"></head>`
    html = html.replace(headerRe, newHeader)

    // Write html to disk
    const htmlPath = path.join(targetDir, "index.html")
    await fs.writeFile(htmlPath, html)
    console.log(`wrote html content to ${htmlPath}`)

    // Copy static files to site
    await fs.cp(staticDir, targetDir, {recursive: true, errorOnExist: true})
    console.log(`copied static content to ${targetDir}`)
}

main("resume.json", "build/site", "static")
    .then(() => console.log("built site successfully!"))
    .catch(
        (err) => {
            console.error(err)
            exit(1)
        }
    )
