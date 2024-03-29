import Joi from 'joi'

import { OrgPartDeux, ProjectPartDeux, User } from "./../../lib/data-model-types"


interface SaraAuthZ {
    orgListedOnUser: (user: User, orgId: string) => void
    soleUserOnProject: (project: ProjectPartDeux, userId: string) => void
    userListedOnOrg: (org: OrgPartDeux, userId: string) => void
    userListedOnProject: (project: ProjectPartDeux, userId: string) => void
}

const orgListedOnUser = (user: User, orgId: string) => {
    if (Joi.any().required().not(null).validate(user).error) {
        throw new Error('User instance null/undefined')
    }

    if (Joi.any().required().not(null).validate(user.orgIds).error) {
        throw new Error('User org IDs null/undefined')
    }

    if (Joi.number().greater(0).validate(user.orgIds.length).error) {
        throw new Error('User org IDs empty')
    }

    if (Joi.string().required().validate(orgId).error) {
        throw new Error('Org ID null/undefined/empty')
    }

    const foundOrgIdOnUser = user.orgIds.find((userOrgId) => userOrgId === orgId)

    if (Joi.string().required().validate(foundOrgIdOnUser).error) {
        throw new Error('Org ID not associated with user')
    }
}

const soleUserOnProject = (project: ProjectPartDeux, userId: string) => {
    if (Joi.any().required().not(null).validate(project).error) {
        throw new Error('Project instance null/undefined')
    }

    if (Joi.any().required().not(null).validate(project.userIds).error) {
        throw new Error('Project user IDs null/undefined')
    }

    if (Joi.number().greater(0).validate(project.userIds.length).error) {
        throw new Error('Project user IDs empty')
    }

    if (Joi.number().less(2).validate(project.userIds.length).error) {
        throw new Error('Project has multiple user IDs')
    }

    if (Joi.string().required().validate(userId).error) {
        throw new Error('User ID null/undefined/empty')
    }

    const foundUserOnProject = project.userIds.find((projectUserId) => projectUserId === userId)

    if (Joi.string().required().validate(foundUserOnProject).error) {
        throw new Error('User ID not associated with project')
    }
}

const userListedOnOrg = (org: OrgPartDeux, userId: string) => {
    if (Joi.any().required().not(null).validate(org).error) {
        throw new Error('Org instance null/undefined')
    }

    if (Joi.any().required().not(null).validate(org.userIds).error) {
        throw new Error('Org user IDs null/undefined')
    }

    if (Joi.number().greater(0).validate(org.userIds.length).error) {
        throw new Error('Org user IDs empty')
    }

    if (Joi.string().required().validate(userId).error) {
        throw new Error('User ID null/undefined/empty')
    }

    const foundUserIdOnOrg = org.userIds.find((orgUserId) => orgUserId === userId)

    if (Joi.string().required().validate(foundUserIdOnOrg).error) {
        throw new Error('User ID not associated with org')
    }
}

const userListedOnProject = (project: ProjectPartDeux, userId: string) => {
    if (Joi.any().required().not(null).validate(project).error) {
        throw new Error('Project instance null/undefined')
    }

    if (Joi.any().required().not(null).validate(project.userIds).error) {
        throw new Error('Project user IDs null/undefined')
    }

    if (Joi.number().greater(0).validate(project.userIds.length).error) {
        throw new Error('Project user IDs empty')
    }

    if (Joi.string().required().validate(userId).error) {
        throw new Error('User ID null/undefined/empty')
    }

    const foundUserOnProject = project.userIds.find((projectUserId) => projectUserId === userId)

    if (Joi.string().required().validate(foundUserOnProject).error) {
        throw new Error('User ID not associated with project')
    }
}

const authz: SaraAuthZ = {
    orgListedOnUser,
    soleUserOnProject,
    userListedOnOrg,
    userListedOnProject
}

export default authz