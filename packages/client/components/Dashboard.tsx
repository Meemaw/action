import {Dashboard_viewer} from '../__generated__/Dashboard_viewer.graphql'
import React, {lazy} from 'react'
import styled from '@emotion/styled'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {Route, Switch} from 'react-router'
import DashSidebar from './Dashboard/DashSidebar'
import DashAlert from './DashAlert'
import ResponsiveDashSidebar from './ResponsiveDashSidebar'
import useSidebar from '../hooks/useSidebar'
import {Breakpoint} from 'types/constEnums'
import MobileDashSidebar from './Dashboard/MobileDashSidebar'
import SwipeableDashSidebar from './SwipeableDashSidebar'
import useBreakpoint from 'hooks/useBreakpoint'
import DashTopBar from './DashTopBar'
import MobileDashTopBar from './MobileDashTopBar'

const UserDashboard = lazy(() =>
  import(
    /* webpackChunkName: 'UserDashboard' */ '../modules/userDashboard/components/UserDashboard/UserDashboard'
  )
)
const TeamRoot = lazy(() =>
  import(/* webpackChunkName: 'TeamRoot' */ '../modules/teamDashboard/components/TeamRoot')
)
const NewTeam = lazy(() =>
  import(
    /* webpackChunkName: 'NewTeamRoot' */ '../modules/newTeam/containers/NewTeamForm/NewTeamRoot'
  )
)

interface Props {
  viewer: Dashboard_viewer | null
}

const DashLayout = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
  // overflow: 'auto', removed because react-beautiful-dnd only supports 1 scrolling parent
})

const DashPanel = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: '100%',
  // any overflows should not include the width of the left nav
  overflow: 'hidden'
})

const DashMain = styled('div')({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  overflow: 'auto',
  position: 'relative'
})

const Dashboard = (props: Props) => {
  const {viewer} = props
  const {isOpen, toggle, handleMenuClick} = useSidebar()
  const isDesktop = useBreakpoint(Breakpoint.SIDEBAR_LEFT)
  return (
    <DashLayout>
      {isDesktop ? <DashTopBar /> : <MobileDashTopBar />}
      <DashAlert viewer={viewer} />
      <DashPanel>
        {isDesktop ? (
          <ResponsiveDashSidebar isOpen={isOpen} onToggle={toggle}>
            <DashSidebar viewer={viewer} handleMenuClick={handleMenuClick} />
          </ResponsiveDashSidebar>
        ) : (
          <SwipeableDashSidebar isOpen={isOpen} onToggle={toggle}>
            <MobileDashSidebar viewer={viewer} handleMenuClick={handleMenuClick} />
          </SwipeableDashSidebar>
        )}
        <DashMain>
          <Switch>
            <Route
              path='/me'
              render={(p) => (
                <UserDashboard {...p} notifications={viewer ? viewer.notifications : null} />
              )}
            />
            <Route path='/team/:teamId' component={TeamRoot} />
            <Route path='/newteam/:defaultOrgId?' component={NewTeam} />
          </Switch>
        </DashMain>
      </DashPanel>
    </DashLayout>
  )
}

export default createFragmentContainer(Dashboard, {
  viewer: graphql`
    fragment Dashboard_viewer on User {
      ...MobileDashSidebar_viewer
      ...DashAlert_viewer
      notifications(first: 100) @connection(key: "DashboardWrapper_notifications") {
        edges {
          node {
            id
            orgId
            startAt
            type
            ...NotificationRow_notification
          }
        }
      }
      ...DashSidebar_viewer
    }
  `
})
