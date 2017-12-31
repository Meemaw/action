export const resolveInvitation = ({invitationId, invitation}, args, {dataLoader}) => {
  return invitationId ? dataLoader.get('invitations').load(invitationId) : invitation;
};

export const resolveNotification = ({notificationId, notification}, args, {dataLoader}) => {
  return notificationId ? dataLoader.get('notifications').load(notificationId) : notification;
};

export const resolveOrganization = ({orgId, organization}, args, {dataLoader}) => {
  return orgId ? dataLoader.get('organizations').load(orgId) : organization;
};

export const resolveOrgApproval = ({orgApprovalId, orgApproval}, args, {dataLoader}) => {
  return orgApprovalId ? dataLoader.get('orgApprovals').load(orgApprovalId) : orgApproval;
};

export const resolveTeam = ({team, teamId}, args, {dataLoader}) => {
  return teamId ? dataLoader.get('teams').load(teamId) : team;
};

export const resolveTeamMember = ({teamMemberId, teamMember}, args, {dataLoader}) => {
  return teamMemberId ? dataLoader.get('teamMembers').load(teamMemberId) : teamMember;
};

export const resolveSub = (type, resolver) => (source, args, context) => {
  if (type !== source.type) return null;
  return resolver(source, args, context);
};
