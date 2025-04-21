import { apiZendesk } from "./http.js";
import { convertEventToText } from "./helpers.js";
import moment from "moment";

export const Zendesk = {
  getLeads: async (EMAIL) => {
    let result = false;
    const email = EMAIL;

    try {
      const payload = { email };
      const queryString = new URLSearchParams(payload).toString();
      const { data } = await apiZendesk("get", `leads?${queryString}`);
      if (data?.items.length == 0) {
        throw "Not found";
      }
      const lead = data.items[0].data;
      result = lead;
    } catch (error) {
      // console.error(error);
      result = false;
    }

    if (!result) {
      // result = `lead not found!!`;
      result = false;
    }

    return result;
  },

  getUser: async (id) => {
    let result = false;
    try {
      const { data } = await apiZendesk("get", `users/${id}`);
      const user = data.data;
      result = user;
    } catch (error) {
      // console.error(error);
      // result = false;
    }
    // if (!result) {
    //   result = `user not found!!`;
    // }
    return result;
  },

  addNotes: async (body) => {
    let result = false;
    try {
      const { data } = await apiZendesk("post", `notes`, body);
      result = true;
    } catch (error) {
      // console.error(error);
      result = false;
    }
    return result;
  },

  addTask: async (body) => {
    let result = false;
    try {
      const { data } = await apiZendesk("post", `tasks`, body);
      result = true;
    } catch (error) {
      // console.error(error);
      result = false;
    }
    return result;
  },
};

export const generateTaskJson = (obj) => {
  // Task name: Lead research need ({activity} cold email)
  // Due date: 2 days after created
  // Reminder 1 day before
  // Owner: {Lead Owner}
  const { resource_id, owner_id, activity_type } = obj;
  const remind_date = moment().add(1, "days");
  const due_date = moment().add(2, "days");
  const body = {
    data: {
      resource_type: "lead",
      owner_id,
      resource_id,
      due_date: `${due_date}`,
      remind_at: `${remind_date}`,
      content: `Lead research need (${activity_type} cold email)`,
    },
    meta: {
      type: "task",
    },
  };
  return body;
};

export const generateNotesJson = (obj) => {
  const { resource_id } = obj;
  const { owner_email, campaign_name, activity_type, activity_timestamp } = obj;

  let formattedTimestamp = activity_timestamp;
  if (formattedTimestamp) {
    formattedTimestamp = moment
      .utc(formattedTimestamp)
      .format("MM.DD.YYYY - hh:mm:ss A");
  }
  const content = `${owner_email} \n Cold email campaign: ${campaign_name} \n Activity: ${activity_type} \n Timestamp: ${formattedTimestamp}`;

  return {
    data: {
      resource_type: "lead",
      resource_id, // lead_id
      content,
      is_important: true,
      type: "regular",
      tags: [],
    },
    meta: {
      type: "note",
    },
  };
};
