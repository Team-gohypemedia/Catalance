const asQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

const readJson = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload?.data ?? payload ?? null;
};

const request = async (authFetch, path, options = {}) => {
  const response = await authFetch(path, options);
  return readJson(response);
};

export const pmApi = {
  async getDashboard(authFetch) {
    return await request(authFetch, "/pm/dashboard/summary");
  },

  getUpcomingMeetings(authFetch) {
    return request(authFetch, "/pm/dashboard/upcoming-meetings");
  },

  getProjects(authFetch) {
    return request(authFetch, "/pm/projects");
  },

  getProjectDetails(authFetch, projectId) {
    return request(authFetch, `/pm/projects/${projectId}/details`);
  },

  getProjectMessages(authFetch, projectId) {
    return request(authFetch, `/pm/projects/${projectId}/messages`);
  },

  sendProjectMessage(authFetch, projectId, content) {
    return request(authFetch, `/pm/projects/${projectId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  },

  getProjectMilestones(authFetch, projectId) {
    return request(authFetch, `/pm/projects/${projectId}/milestones`);
  },

  approveMilestone(authFetch, projectId, phase, pmNote) {
    return request(authFetch, `/pm/projects/${projectId}/milestone-approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, pmNote }),
    });
  },

  escalateProject(authFetch, projectId, reason, description) {
    return request(authFetch, `/pm/projects/${projectId}/escalate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, description }),
    });
  },

  finalizeHandover(authFetch, projectId, checklist) {
    return request(authFetch, `/pm/projects/${projectId}/finalize-handover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handoverConfirmed: Boolean(checklist.sourceCodeTransferred),
        deliverablesConfirmed: Boolean(checklist.documentationFinalized),
        finalFilesDelivered: Boolean(checklist.finalFilesDelivered),
        receiptConfirmed: Boolean(checklist.credentialsShared),
        noIssuesConfirmed: Boolean(checklist.noPendingIssues),
      }),
    });
  },

  getMeetings(authFetch, params = {}) {
    return request(authFetch, `/pm/meetings${asQuery(params)}`);
  },

  detectMeetingConflicts(authFetch, payload) {
    return request(authFetch, "/pm/meetings/conflicts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  createMeeting(authFetch, payload) {
    return request(authFetch, "/pm/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  rescheduleMeeting(authFetch, meetingId, payload) {
    return request(authFetch, `/pm/meetings/${meetingId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  searchFreelancers(authFetch, params = {}) {
    return request(authFetch, `/pm/freelancers${asQuery(params)}`);
  },

  getFreelancerDetails(authFetch, freelancerId) {
    return request(authFetch, `/pm/freelancers/${freelancerId}`);
  },

  inviteFreelancer(authFetch, freelancerId, payload) {
    return request(authFetch, `/pm/freelancers/${freelancerId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  replaceFreelancer(authFetch, projectId, freelancerId) {
    return request(authFetch, `/pm/projects/${projectId}/replace-freelancer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freelancerId }),
    });
  },

  addInternalReview(authFetch, freelancerId, payload) {
    return request(authFetch, `/pm/freelancers/${freelancerId}/internal-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getProfile(authFetch) {
    return request(authFetch, "/pm/profile");
  },

  submitProfileEdit(authFetch, payload) {
    return request(authFetch, "/pm/profile-update-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getActiveProfileRequest(authFetch) {
    return request(authFetch, "/pm/profile-update-request/active");
  },

  async listReports(authFetch) {
    return await request(authFetch, "/pm/reports");
  },

  createReport(authFetch, payload) {
    return request(authFetch, "/pm/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getReport(authFetch, reportId) {
    return request(authFetch, `/pm/reports/${reportId}`);
  },

  createProjectSetup(authFetch, payload) {
    return request(authFetch, "/pm/projects/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getNotifications(authFetch) {
    return request(authFetch, "/pm/notifications");
  },
};
