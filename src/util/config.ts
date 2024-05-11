import * as log from "@jsr/std__log"
import * as toml from "@jsr/std__toml" // Bun has TOML parsing built-in, but it doesn't seem to support stringifying, so we use the Deno standard library for this

interface Config {
    web: {
        port: number
        url: string
        redirect_to: string
    }
    storage: {
        default_namespace: string
        char_length: number
        max_file_size_bytes: number
    }
    namespaces: {
        id: string
        auth_token: string
    }[]
}

const defaultConfig: Config = {
    web: {
        port: 3000,
        url: "http://localhost:3000/",
        redirect_to: "https://github.com/celerry/sxcu",
    },
    storage: {
        default_namespace: "k",
        char_length: 6,
        max_file_size_bytes: 1024 * 1024 * 100,
    },
    namespaces: [
        {
            id: "k",
            auth_token: "change_me",
        },
    ],
}

/**
 * apply defaults to a config
 */
function applyDefaults(config: Partial<Config>): Config {
    return deepMerge(defaultConfig, config)
}

/**
 * deeply merge two objects
 *
 * @param target object you wish to deep merge on
 * @param source object you wish to deep merge from
 * @returns merged object
 */
function deepMerge(target: any, source: any): any {
    const isObject = (obj: any) => obj && typeof obj === "object"

    for (const key in source) {
        if (isObject(target[key]) && isObject(source[key])) {
            deepMerge(target[key], source[key])
        } else {
            target[key] = source[key]
        }
    }

    return target
}

/**
 * save the config file to disk
 */
async function saveConfig(config: Config, file: string): Promise<void> {
    const string = toml.stringify(config as unknown as Record<string, unknown>, {
        keyAlignment: true,
    })

    await Bun.write(file, string)
}

/**
 * load the config file. also applies defaults if they dont exist just yet.
 */
async function loadConfig(file: string): Promise<Config> {
    log.info("Loading configuration file")
    try {
        const string = await Bun.file(file).text()

        const loaded = toml.parse(string) as unknown as Config

        const final = applyDefaults(loaded)

        await saveConfig(final, file)

        return final
    } catch (e) {
        if ((e as Error).name == "ENOENT") {
            await saveConfig(defaultConfig, file)
            return defaultConfig
        } else {
            log.error(`Failed to open config: ${(e as Error).message}`)
            process.exit(1)
        }
    }
}

export { loadConfig, saveConfig }
