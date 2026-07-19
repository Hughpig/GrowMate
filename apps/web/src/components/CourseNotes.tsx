"use client";

import { useState } from "react";
import { BookX, Plus, X } from "lucide-react";

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

interface CourseNotesProps {
  courseId: string;
  courseTitle: string;
}

export function CourseNotes({ courseId, courseTitle }: CourseNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: new Date(),
      };
      setNotes([note, ...notes]);
      setNewNote("");
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookX className="w-4 h-4 text-amber-600" />
          <div className="text-sm font-medium text-amber-800">学习笔记</div>
          <div className="text-xs text-amber-600">{courseTitle}</div>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-amber-700 hover:text-amber-800 font-medium"
        >
          {showNotes ? "收起笔记" : "查看笔记"}
        </button>
      </div>

      {showNotes && (
        <div className="space-y-3">
          {/* 添加新笔记 */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="记录你的学习心得、疑问或重要知识点..."
              className="textarea w-full text-sm"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="btn btn-primary text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                添加笔记
              </button>
            </div>
          </div>

          {/* 已有笔记 */}
          {notes.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-xs text-amber-600">{formatDate(note.timestamp)}</div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs text-amber-500 hover:text-amber-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-sm text-stone-700">{note.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-amber-600">
              还没有笔记，开始记录你的学习心得吧！
            </div>
          )}
        </div>
      )}
    </div>
  );
}