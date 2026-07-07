// ---------------------------------------------------------
// API CONFIG
// ---------------------------------------------------------

const API_URL = import.meta.env.VITE_API_BASE_URL;

async function parseJSONResponse(response) {
  try {
    return await response.json();
  } catch {
    const text = await response.text();
    throw new Error(`Backend returned non-JSON (${response.status}):\n${text}`);
  }
}

async function fetchWithRetry(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) return fetchWithRetry(url, options, retries - 1);
    throw err;
  }
}

// ---------------------------------------------------------
// 0. Analyze Script Style (POST)
// ---------------------------------------------------------
export const analyzeScriptStyle = async (formData) => {
  const response = await fetchWithRetry(
    `${API_URL}/api/v1/analyze_style`,
    { method: "POST", body: formData }
  );
  if (!response.ok) throw await parseJSONResponse(response);
  return await parseJSONResponse(response);
};

// ---------------------------------------------------------
// 1. Start Audio Story Job (POST)
// ---------------------------------------------------------
// 1. Start Job
export const generateAudioStory = async (formData) => {
  const response = await fetchWithRetry(
    `${API_URL}/api/v1/generate_audio_story`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw await parseJSONResponse(response);
  const data = await parseJSONResponse(response);
  return { task_id: data.task_id }; // Only returns ID now
};

// // 2. Check Status (New)
// export const checkTaskStatus = async (taskId) => {
//   const response = await fetchWithRetry(
//     `${API_URL}/api/v1/status/${taskId}`,
//     { method: "GET" }
//   );
//   if (!response.ok) throw await parseJSONResponse(response);
//   return await parseJSONResponse(response);
// };

// ---------------------------------------------------------
// 3. List User Jobs (GET)
// ---------------------------------------------------------
export const listUserJobs = async (userId, limit = 50) => {
  const response = await fetchWithRetry(
    `${API_URL}/api/v1/jobs?user_id=${userId}&limit=${limit}`,
    { method: "GET" }
  );
  if (!response.ok) throw await parseJSONResponse(response);
  return await parseJSONResponse(response);
};

// ---------------------------------------------------------
// 2. Check Job Status (GET) - New Function
// ---------------------------------------------------------
export const checkTaskStatus = async (taskId) => {
  const response = await fetchWithRetry(
    `${API_URL}/api/v1/status/${taskId}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) throw await parseJSONResponse(response);

  // Returns: { state: "PROCESSING" | "SUCCESS" | "FAILURE", progress: 30, result: {...} }
  return await parseJSONResponse(response);
};