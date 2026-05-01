import { useState, useEffect } from 'react';
import { notificationApi } from '@plp/shared';

interface Template {
  id: string;
  templateCode: string;
  channel: string;
  subject: string;
  bodyTemplate: string;
  isActive: boolean;
}

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await notificationApi.templates();
      setTemplates(res.data?.data || []);
    } catch { setTemplates([]); }
    setLoading(false);
  }

  function startEdit(t: Template) {
    setEditing(t.id);
    setEditSubject(t.subject);
    setEditBody(t.bodyTemplate);
  }

  async function saveEdit(id: string) {
    try {
      await notificationApi.updateTemplate(id, { subject: editSubject, bodyTemplate: editBody });
      setEditing(null);
      loadTemplates();
    } catch (e) { console.error('Failed to save', e); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notification Templates</h1>
      <p className="text-sm text-gray-500 mb-4">
        Manage notification templates for loan lifecycle events. Variables use {'{{variableName}}'} syntax.
      </p>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No templates found. Seed templates are created on first service startup.</div>
      ) : (
        <div className="space-y-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {t.channel}
                  </span>
                  <span className="font-medium text-gray-900">{t.templateCode}</span>
                </div>
                {editing === t.id ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(t.id)} className="text-sm text-green-600 hover:underline">Save</button>
                    <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(t)} className="text-sm text-indigo-600 hover:underline">Edit</button>
                )}
              </div>
              {editing === t.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subject</label>
                    <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Body Template</label>
                    <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                      rows={3} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700 mb-1"><strong>Subject:</strong> {t.subject}</p>
                  <p className="text-sm text-gray-600">{t.bodyTemplate}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
