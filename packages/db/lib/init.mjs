import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import pino from 'pino'
import pretty from 'pino-pretty'
import parseArgs from 'minimist'
import { checkForDependencies } from './gen-types.mjs'
import loadConfig from './load-config.mjs'
import { findConfigFile, isFileAccessible } from './utils.js'

const connectionStrings = {
  postgres: 'postgres://postgres:postgres@localhost:5432/postgres',
  sqlite: 'sqlite://./db.sqlite',
  mysql: 'mysql://root@localhost:3306/graph',
  mysql8: 'mysql://root@localhost:3308/graph',
  mariadb: 'mysql://root@localhost:3307/graph'
}

const moviesMigrationDo = `
-- Add SQL in this file to create the database tables for your API
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL
);
`

const moviesMigrationUndo = `
-- Add SQL in this file to drop the database tables 
DROP TABLE movies;
`
function getTsConfig (outDir) {
  return {
    compilerOptions: {
      module: 'commonjs',
      esModuleInterop: true,
      target: 'es6',
      moduleResolution: 'node',
      sourceMap: true,
      pretty: true,
      noEmitOnError: true,
      outDir
    },
    watchOptions: {
      watchFile: 'fixedPollingInterval',
      watchDirectory: 'fixedPollingInterval',
      fallbackPolling: 'dynamicPriority',
      synchronousWatchDirectory: true,
      excludeDirectories: ['**/node_modules', outDir]
    }
  }
}

function generateConfig (args) {
  const { hostname, port, database, migrations, types, typescript } = args

  const connectionString = connectionStrings[database]

  const config = {
    server: { hostname, port },
    core: { connectionString, graphiql: true },
    migrations: { dir: migrations }
  }

  if (types === true) {
    config.types = {
      autogenerate: true
    }
  }

  if (typescript === true) {
    config.typescript = {
      watch: true,
      outDir: 'dist'
    }
  }

  return config
}

async function init (_args) {
  const logger = pino(pretty({
    translateTime: 'SYS:HH:MM:ss',
    ignore: 'hostname,pid'
  }))

  const args = parseArgs(_args, {
    default: {
      hostname: '127.0.0.1',
      port: 3042,
      database: 'sqlite',
      migrations: './migrations',
      types: true,
      typescript: false
    },
    alias: {
      h: 'hostname',
      p: 'port',
      db: 'database',
      m: 'migrations',
      t: 'types',
      ts: 'typescript'
    },
    boolean: ['types', 'typescript']
  })

  const { migrations, types, typescript } = args

  const currentDir = process.cwd()
  const accessibleConfigFilename = await findConfigFile(currentDir)
  if (accessibleConfigFilename === undefined) {
    const config = generateConfig(args)
    await writeFile('platformatic.db.json', JSON.stringify(config, null, 2))
    logger.info('Configuration file platformatic.db.json successfully created.')
  } else {
    logger.info(`Configuration file ${accessibleConfigFilename} found, skipping creation of configuration file.`)
  }

  const { configManager } = await loadConfig({}, _args)
  await configManager.parseAndValidate()
  const config = configManager.current

  const migrationsFolderName = migrations
  const isMigrationFolderExists = await isFileAccessible(migrationsFolderName, currentDir)
  if (!isMigrationFolderExists) {
    await mkdir(migrationsFolderName)
    logger.info(`Migrations folder ${migrationsFolderName} successfully created.`)
  } else {
    logger.info(`Migrations folder ${migrationsFolderName} found, skipping creation of migrations folder.`)
  }

  const migrationFileNameDo = '001.do.sql'
  const migrationFileNameUndo = '001.undo.sql'
  const migrationFilePathDo = join(migrationsFolderName, migrationFileNameDo)
  const migrationFilePathUndo = join(migrationsFolderName, migrationFileNameUndo)
  const isMigrationFileDoExists = await isFileAccessible(migrationFilePathDo)
  const isMigrationFileUndoExists = await isFileAccessible(migrationFilePathUndo)
  if (!isMigrationFileDoExists) {
    await writeFile(migrationFilePathDo, moviesMigrationDo)
    logger.info(`Migration file ${migrationFileNameDo} successfully created.`)
    if (!isMigrationFileUndoExists) {
      await writeFile(migrationFilePathUndo, moviesMigrationUndo)
      logger.info(`Migration file ${migrationFileNameUndo} successfully created.`)
    }
  } else {
    logger.info(`Migration file ${migrationFileNameDo} found, skipping creation of migration file.`)
  }
  if (types === true) {
    await checkForDependencies(logger, args, config)
  }

  if (typescript === true) {
    const tsConfigFileName = 'tsconfig.json'
    const isTsConfigExists = await isFileAccessible(tsConfigFileName)
    if (!isTsConfigExists) {
      const tsConfig = getTsConfig(config.typescript.outDir)
      await writeFile(tsConfigFileName, JSON.stringify(tsConfig, null, 2))
      logger.info(`Typescript configuration file ${tsConfigFileName} successfully created.`)
    } else {
      logger.info(`Typescript configuration file ${tsConfigFileName} found, skipping creation of typescript configuration file.`)
    }
  }
}

export { init }
