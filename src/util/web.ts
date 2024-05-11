import type { Context } from "@bit-js/blitz"
import * as log from "@jsr/std__log"
import BadRequestError from "error/BadRequestError"
import PayloadTooLargeError from "error/PayloadTooLargeError"
import UnauthorizedError from "error/UnauthorizedError"
import { config } from "index"
import { join } from "node:path"
import { extension, name, namespaceExist } from "util/files"

async function upload(ctx: Context<any>): Promise<Response> {
    const namespace = ctx.req.headers.get("X-Namespace") || config.storage.default_namespace
    if (!(await namespaceExist(namespace))) {
        throw new BadRequestError(`The namespace "${namespace}" doesn't exist`)
    }

    const authToken = ctx.req.headers.get("Authorization") || null
    if (authToken == null || config.namespaces.find((a) => a.id == namespace)?.auth_token != authToken) {
        log.error(`Attempted unauthorized upload on the ${namespace} namespace. Attacker attempted to use token "${authToken}"`)
        throw new UnauthorizedError(`Invalid authorization token`)
    }

    const formData = await ctx.req.formData()
    const file = formData.get("file")
    if (file instanceof File) {
        const ext = extension(file as unknown as File)
        const fileName = await name(namespace, ext, config.storage.char_length)

        if (file.size > config.storage.max_file_size_bytes) {
            throw new PayloadTooLargeError(`File size of ${file.size} bytes is too large`)
        }

        log.info(`Namespace ${namespace} is uploading a ${file.size} bytes file`)

        await Bun.write(join(import.meta.dirname, "..", "..", "uploads", namespace, fileName), await file.arrayBuffer())

        log.info(`Written namespace ${namespace}'s ${file.size} bytes file to disk`)

        return new Response(
            JSON.stringify({
                url: config.web.url + namespace + "/" + fileName,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        )
    } else {
        throw new BadRequestError("No file found in the request")
    }
}

export { upload }
