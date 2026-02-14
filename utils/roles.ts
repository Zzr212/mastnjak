export const getRole = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Logic:
  // < 30 days (1 month): Beginner
  // < 90 days (3 months): Senior (As requested)
  // < 300 days (10 months): Pro
  // > 300 days: Expert

  if (diffDays <= 30) return { label: 'Beginner', color: 'text-slate-500', bg: 'bg-slate-100', icon: '🌱' };
  if (diffDays <= 90) return { label: 'Senior', color: 'text-blue-500', bg: 'bg-blue-50', icon: '🔹' };
  if (diffDays <= 300) return { label: 'Pro', color: 'text-indigo-500', bg: 'bg-indigo-50', icon: '⭐' };
  return { label: 'Expert', color: 'text-emerald-500', bg: 'bg-emerald-50', icon: '👑' };
};