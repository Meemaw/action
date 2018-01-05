import {showWarning} from 'universal/modules/toast/ducks/toastDuck';
import {approveToOrgNotificationUpdater} from 'universal/mutations/ApproveToOrgMutation';
import {cancelApprovalNotificationUpdater} from 'universal/mutations/CancelApprovalMutation';
import {cancelTeamInviteNotificationUpdater} from 'universal/mutations/CancelTeamInviteMutation';
import {clearNotificationNotificationUpdater} from 'universal/mutations/ClearNotificationMutation';
import {createProjectNotificationUpdater} from 'universal/mutations/CreateProjectMutation';
import {deleteProjectNotificationUpdater} from 'universal/mutations/DeleteProjectMutation';
import handleAddNotifications from 'universal/mutations/handlers/handleAddNotifications';
import {inviteTeamMembersNotificationUpdater} from 'universal/mutations/InviteTeamMembersMutation';
import {rejectOrgApprovalNotificationUpdater} from 'universal/mutations/RejectOrgApprovalMutation';
import {APP_UPGRADE_PENDING_KEY, APP_UPGRADE_PENDING_RELOAD, APP_VERSION_KEY} from 'universal/utils/constants';
import getInProxy from 'universal/utils/relay/getInProxy';
import toTeamMemberId from 'universal/utils/relay/toTeamMemberId';

// ... on NotificationAdded {
//  notification {
//    id
//    orgId
//    startAt
//    type
//
//          # Requirements for persisted notifications
//  ...NotificationRow_notification
//
//          # Requiremnts for toast notifications (notificationHandler.js)
//  ... on NotifyAddedToTeam {
//      id
//      team {
//        name
//      }
//    }
//  ... on NotifyDenial {
//      inviteeEmail
//    }
//  ... on NotifyKickedOut {
//      team {
//        id
//        name
//      }
//    }
//  ... on NotifyProjectInvolves {
//      involvement
//      changeAuthor {
//        preferredName
//      }
//    }
//  ,,, on NotifyInviteeApproved {
//      inviteeEmail
//      team {
//        id
//        name
//      }
//    }
//  ... on NotifyInvitation {
//      inviter {
//        preferredName
//      }
//      inviteeEmail
//      team {
//        id
//        name
//        tier
//      }
//    }
//  ... on NotifyTeamArchived {
//      team {
//        name
//      }
//    }
//
//          # Requirements for toast notifications that aren't persisted
//  ... on NotifyFacilitatorRequest {
//      requestor {
//        id
//        preferredName
//      }
//    }
//  ... on NotifyNewTeamMember {
//      preferredName
//      team {
//        name
//      }
//    }
//  ... on NotifyVersionInfo {
//      version
//    }
//  }
// }
// ... on NotificationRemoved {
//  notification {
//    id
//  }
// }

const subscription = graphql`
  subscription NotificationSubscription {
    notificationSubscription {
      __typename
      ...ApproveToOrgMutation_notification
      ...CancelApprovalMutation_notification
      ...CancelTeamInviteMutation_notification
      ...ClearNotificationMutation_notification
      ...CreateProjectMutation_notification
      ...DeleteProjectMutation_notification
      ...InviteTeamMembersMutation_notification
      ...RejectOrgApprovalMutation_notification

      # ConnectSocket/DisconnectSocket
      ... on User {
        id
        isConnected
      }

      # App Version Updater
      ... on NotifyVersionInfo {
        version
      }

      # Stripe webhooks
      ... on StripeFailPaymentPayload {
        notification {
          ...PaymentRejected_notification @relay(mask: false)
        }
      }
    }
  }
`;

const connectSocketUserUpdater = (payload, store, viewerId) => {
  const isConnected = payload.getValue('isConnected');
  const userId = payload.getValue('id');
  const viewer = store.get(viewerId);
  const teams = viewer.getLinkedRecords('teams');
  if (!teams) return;
  const teamMemberIds = teams.map((team) => toTeamMemberId(team.getValue('id'), userId));
  teamMemberIds.forEach((teamMemberId) => {
    const teamMember = store.get(teamMemberId);
    if (!teamMember) return;
    teamMember.setValue(isConnected, 'isConnected');
  });
};

const popUpgradeAppToast = (payload, {dispatch, history}) => {
  const versionOnServer = payload.getValue('version');
  const versionInStorage = window.localStorage.getItem(APP_VERSION_KEY);
  if (versionOnServer !== versionInStorage) {
    dispatch(showWarning({
      title: 'New stuff!',
      message: 'A new version of Parabol is available',
      autoDismiss: 0,
      action: {
        label: 'Log out and upgrade',
        callback: () => {
          history.replace('/signout');
        }
      }
    }));
    window.sessionStorage.setItem(APP_UPGRADE_PENDING_KEY,
      APP_UPGRADE_PENDING_RELOAD);
  }
};

const popPaymentFailedToast = (payload, {dispatch, history}) => {
  const orgId = getInProxy(payload, 'organization', 'id');
  const orgName = getInProxy(payload, 'organization', 'name');
  // TODO add brand and last 4
  dispatch(showWarning({
    autoDismiss: 10,
    title: 'Oh no!',
    message: `Your credit card for ${orgName} was rejected.`,
    action: {
      label: 'Fix it!',
      callback: () => {
        history.push(`/me/organizations/${orgId}`);
      }
    }
  }));
};

const stripeFailPaymentNotificationUpdater = (payload, store, viewerId, options) => {
  const notification = payload.getLinkedRecord('notification');
  handleAddNotifications(notification, store, viewerId);
  popPaymentFailedToast(payload, options);
};

const NotificationSubscription = (environment, queryVariables, {dispatch, history, location}) => {
  const {viewerId} = environment;
  return {
    subscription,
    updater: (store) => {
      const options = {dispatch, environment, history, location, store};
      const payload = store.getRootField('notificationSubscription');
      const type = payload.getValue('__typename');
      switch (type) {
        case 'ApproveToOrgPayload':
          approveToOrgNotificationUpdater(payload, options);
          break;
        case 'CancelApprovalPayload':
          cancelApprovalNotificationUpdater(payload, store, viewerId);
          break;
        case 'CancelTeamInvitePayload':
          cancelTeamInviteNotificationUpdater(payload, store, viewerId);
          break;
        case 'ClearNotificationPayload':
          clearNotificationNotificationUpdater(payload, store, viewerId);
          break;
        case 'CreateProjectPayload':
          createProjectNotificationUpdater(payload, store, viewerId, options);
          break;
        case 'DeleteProjectPayload':
          deleteProjectNotificationUpdater(payload, store, viewerId);
          break;
        case 'InviteTeamMembersPayload':
          inviteTeamMembersNotificationUpdater(payload, store, viewerId, options);
          break;
        case 'RejectOrgApprovalPayload':
          rejectOrgApprovalNotificationUpdater(payload, store, viewerId);
          break;
        case 'User':
          connectSocketUserUpdater(payload, store, viewerId);
          break;
        case 'NotifyVersionInfo':
          popUpgradeAppToast(payload, options);
          break;
        case 'StripeFailPaymentPayload':
          stripeFailPaymentNotificationUpdater(payload, store, viewerId, options);
          break;
        default:
          console.error('NotificationSubscription case fail', type);
      }
      // const notification = payload.getLinkedRecord('notification');
      // if (type === 'NotificationAdded') {
      //  handleAddNotifications(notification, options);
      // } else if (type === 'NotificationRemoved') {
      //  const notificationId = notification.getValue('id');
      //  handleRemoveNotifications(notificationId, store, viewerId);
      // }
    }
  };
};

export default NotificationSubscription;
