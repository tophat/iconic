import * as path from 'path'
import { promises } from 'dns'

import { Octokit } from '@octokit/rest'

import { Logger } from '@react-vector-graphics/types'

import {
    COMMIT_MESSAGE_PATTERNS,
    COMMIT_MESSAGE_PLACEHOLDER,
    OPTIONS,
    STATE,
    STATUSES,
} from './constants'
import { eagerPromises, replaceAll, toBase64 } from './utils'

const removeIconFiles = async (
    githubApi: Octokit,
    githubParams: { head: string; owner: string; repo: string },
    componentName: string,
    componentPath: string,
    commitMessagePattern: string = COMMIT_MESSAGE_PATTERNS.DELETE,
): Promise<void> => {
    const deleteMessage = `remove ${componentName}`
    const message = replaceAll(
        commitMessagePattern,
        COMMIT_MESSAGE_PLACEHOLDER,
        deleteMessage,
    )
    const { data: results } = await githubApi.repos.getContents({
        ...githubParams,
        path: componentPath,
        ref: githubParams.head,
    })
    await eagerPromises(
        (Array.isArray(results) ? results : [results]).map(({ path, sha }) =>
            githubApi.repos.deleteFile({
                ...githubParams,
                message,
                path,
                sha,
            }),
        ),
    )
}

const addOrModifyIconFile = async (
    githubApi: Octokit,
    githubParams: { head: string; owner: string; repo: string },
    componentName: string,
    fileName: string,
    filePath: string,
    fileContents: string,
    commitMessagePatternCreate: string = COMMIT_MESSAGE_PATTERNS.CREATE,
    commitMessagePatternUpdate: string = COMMIT_MESSAGE_PATTERNS.UPDATE,
): Promise<void> => {
    let fileSha
    try {
        const { data } = await githubApi.repos.getContents({
            ...githubParams,
            path: filePath,
            ref: githubParams.head,
        })
        if (Array.isArray(data)) return
        fileSha = data.sha
    } catch (e) {
        // assume file does not exist and do nothing
    }
    const message = fileSha
        ? replaceAll(
              commitMessagePatternUpdate,
              COMMIT_MESSAGE_PLACEHOLDER,
              `modify ${componentName} ${fileName}`,
          )
        : replaceAll(
              commitMessagePatternCreate,
              COMMIT_MESSAGE_PLACEHOLDER,
              `add ${componentName} ${fileName}`,
          )
    await githubApi.repos.createOrUpdateFile({
        ...githubParams,
        branch: githubParams.head,
        content: toBase64(fileContents),
        message,
        path: filePath,
        sha: fileSha,
    })
}

const writeComponent = async ({
    github: { api: githubApi, ...githubParams },
    ...params
}: {
    assetFile: string
    code: string
    commitMessagePatterns?: {
        create?: string
        delete?: string
        update?: string
    }
    componentName?: string
    componentNameOld?: string
    componentFiles: { [fileName: string]: string }
    diffType: string
    fileExt?: string
    folderPath: string
    github: {
        api: Octokit
        base: string
        head: string
        owner: string
        repo: string
    }
    logger?: Logger
    outputPath?: string
}): Promise<void> => {
    if (!params.componentName) {
        return params.logger?.warn(
            `No '${STATE.COMPONENT_NAME}' provided for '${params.assetFile}'.`,
        )
    }
    if (!params.outputPath) {
        return params.logger?.warn(`No '${OPTIONS.OUTPUT_PATH}' provided.`)
    }
    if (!params.fileExt) {
        params.logger?.warn(`No '${OPTIONS.FILE_EXT}' provided.`)
    }
    // gather files
    const componentFiles = Object.entries(params.componentFiles)
    const singleFile = componentFiles.length === 0
    const pathToFolder = path.join(
        params.folderPath,
        params.outputPath,
        singleFile ? '' : params.componentName,
    )
    const componentFileName =
        (singleFile ? params.componentName : 'index') +
        (params.fileExt ? `.${params.fileExt}` : '')
    componentFiles.push([componentFileName, params.code])
    const componentFilePath = path.join(pathToFolder, componentFileName)
    // commit file changes
    const pendingPromises = []
    if (params.diffType === STATUSES.REMOVED) {
        pendingPromises.push(
            removeIconFiles(
                githubApi,
                githubParams,
                params.componentName,
                singleFile ? componentFilePath : pathToFolder,
                params.commitMessagePatterns?.delete,
            ),
        )
    } else {
        // added, modified or renamed
        for (const [fileName, fileContents] of componentFiles) {
            const filePath = path.join(pathToFolder, fileName)
            pendingPromises.push(
                addOrModifyIconFile(
                    githubApi,
                    githubParams,
                    params.componentName,
                    fileName,
                    filePath,
                    fileContents,
                    params.commitMessagePatterns?.create,
                    params.commitMessagePatterns?.update,
                ),
            )
        }
        if (params.diffType === STATUSES.RENAMED && params.componentNameOld) {
            const oldPathToFolder = path.join(
                params.folderPath,
                params.outputPath,
                singleFile ? '' : params.componentNameOld,
            )
            const oldPathToFile = path.join(
                oldPathToFolder,
                singleFile ? params.componentNameOld : 'index',
            )
            const oldComponentFilePath = params.fileExt
                ? `${oldPathToFile}.${params.fileExt}`
                : oldPathToFile
            pendingPromises.push(
                removeIconFiles(
                    githubApi,
                    githubParams,
                    params.componentNameOld,
                    singleFile ? oldComponentFilePath : oldPathToFolder,
                    params.commitMessagePatterns?.delete,
                ),
            )
        }
    }
    await eagerPromises(pendingPromises)
}

export default writeComponent
