import { config } from "index"
import mime from "mime-types"
import { exists, readdir } from "node:fs/promises"
import { join } from "node:path"

/**
 * check if a file exists
 *
 * @param name      - the name of the file, including it's extension
 * @param namespace - the namespace the file is stored under. defaults to `DEFAULT_NAMESPACE` environment variable
 */
async function exist(name: string, namespace: string = config.storage.default_namespace): Promise<boolean> {
    if (await namespaceExist(namespace)) {
        return exists(join(import.meta.dirname, "..", "..", "uploads", namespace, name))
    } else {
        return false
    }
}

/**
 * check if a namespace exists
 */
async function namespaceExist(namespace: string): Promise<boolean> {
    return exists(join(import.meta.dirname, "..", "..", "uploads", namespace))
}

/**
 * extract the extension from a file. will attempt to base it off the mime type first, but will fallback to the file name if that doesn't work.
 *
 * @example ```ts
 * const file1 = new File([""], "example.txt", { type: "text/plain" })
 * const file2 = new File([""], "no_extension", { type: "text/plain" })
 * const file3 = new File([""], "another.example.pdf", { type: "application/pdf" })
 *
 * extension(file1) // .txt
 * extension(file2) //
 * extension(file3) // .pdf
 * ```
 */
function extension(file: File): string {
    if (mime.extension(file.type) != false) {
        return ("." + mime.extension(file.type)) as string
    } else {
        const filename = file.name

        const lastDotIndex = filename.lastIndexOf(".")
        if (lastDotIndex !== -1) {
            return filename.slice(lastDotIndex)
        } else {
            return ""
        }
    }
}

/**
 * get how many files are present in a given namespace with a given extension
 */
async function count(namespace: string = config.storage.default_namespace, extension: string): Promise<number> {
    if (await namespaceExist(namespace)) {
        const files = await readdir(join(import.meta.dirname, "..", "..", "uploads", namespace))

        const filteredFiles = files.filter((file) => {
            if (extension === "") {
                // if extension is empty, filter out files with extensions
                return file.lastIndexOf(".") === -1
            } else {
                // otherwise, check if the file's extension matches the specified extension
                return file.endsWith(`${extension}`)
            }
        })

        // Return the count of filtered files
        return filteredFiles.length
    } else {
        return 0
    }
}

/**
 * get a random file name [chars] characters long, only using A-Za-z0-6 characters for a given namespace
 */
async function name(namespace: string, ext: string, chars: number = config.storage.char_length): Promise<string> {
    function generateRandomString(length: number): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        let result = ""
        const charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    }

    const countOfFiles = await count(namespace, ext)
    const totalCombinations = Math.pow(62, chars)

    // if file count is greater than or equal to total combinations, increase chars
    if (countOfFiles >= totalCombinations) {
        chars++
        return name(namespace, ext, chars)
    }

    const random = generateRandomString(chars)

    if (await exist(`${random}${ext}`, namespace)) {
        return name(namespace, ext, chars)
    }

    return `${random}${ext}`
}

export { exist, extension, name, namespaceExist }
