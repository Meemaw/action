import {GraphQLObjectType} from 'graphql'
import {resolveNewMeeting} from '../resolvers'
import StandardMutationError from './StandardMutationError'
import NewMeeting from './NewMeeting'
import RetroDiscussStage from './RetroDiscussStage'
import {DISCUSS} from '../../../client/utils/constants'

const DragDiscussionTopicPayload = new GraphQLObjectType({
  name: 'DragDiscussionTopicPayload',
  fields: () => ({
    error: {
      type: StandardMutationError
    },
    meeting: {
      type: NewMeeting,
      resolve: resolveNewMeeting
    },
    stage: {
      type: RetroDiscussStage,
      resolve: async ({meetingId, stageId}, args, {dataLoader}) => {
        const meeting = await dataLoader.get('newMeetings').load(meetingId)
        const {phases} = meeting
        const discussPhase = phases.find((phase) => phase.phaseType === DISCUSS)
        const {stages} = discussPhase
        return stages.find((stage) => stage.id === stageId)
      }
    }
  })
})

export default DragDiscussionTopicPayload
