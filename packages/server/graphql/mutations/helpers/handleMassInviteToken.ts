import {verifyMassInviteToken} from '../../../utils/massInviteToken'
import TeamInvitation from '../../../database/types/TeamInvitation'
import getRethink from '../../../database/rethinkDriver'
import {DataLoaderWorker} from '../../graphql'

const handleMassInviteToken = async (
  invitationToken: string,
  email: string,
  dataLoader: DataLoaderWorker
) => {
  const validToken = await verifyMassInviteToken(invitationToken, dataLoader)
  if (validToken.error) return {error: validToken.error}
  const r = await getRethink()
  const {teamId, userId: invitedBy, exp: expiresAt} = validToken
  const invitation = new TeamInvitation({
    token: invitationToken,
    invitedBy,
    teamId,
    expiresAt,
    email
  })
  await r
    .table('TeamInvitation')
    .insert(invitation)
    .run()
  return {invitation}
}

export default handleMassInviteToken
