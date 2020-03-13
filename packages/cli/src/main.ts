import yargs from 'yargs'

import { Configuration } from '@react-vector-graphics/types'
import rvgCore from '@react-vector-graphics/core'
import { OPTIONS } from '@react-vector-graphics/plugin-assets'

const mergeCliOptions = (config: Configuration): Configuration => {
    if (!config.options) config.options = {}
    const { argv } = yargs(process.argv)
        .usage('Usage: $0 -p [pattern] -o [output]')
        .option('pattern', {
            alias: 'p',
            default: config.options[OPTIONS.GLOB_PATTERN],
            describe: 'SVG files glob pattern',
            type: 'string',
        })
        .option('output', {
            alias: 'o',
            default: config.options[OPTIONS.OUTPUT_PATH],
            describe: 'Destination folder',
            type: 'string',
        })
        .option('ext', {
            alias: 'e',
            default: config.options[OPTIONS.FILE_EXT],
            describe: 'Component file extension',
            type: 'string',
        })
        .demandOption(['pattern', 'output'])

    config.options[OPTIONS.GLOB_PATTERN] = argv.pattern
    config.options[OPTIONS.OUTPUT_PATH] = argv.output
    config.options[OPTIONS.FILE_EXT] = argv.ext
    return config
}

export const run = async (config: Configuration): Promise<void> => {
    const assetPlugin = '@react-vector-graphics/plugin-assets'
    if (!config.plugins?.length) {
        config.plugins = [assetPlugin, '@svgr/plugin-jsx', assetPlugin]
    }
    await rvgCore({ config: mergeCliOptions(config) })
}
