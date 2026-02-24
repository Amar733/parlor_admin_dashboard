// Simple database using localStorage for persistence
const STORAGE_KEY = 'meetings_db';

const getDB = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDB = (data: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const db = {
  createMeeting: (data: any) => {
    const meetings = getDB();
    const meeting = {
      id: data.linkId,
      appointmentId: data.appointmentId,
      channel: data.channel,
      linkId: data.linkId,
      patientName: data.patientName,
      doctorName: data.doctorName,
      createdAt: new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      duration: 0,
      status: 'scheduled'
    };
    meetings.push(meeting);
    saveDB(meetings);
    return meeting;
  },

  getMeeting: (linkId: string) => {
    const meetings = getDB();
    return meetings.find((m: any) => m.linkId === linkId);
  },

  startMeeting: (linkId: string) => {
    const meetings = getDB();
    const meeting = meetings.find((m: any) => m.linkId === linkId);
    if (meeting) {
      meeting.startedAt = new Date().toISOString();
      meeting.status = 'ongoing';
      saveDB(meetings);
    }
    return meeting;
  },

  endMeeting: (linkId: string) => {
    const meetings = getDB();
    const meeting = meetings.find((m: any) => m.linkId === linkId);
    if (meeting && meeting.startedAt) {
      meeting.endedAt = new Date().toISOString();
      meeting.duration = Math.floor((new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt).getTime()) / 1000);
      meeting.status = 'completed';
      saveDB(meetings);
    }
    return meeting;
  },

  getAllMeetings: () => {
    return getDB();
  },

  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
