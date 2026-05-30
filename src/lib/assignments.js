import { supabase } from './supabase';

export async function getAssignments(classIds) {
  let query = supabase.from('assignments').select('*');
  if (classIds?.length) {
    query = query.in('class_id', classIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(fromSupabaseAssignment);
}

export async function getProgress(studentId) {
  let query = supabase.from('assignment_progress').select('*');
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(fromSupabaseProgress);
}

export async function markTaskComplete(studentId, assignmentId, taskKey) {
  const id = `${studentId}_${assignmentId}`;
  const { data: existing } = await supabase
    .from('assignment_progress')
    .select('*')
    .eq('id', id)
    .single();

  const completed = existing?.completed || {};
  if (completed[taskKey]) return fromSupabaseProgress(existing);

  const row = {
    id,
    assignment_id: assignmentId,
    student_id: studentId,
    completed: { ...completed, [taskKey]: true },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('assignment_progress')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return fromSupabaseProgress(data);
}

export async function toggleTask(studentId, assignmentId, taskKey) {
  const id = `${studentId}_${assignmentId}`;
  const { data: existing } = await supabase
    .from('assignment_progress')
    .select('*')
    .eq('id', id)
    .single();

  const completed = existing?.completed || {};
  const row = {
    id,
    assignment_id: assignmentId,
    student_id: studentId,
    completed: { ...completed, [taskKey]: !completed[taskKey] },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('assignment_progress')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return fromSupabaseProgress(data);
}

export async function archiveAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select()
    .single();
  if (error) throw error;
  return fromSupabaseAssignment(data);
}

export async function unarchiveAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ archived_at: null })
    .eq('id', assignmentId)
    .select()
    .single();
  if (error) throw error;
  return fromSupabaseAssignment(data);
}

export async function deleteAssignment(assignmentId) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw error;
}

export async function completeTaskForText(studentId, textId, taskKey) {
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('text_id', textId);

  const matching = (assignments || []).filter(a => a.tasks?.[taskKey]);
  const results = [];
  for (const a of matching) {
    const result = await markTaskComplete(studentId, a.id, taskKey);
    results.push(result);
  }
  return results;
}

function fromSupabaseAssignment(row) {
  return {
    id: row.id,
    classId: row.class_id,
    textId: row.text_id,
    title: row.title,
    tasks: row.tasks || {},
    dueDate: row.due_date,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  };
}

function fromSupabaseProgress(row) {
  if (!row) return null;
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    completed: row.completed || {},
    updatedAt: row.updated_at,
  };
}
