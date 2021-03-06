import { Logger } from 'botpress/sdk'
import chokidar from 'chokidar'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'

import { TYPES } from '../../types'

import { ObjectCache } from '.'

export namespace CacheInvalidators {
  enum ChangeEventAction {
    CREATED = 0,
    DELETED = 1,
    MODIFIED = 2,
    RENAMED = 3
  }

  /**
   * See https://github.com/Axosoft/nsfw/tree/master/docs
   */
  interface ChangeEventType {
    /** the type of event that occurred */
    action: ChangeEventAction
    /** the location the event took place */
    directory: string
    /** the name of the file that was changed (Not available for rename events) */
    file: string
    /** the name of the file before a rename (Only available for rename events) */
    oldFile: string
    /** the name of the file after a rename (Only available for rename events) */
    newFile: string
  }

  @injectable()
  export class FileChangedInvalidator {
    constructor(
      @inject(TYPES.Logger)
      @tagged('name', 'CacheInvalidator')
      private logger: Logger
    ) {}
    watcher!: {
      start: Function
      stop: Function
    }
    cache?: ObjectCache

    async install(objectCache: ObjectCache) {
      this.cache = objectCache

      const watcher = chokidar.watch(path.join(process.PROJECT_LOCATION, './data'), {
        ignoreInitial: true,
        ignored: '**data/storage/**',
        ignorePermissionErrors: true
      })

      watcher.on('add', this.handle)
      watcher.on('change', this.handle)
      watcher.on('unlink', this.handle)
      watcher.on('error', err => this.logger.attachError(err).error(`Watcher error`))
    }

    async stop() {
      await this.watcher.stop()
    }

    handle = file => {
      if (!this.cache) {
        return
      }

      const relativePath = path.relative(process.PROJECT_LOCATION, path.dirname(file))
      this.cache.invalidateStartingWith(relativePath)
    }
  }
}
