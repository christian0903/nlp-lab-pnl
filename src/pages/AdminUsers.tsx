import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Shield, Trash2, KeyRound, Plus, X, Save, Loader2, Mail, Clock, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface UserRow {
  user_id: string;
  email: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  expertise: string[] | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface RoleRow {
  user_id: string;
  role: string;
}

type AppRole = 'user' | 'moderator' | 'admin';

const ROLE_LABELS: Record<AppRole, string> = {
  user: 'Utilisateur',
  moderator: 'Modérateur',
  admin: 'Administrateur',
};

const AdminUsers = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Inline editing
  const [editingField, setEditingField] = useState<{ userId: string; field: 'name' | 'email' } | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState('');

  const fetchUsers = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      (supabase.rpc as any)('admin_list_users'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    if (usersRes.data) setUsers(usersRes.data as UserRow[]);
    setRoles((rolesRes.data || []) as RoleRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  if (adminLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !isAdmin) return <Navigate to="/admin" replace />;

  const getUserRole = (userId: string): AppRole => {
    const userRoles = roles.filter(r => r.user_id === userId);
    if (userRoles.some(r => r.role === 'admin')) return 'admin';
    if (userRoles.some(r => r.role === 'moderator')) return 'moderator';
    return 'user';
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (userId === user.id) {
      toast.error('Vous ne pouvez pas modifier votre propre rôle');
      return;
    }
    await supabase.from('user_roles').delete().eq('user_id', userId);
    if (newRole !== 'user') {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole } as any);
      if (error) { toast.error('Erreur'); return; }
    }
    setRoles(prev => {
      const filtered = prev.filter(r => r.user_id !== userId);
      if (newRole !== 'user') filtered.push({ user_id: userId, role: newRole });
      return filtered;
    });
    toast.success(`Rôle changé en "${ROLE_LABELS[newRole]}"`);
  };

  const handleResetPassword = async (email: string, displayName: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error('Erreur lors de l\'envoi'); return; }
    toast.success(`Email de réinitialisation envoyé à ${displayName}`);
  };

  const handleDeleteUser = async (userId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
    if (error) { toast.error('Erreur lors de la suppression'); return; }
    setUsers(prev => prev.filter(p => p.user_id !== userId));
    setRoles(prev => prev.filter(r => r.user_id !== userId));
    setDeleteUserId(null);
    toast.success('Profil utilisateur supprimé');
  };

  const handleAddUser = async () => {
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) {
      toast.error('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setAddSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: newEmail.trim(),
      password: newPassword,
      options: {
        data: { display_name: newName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setAddSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Compte créé pour ${newName.trim()}. Un email de confirmation a été envoyé.`);
    setNewEmail(''); setNewName(''); setNewPassword(''); setShowAddForm(false);
    // Refresh
    setTimeout(fetchUsers, 1000);
  };

  const handleSaveName = async (userId: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) { toast.error('Le nom ne peut pas être vide'); return; }
    const { error } = await supabase.from('profiles').update({ display_name: trimmed } as any).eq('user_id', userId);
    if (error) { toast.error('Erreur'); return; }
    setUsers(prev => prev.map(p => p.user_id === userId ? { ...p, display_name: trimmed } : p));
    setEditingField(null);
    toast.success('Nom mis à jour');
  };

  const handleSaveEmail = async (userId: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed) { toast.error('L\'email ne peut pas être vide'); return; }
    const { error } = await (supabase.rpc as any)('admin_update_user_email', {
      _user_id: userId,
      _new_email: trimmed,
    });
    if (error) { toast.error('Erreur : ' + error.message); return; }
    setUsers(prev => prev.map(p => p.user_id === userId ? { ...p, email: trimmed } : p));
    setEditingField(null);
    toast.success('Email mis à jour');
  };

  const handleSaveField = (userId: string) => {
    if (editingField?.field === 'name') handleSaveName(userId);
    else if (editingField?.field === 'email') handleSaveEmail(userId);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Administration
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{users.length} utilisateur(s) inscrit(s)</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:brightness-110 transition-all">
          {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAddForm ? t('common.cancel') : 'Ajouter un utilisateur'}
        </button>
      </div>

      {/* Add user form */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-display text-sm font-semibold text-foreground">Nouveau compte utilisateur</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Nom d'affichage *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Jean Dupont" maxLength={100}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Email *</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Mot de passe * (min 6 car.)</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Mot de passe initial"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAddUser} disabled={addSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {addSubmitting ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteUserId(null)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-display text-lg font-bold text-foreground">Supprimer cet utilisateur ?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Le profil de <strong>"{deleteUserName}"</strong> sera supprimé, ainsi que ses rôles. Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteUserId(null)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                {t('common.cancel')}
              </button>
              <button onClick={() => handleDeleteUser(deleteUserId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <div className="space-y-3">
          {users.map(p => {
            const currentRole = getUserRole(p.user_id);
            const isSelf = p.user_id === user.id;
            const isEditingName = editingField?.userId === p.user_id && editingField.field === 'name';
            const isEditingEmail = editingField?.userId === p.user_id && editingField.field === 'email';

            return (
              <div key={p.user_id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                      : (p.display_name?.[0]?.toUpperCase() || '?')
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="flex items-center gap-2 mb-1">
                      {isEditingName ? (
                        <InlineEdit value={editingValue} onChange={setEditingValue}
                          onSave={() => handleSaveField(p.user_id)} onCancel={() => setEditingField(null)} />
                      ) : (
                        <span className="text-base font-semibold text-foreground">{p.display_name}</span>
                      )}
                      {isSelf && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Vous</span>}
                      {!isSelf && !isEditingName && (
                        <button onClick={() => { setEditingField({ userId: p.user_id, field: 'name' }); setEditingValue(p.display_name); }}
                          className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground" title="Modifier le nom">
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {isEditingEmail ? (
                        <InlineEdit value={editingValue} onChange={setEditingValue}
                          onSave={() => handleSaveField(p.user_id)} onCancel={() => setEditingField(null)} type="email" />
                      ) : (
                        <span className="text-sm text-muted-foreground">{p.email}</span>
                      )}
                      {!isSelf && !isEditingEmail && (
                        <button onClick={() => { setEditingField({ userId: p.user_id, field: 'email' }); setEditingValue(p.email); }}
                          className="rounded p-0.5 text-muted-foreground/40 hover:text-foreground" title="Modifier l'email">
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Inscrit {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: i18n.language?.startsWith('en') ? undefined : fr })}
                      </span>
                      <span>Dernière connexion : {p.last_sign_in_at ? formatDistanceToNow(new Date(p.last_sign_in_at), { addSuffix: true, locale: i18n.language?.startsWith('en') ? undefined : fr }) : <em className="text-muted-foreground/40">jamais</em>}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate max-w-[400px]" title={p.bio || ''}>Bio : {p.bio || <em className="text-muted-foreground/40">non renseignée</em>}</span>
                      <span>Expertise : {p.expertise && p.expertise.length > 0 ? p.expertise.join(', ') : <em className="text-muted-foreground/40">non renseignée</em>}</span>
                    </div>

                    <p className="mt-1 text-[10px] text-muted-foreground/40 font-mono">{p.user_id}</p>
                  </div>

                  {/* Role + Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {isSelf ? (
                      <RoleBadge role={currentRole} />
                    ) : (
                      <select value={currentRole} onChange={e => handleRoleChange(p.user_id, e.target.value as AppRole)}
                        className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium outline-none ring-ring focus:ring-2">
                        <option value="user">Utilisateur</option>
                        <option value="moderator">Modérateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    )}
                    {!isSelf && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleResetPassword(p.email, p.display_name)}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                          title="Réinitialiser le mot de passe">
                          <KeyRound className="h-3 w-3" /> Reset mdp
                        </button>
                        <button onClick={() => { setDeleteUserId(p.user_id); setDeleteUserName(p.display_name); }}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Supprimer l'utilisateur">
                          <Trash2 className="h-3 w-3" /> {t('common.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InlineEdit = ({ value, onChange, onSave, onCancel, type = 'text' }: {
  value: string; onChange: (v: string) => void; onSave: () => void; onCancel: () => void; type?: string;
}) => (
  <div className="flex items-center gap-1">
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      maxLength={200} autoFocus
      onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
      className="w-56 rounded border border-input bg-background px-2 py-0.5 text-sm outline-none ring-ring focus:ring-2" />
    <button onClick={onSave} className="rounded p-0.5 text-secondary hover:bg-secondary/10">
      <Save className="h-3.5 w-3.5" />
    </button>
    <button onClick={onCancel} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

const RoleBadge = ({ role }: { role: AppRole }) => {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
      <ShieldCheck className="h-3 w-3" /> Admin
    </span>
  );
  if (role === 'moderator') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
      <Shield className="h-3 w-3" /> Modérateur
    </span>
  );
  return <span className="text-xs text-muted-foreground">Utilisateur</span>;
};

export default AdminUsers;
