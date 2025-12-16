"use client";

import { useState, useEffect, useRef } from "react"; // Added useEffect
import { getAuth } from "firebase/auth";

// ... (RichTextEditor Component remains exactly the same as before) ...
const RichTextEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleChange();
  };
  const handleChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleFormat("bold");
          }}
          className="px-3 font-bold border rounded bg-white"
        >
          B
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleFormat("italic");
          }}
          className="px-3 italic border rounded bg-white"
        >
          I
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleFormat("underline");
          }}
          className="px-3 underline border rounded bg-white"
        >
          U
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleFormat("insertUnorderedList");
          }}
          className="px-3 border rounded bg-white"
        >
          • List
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleChange}
        className="min-h-[150px] p-4 outline-none"
      />
    </div>
  );
};

export default function NewsletterSender() {
  const [activeTab, setActiveTab] = useState("compose"); // 'compose' or 'history'
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [history, setHistory] = useState([]);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const API_URL = "https://higestdata-proxy.onrender.com";

  // --- FETCH HISTORY ---
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/newsletter/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "history") fetchHistory();
  };

  // --- STEP 1: FETCH USERS ---
  const handleReview = async (e) => {
    e.preventDefault();
    if (!content.trim())
      return setStatus({ type: "error", message: "Content is required" });

    setIsLoading(true);
    setStatus({ type: "info", message: "Fetching user list..." });

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not logged in");

      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRecipients(data.users || []);
      setStep(2);
      setStatus({ type: "", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipient = (email) =>
    setRecipients((p) => p.filter((r) => r.email !== email));
  const addManualRecipient = () => {
    if (!newEmail) return;
    setRecipients((p) => [
      ...p,
      { email: newEmail, name: newName || "Friend" },
    ]);
    setNewEmail("");
    setNewName("");
  };

  // --- STEP 2: SEND ---
  const handleFinalSend = async () => {
    if (!confirm(`Send to ${recipients.length} users?`)) return;
    setIsLoading(true);
    setStatus({
      type: "info",
      message: "Syncing & Sending (this may take 10s)...",
    });

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/api/newsletter/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, content, recipients }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({
        type: "success",
        message: "Sent! Check History tab for status.",
      });
      setTimeout(() => {
        setStep(1);
        setSubject("");
        setContent("");
        setRecipients([]);
        // Clean editor
        if (document.querySelector("[contenteditable]"))
          document.querySelector("[contenteditable]").innerHTML = "";
      }, 3000);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
      {/* TABS */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => handleTabChange("compose")}
          className={`px-6 py-3 text-sm font-bold ${
            activeTab === "compose"
              ? "bg-white border-t-2 border-t-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Compose Email
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={`px-6 py-3 text-sm font-bold ${
            activeTab === "history"
              ? "bg-white border-t-2 border-t-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent History
        </button>
      </div>

      <div className="p-6">
        {/* --- HISTORY TAB --- */}
        {activeTab === "history" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Past Newsletters
              </h2>
              <button
                onClick={fetchHistory}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            {isLoading && history.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Loading history...
              </p>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Campaign Name</th>
                      <th className="p-3">Sent</th>
                      <th className="p-3">Opened</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              h.status === "sent"
                                ? "bg-green-100 text-green-700"
                                : h.status === "draft"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {h.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          {h.name}
                        </td>
                        <td className="p-3">{h.stats?.sent || 0}</td>
                        <td className="p-3">{h.stats?.opens_count || 0}</td>
                        <td className="p-3 text-gray-500">
                          {new Date(h.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-4 text-center text-gray-400"
                        >
                          No history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- COMPOSE TAB --- */}
        {activeTab === "compose" && (
          <>
            {step === 1 ? (
              <form onSubmit={handleReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    required
                    className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Message
                  </label>
                  <RichTextEditor value={content} onChange={setContent} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-bold"
                >
                  {isLoading ? "Loading..." : "Next: Review Recipients"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded">
                  <span className="font-bold text-blue-900">
                    {recipients.length} Recipients
                  </span>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-blue-600 underline"
                  >
                    Edit Message
                  </button>
                </div>

                {/* Manual Add */}
                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded text-sm flex-1"
                    placeholder="Add Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <button
                    onClick={addManualRecipient}
                    className="bg-green-600 text-white px-4 rounded text-sm"
                  >
                    Add
                  </button>
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto border rounded">
                  {recipients.map((u, i) => (
                    <div
                      key={i}
                      className="flex justify-between p-2 border-b text-sm"
                    >
                      <span>{u.email}</span>
                      <button
                        onClick={() => removeRecipient(u.email)}
                        className="text-red-500 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleFinalSend}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-4 rounded font-bold shadow hover:bg-green-700"
                >
                  {isLoading ? "Sending..." : "Confirm & Send"}
                </button>
              </div>
            )}

            {status.message && (
              <div
                className={`mt-4 p-3 rounded text-center text-sm ${
                  status.type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {status.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
