import { Logger } from '@react-vector-graphics/types'

// https://github.com/octokit/rest.js/issues/1971
type WithContent<T> = T & { content: Buffer | string }
export const withContent = <T>(data: T): WithContent<T> =>
    data as WithContent<T>

// https://github.com/isaacs/minimatch/issues/30
export const normaliseGlob = (globPattern: string): string => {
    if (globPattern.startsWith('./')) {
        return globPattern.substring(2)
    }
    return globPattern
}

export const replaceAll = (
    str: string,
    search: string,
    replacement: string,
): string => str.split(search).join(replacement)

export const fromBase64 = (data: string): string =>
    Buffer.from(data, 'base64').toString()

export const toBase64 = (data: string): string =>
    Buffer.from(data).toString('base64')

export const eagerPromises = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promises: Promise<any>[],
    logger: Logger = console,
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
Promise<any> => Promise.all(promises.map((p) => p.catch(logger.error)))
