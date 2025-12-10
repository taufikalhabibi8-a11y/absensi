import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceRecord, AiAnalysisData, Volunteer } from "../types";
import { JOB_SCHEDULES } from "../constants/JobSchedules";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST_IMAGE = 'gemini-2.5-flash';
const MODEL_SMART_TEXT = 'gemini-2.5-flash';

export const verifyCheckInPhoto = async (base64Image: string): Promise<{ isVerified: boolean; note: string }> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL_FAST_IMAGE,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this volunteer check-in photo for a community kitchen (Dapur MBG). 
            1. Determine if a real human face is clearly visible. 
            2. Check for kitchen hygiene gear: Mask, Hairnet, or Apron.
            3. Describe the environment briefly.
            4. Return JSON.
            `
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasFace: { type: Type.BOOLEAN },
            hasHygieneGear: { type: Type.BOOLEAN },
            environment: { type: Type.STRING },
            gearDescription: { type: Type.STRING },
          },
          required: ["hasFace", "environment"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    const isVerified = result.hasFace === true;
    let note = isVerified 
      ? `Verified: Face detected in ${result.environment}.` 
      : `Warning: No clear face detected. Environment: ${result.environment}`;
    
    if (isVerified && result.hasHygieneGear) {
      note += ` Hygiene Check: PASS (${result.gearDescription || 'Gear detected'}).`;
    } else if (isVerified) {
      note += ` Hygiene Check: No mask/apron detected.`;
    }

    return { isVerified, note };

  } catch (error) {
    console.error("Gemini Image Analysis failed:", error);
    return { isVerified: true, note: "AI Verification unavailable (Offline)" };
  }
};

export const generateAttendanceReport = async (records: AttendanceRecord[]): Promise<string> => {
  try {
    const recordsSummary = JSON.stringify(records.map(r => ({
      name: r.userName,
      type: r.type,
      activity: r.activity || 'General',
      time: new Date(r.timestamp).toLocaleString(),
      note: r.aiVerificationNote
    })));

    const response = await ai.models.generateContent({
      model: MODEL_SMART_TEXT,
      contents: `You are the Coordinator for "Dapur Kalibata 2" (Program Makan Bergizi Gratis). 
      Analyze the following volunteer logs and provide a daily operational report.
      
      Data:
      ${recordsSummary}

      Please include:
      1. Total volunteers present and breakdown by Activity.
      2. Hygiene compliance summary.
      3. Operational irregularities based on check-in times vs roles.
      4. Motivating message.
      `,
    });

    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini Report Gen failed:", error);
    return "Error generating report.";
  }
};

export const generateDashboardAnalysis = async (
  records: AttendanceRecord[], 
  totalVolunteers: number
): Promise<AiAnalysisData> => {
  try {
    const today = new Date().setHours(0,0,0,0);
    const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today && r.type === 'CLOCK_IN');

    const context = {
      totalRegistered: totalVolunteers,
      presentCount: todayRecords.length,
      scheduleReference: JOB_SCHEDULES,
      attendanceLog: todayRecords.map(r => ({
        role: r.activity,
        time: new Date(r.timestamp).toLocaleTimeString(),
        name: r.userName
      }))
    };

    const response = await ai.models.generateContent({
      model: MODEL_SMART_TEXT,
      contents: `Analyze current operations for Dapur Kalibata 2 MBG based on this JSON context: ${JSON.stringify(context)}.
      
      Roles & Schedules:
      - Gudang: 18:00-02:00
      - Helper: 00:00-08:00
      - Cook: 01:00-09:00
      - Pemorsian: 03:00-11:00
      - Driver: 07:00-15:00
      - Cuci Ompreng: 13:30-21:30

      Task:
      1. Calculate role breakdown (count per role).
      2. Predict portions (Assume 1 Cook = 300 portions, 1 Helper = 150 portions).
      3. Identify anomalies (Who is late based on their role schedule? Anyone working wrong hours?).
      4. Return JSON matching the schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            attendanceRate: { type: Type.NUMBER },
            roleBreakdown: { type: Type.OBJECT, additionalProperties: true },
            predictedPortions: { type: Type.NUMBER },
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "attendanceRate", "predictedPortions"]
        }
      }
    });

    return JSON.parse(response.text || '{}');

  } catch (error) {
    console.error("Dashboard Analysis Failed", error);
    return {
      summary: "AI Analysis unavailable currently.",
      attendanceRate: 0,
      roleBreakdown: {},
      predictedPortions: 0,
      anomalies: []
    };
  }
};