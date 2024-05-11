import Blitz from "@bit-js/blitz"
import * as log from "@jsr/std__log"
import CustomError from "error/CustomError"
import NotFoundError from "error/NotFoundError"
import UnauthorizedError from "error/UnauthorizedError"
import { existsSync, mkdir } from "node:fs"
import { join, parse } from "node:path"
import { loadConfig } from "util/config"
import { exist, namespaceExist } from "util/files"
import { upload } from "util/web"

const config = await loadConfig("config.toml")
const uploads = join(import.meta.dirname, "..", "uploads")

if (!existsSync(uploads)) {
    mkdir(uploads, () => {})
    log.info(`Created uploads directory`)
}

config.namespaces.forEach((namespace) => {
    const path = join(uploads, namespace.id)
    if (!existsSync(path)) {
        log.info(`Created namespace directory for "${namespace.id}"`)
        mkdir(path, () => {})
    }
})

const router = new Blitz()

router.put("GET", "/", () => Response.redirect(new URL(config.web.redirect_to), 302))
router.put("POST", "/api/upload", upload)

router.put("GET", "/*", async (ctx) => {
    const param: string = ctx.params.$

    const { dir: possibleNamespace, base: name } = parse(param)
    const namespace = possibleNamespace || config.storage.default_namespace

    if (!(await namespaceExist(namespace))) {
        throw new NotFoundError(`Namespace "${namespace}" does not exist`)
    }

    const path = join(uploads, namespace, name)

    if (!path.startsWith(uploads)) {
        throw new UnauthorizedError("Unusual file path... path traversal?")
    }

    if (!(await exist(name, namespace))) {
        throw new NotFoundError(`File "${name}" does not exist in namespace "${namespace}"`)
    }

    return new Response(Bun.file(path))
})

const fetch = router.build()

Bun.serve({
    fetch: fetch,
    port: config.web.port || 8080,
    error(error) {
        if (error instanceof CustomError) {
            return new Response((error as CustomError).toString(), { status: error.statusCode })
        } else {
            log.error(`Unexpected error: ${error.message}`)
            return new Response("500 Internal Server Error", { status: 500 })
        }
    },
})

log.info(`Webserver is up`)

export { config }
