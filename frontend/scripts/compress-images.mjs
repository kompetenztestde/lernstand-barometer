import sharp from 'sharp'
import { readdir, mkdir, stat, readFile, writeFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ORIGINALS_DIR = path.join(__dirname, '../src/assets/images/item-images-originals')
const IMAGES_DIR = path.join(__dirname, '../src/assets/images/item-images')
const MANIFEST_PATH = path.join(IMAGES_DIR, '.manifest.json')
const WEBP_QUALITY = 75

const CHECK_MODE = process.argv.includes('--check')

async function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return { quality: null }
  return JSON.parse(await readFile(MANIFEST_PATH, 'utf-8'))
}

async function writeManifest() {
  await writeFile(MANIFEST_PATH, JSON.stringify({ quality: WEBP_QUALITY }, null, 2))
}

async function collectAll(originalsDir, imagesDir) {
  if (!existsSync(originalsDir)) return []

  const result = []
  const entries = await readdir(originalsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      result.push(
        ...(await collectAll(
          path.join(originalsDir, entry.name),
          path.join(imagesDir, entry.name),
        )),
      )
    } else if (entry.name.endsWith('.png')) {
      result.push({
        origPath: path.join(originalsDir, entry.name),
        webpPath: path.join(imagesDir, entry.name.replace(/\.png$/, '.webp')),
      })
    }
  }

  return result
}

async function convert({ origPath, webpPath }) {
  await mkdir(path.dirname(webpPath), { recursive: true })
  await sharp(origPath).webp({ quality: WEBP_QUALITY }).toFile(webpPath)

  const origSize = (await stat(origPath)).size
  const webpSize = (await stat(webpPath)).size
  const savings = Math.round((1 - webpSize / origSize) * 100)
  console.log(`  done  ${path.basename(origPath)} → .webp  (${savings}% smaller)`)
}

const manifest = await readManifest()
const qualityChanged = manifest.quality !== null && manifest.quality !== WEBP_QUALITY
const all = await collectAll(ORIGINALS_DIR, IMAGES_DIR)

if (qualityChanged) {
  // Delete existing WebPs so they all get reprocessed below
  console.log(
    `Quality changed (${manifest.quality} → ${WEBP_QUALITY}), reprocessing all images...\n`,
  )
  for (const { webpPath } of all) {
    if (existsSync(webpPath)) await unlink(webpPath)
  }
}

const toConvert = all.filter(({ webpPath }) => !existsSync(webpPath))

if (CHECK_MODE) {
  if (toConvert.length === 0 && !qualityChanged) {
    console.log('All images are converted.')
  } else {
    if (qualityChanged) {
      console.error(
        `\nQuality setting changed (${manifest.quality} → ${WEBP_QUALITY}): all ${all.length} image(s) need recompression.`,
      )
    } else {
      console.error(
        `\n${toConvert.length} image(s) in item-images-originals/ have no WebP in item-images/:`,
      )
      for (const { origPath } of toConvert) {
        console.error(`  - ${path.relative(ORIGINALS_DIR, origPath)}`)
      }
    }
    console.error('\nRun "npm run compress-images" to convert them.\n')
    process.exit(1)
  }
} else {
  if (toConvert.length === 0) {
    console.log('All images are already converted.')
  } else {
    console.log(`Converting ${toConvert.length} image(s) to WebP (quality ${WEBP_QUALITY})...\n`)
    for (const entry of toConvert) {
      await convert(entry)
    }
    await writeManifest()
    console.log('\nDone.')
  }
}
