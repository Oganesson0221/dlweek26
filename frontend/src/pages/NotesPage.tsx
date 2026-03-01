import React, { useState, useEffect } from "react";

interface Note {
  id: string;
  content: string;
  subject: string;
  sourceUrl?: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [newNote, setNewNote] = useState({ content: "", subject: "" });
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch notes from MongoDB API
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const url =
        filterSubject === "all"
          ? `${API_BASE_URL}/notes`
          : `${API_BASE_URL}/notes?subject=${encodeURIComponent(filterSubject)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch notes");

      const data = await response.json();
      setNotes(data.notes || []);
      setError(null);
    } catch (err) {
      setError("Failed to load notes. Make sure the backend is running.");
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [filterSubject]);

  // Add new note
  const handleAddNote = async () => {
    if (!newNote.content.trim() || !newNote.subject.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote.content,
          subject: newNote.subject,
          sourceUrl: window.location.href,
        }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      setNewNote({ content: "", subject: "" });
      setIsAddingNote(false);
      fetchNotes();
    } catch (err) {
      setError("Failed to add note");
      console.error("Error adding note:", err);
    }
  };

  // Update note
  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      setEditingNote(null);
      setEditContent("");
      fetchNotes();
    } catch (err) {
      setError("Failed to update note");
      console.error("Error updating note:", err);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");
      fetchNotes();
    } catch (err) {
      setError("Failed to delete note");
      console.error("Error deleting note:", err);
    }
  };

  // Get unique subjects for filter
  const subjects = ["all", ...new Set(notes.map((note) => note.subject))];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Clippy Notes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your saved notes from the Clippy browser extension
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Note
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              ×
            </button>
          </div>
        )}

        {/* Add Note Modal */}
        {isAddingNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Add New Note
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newNote.subject}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="e.g., Machine Learning, React, etc."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Note Content
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Write your note here..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsAddingNote(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-gray-600 dark:text-gray-400">
            Filter by subject:
          </span>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setFilterSubject(subject)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filterSubject === subject
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {subject === "all" ? "All Notes" : subject}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Notes Grid */}
        {!loading && notes.length === 0 && (
          <div className="text-center py-20">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No notes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Use the Clippy browser extension to save notes while browsing, or
              add notes directly here.
            </p>
            <button
              onClick={() => setIsAddingNote(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Your First Note
            </button>
          </div>
        )}

        {!loading && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
              >
                {/* Subject Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                    {note.subject}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingNote(note.id);
                        setEditContent(note.content);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                {editingNote === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateNote(note.id)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-4">
                    {note.content}
                  </p>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(note.created_at)}</span>
                    {note.sourceUrl && (
                      <a
                        href={note.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Source
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && notes.length > 0 && (
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-blue-500">
                  {notes.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Notes
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="text-3xl font-bold text-purple-500">
                  {new Set(notes.map((n) => n.subject)).size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Subjects
                </div>
              </div>
              <div className="w-px h-12 bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="text-3xl font-bold text-green-500">
                  {notes.filter((n) => n.sourceUrl).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  With Sources
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
