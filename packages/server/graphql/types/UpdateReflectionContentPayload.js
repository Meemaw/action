import {GraphQLObjectType} from 'graphql'
import {makeResolve, resolveNewMeeting} from '../resolvers'
import StandardMutationError from './StandardMutationError'
import NewMeeting from './NewMeeting'
import RetroReflection from './RetroReflection'

const UpdateReflectionContentPayload = new GraphQLObjectType({
  name: 'UpdateReflectionContentPayload',
  fields: () => ({
    error: {
      type: StandardMutationError
    },
    meeting: {
      type: NewMeeting,
      resolve: resolveNewMeeting
    },
    reflection: {
      type: RetroReflection,
      resolve: makeResolve('reflectionId', 'reflection', 'retroReflections')
    }
  })
})

export default UpdateReflectionContentPayload
