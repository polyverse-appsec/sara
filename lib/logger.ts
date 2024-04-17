import pino from 'pino'

import { Org, Project, User } from './../lib/data-model-types'

export interface SaraLogContext {
  user?: User
  org?: Org
  project?: Project
  other?: {}
  error?: any
}

const buildMergingObjectFromContext = (context: SaraLogContext) => ({
  context: {
    userId: context.user?.id,
    userEmail: context.user?.email,
    orgId: context.org?.id,
    orgName: context.org?.name,
    projectId: context.project?.id,
    projectName: context.project?.name,
    other: context.other,
    error: context.error,
  },
})

class SaraLogger {
  logger: any

  constructor() {
    this.logger = pino()
  }

  error(message: string) {
    this.logger.error(message)
  }

  errorWithContext(message: string, context: SaraLogContext) {
    const mergingObject = buildMergingObjectFromContext(context)

    this.logger.error(mergingObject, message)
  }

  info(message: string) {
    this.logger.info(message)
  }

  infoWithContext(message: string, context: SaraLogContext) {
    const mergingObject = buildMergingObjectFromContext(context)

    this.logger.info(mergingObject, message)
  }
}

const logger = new SaraLogger()

export default logger
